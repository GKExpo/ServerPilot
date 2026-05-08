const fs = require('fs');
const path = require('path');
const Store = require('electron-store');
const { randomUUID } = require('crypto');
const { defaultSettings, defaultServer } = require('../../backend/defaults');

function normalizeServer(input, settings) {
  const now = new Date().toISOString();
  return {
    ...defaultServer,
    javaPath: settings.defaultJavaPath || defaultServer.javaPath,
    ramMin: settings.defaultRamMin || defaultServer.ramMin,
    ramMax: settings.defaultRamMax || defaultServer.ramMax,
    autoStartPlayit: settings.autoStartPlayit,
    ...input,
    id: input.id || randomUUID(),
    createdAt: input.createdAt || now,
    updatedAt: now
  };
}

function createStorageHandlers({ ipcMain, app }) {
  const store = new Store({
    name: 'serverpilot',
    defaults: { servers: [], settings: defaultSettings }
  });

  const api = {
    getServers() {
      return store.get('servers', []);
    },
    setServers(servers) {
      store.set('servers', servers);
      return servers;
    },
    getSettings() {
      return { ...defaultSettings, ...store.get('settings', {}) };
    },
    setSettings(settings) {
      const merged = { ...api.getSettings(), ...settings };
      store.set('settings', merged);
      return merged;
    },
    getServer(id) {
      return api.getServers().find((server) => server.id === id);
    },
    upsertServer(input) {
      const settings = api.getSettings();
      const servers = api.getServers();
      const index = servers.findIndex((server) => server.id === input.id);
      const next = normalizeServer(input, settings);
      if (index >= 0) servers[index] = { ...servers[index], ...next, id: servers[index].id };
      else servers.push(next);
      api.setServers(servers);
      return index >= 0 ? servers[index] : next;
    },
    removeServer(id) {
      const next = api.getServers().filter((server) => server.id !== id);
      api.setServers(next);
      return next;
    },
    exportDataPath() {
      return path.join(app.getPath('userData'), 'serverpilot.json');
    }
  };

  ipcMain.handle('app:data:get', () => ({
    servers: api.getServers(),
    settings: api.getSettings()
  }));

  ipcMain.handle('settings:update', (_event, settings) => api.setSettings(settings || {}));

  ipcMain.handle('server:add', (_event, server) => api.upsertServer(server || {}));
  ipcMain.handle('server:update', (_event, server) => {
    if (!server || !server.id) throw new Error('Missing server id');
    return api.upsertServer(server);
  });
  ipcMain.handle('server:remove', (_event, id) => api.removeServer(id));

  ipcMain.handle('dialog:select-folder', async () => {
    const result = await require('electron').dialog.showOpenDialog({ properties: ['openDirectory'] });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle('dialog:select-file', async (_event, options = {}) => {
    const result = await require('electron').dialog.showOpenDialog({
      properties: ['openFile'],
      filters: options.filters || [{ name: 'Executables and JARs', extensions: ['exe', 'jar', '*'] }]
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle('server:detect', async (_event, folderPath) => {
    if (!folderPath || !fs.existsSync(folderPath)) throw new Error('Folder does not exist');
    const entries = await fs.promises.readdir(folderPath);
    const jars = entries.filter((entry) => entry.toLowerCase().endsWith('.jar'));
    const preferred = jars.find((jar) => /paper/i.test(jar)) || jars.find((jar) => /fabric/i.test(jar)) || jars.find((jar) => /forge/i.test(jar)) || jars[0] || '';
    const lower = preferred.toLowerCase();
    const serverType = lower.includes('paper') ? 'Paper' : lower.includes('fabric') ? 'Fabric' : lower.includes('forge') ? 'Forge' : lower ? 'Vanilla' : 'Unknown';
    return {
      jarName: preferred,
      serverType,
      hasProperties: entries.includes('server.properties'),
      hasOps: entries.includes('ops.json'),
      hasWhitelist: entries.includes('whitelist.json')
    };
  });

  return api;
}

module.exports = { createStorageHandlers };
