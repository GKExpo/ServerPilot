const fs = require('fs');
const path = require('path');

const textExtensions = new Set(['.yml', '.yaml', '.json', '.txt', '.properties', '.log', '.md', '.cfg', '.conf', '.toml']);

function resolveInside(root, relativePath = '') {
  const base = path.resolve(root);
  const target = path.resolve(base, relativePath || '.');
  if (target !== base && !target.startsWith(base + path.sep)) throw new Error('Path escapes the server folder');
  return target;
}

async function statEntry(root, name) {
  const fullPath = path.join(root, name);
  const stat = await fs.promises.stat(fullPath);
  return {
    name,
    relativePath: path.relative(root, fullPath),
    isDirectory: stat.isDirectory(),
    size: stat.size,
    updatedAt: stat.mtimeMs
  };
}

function getServerRoot(storeApi, id) {
  const server = storeApi.getServer(id);
  if (!server?.folderPath || !fs.existsSync(server.folderPath)) throw new Error('Server folder not found');
  return server.folderPath;
}

function createFileHandlers({ ipcMain, storeApi }) {
  ipcMain.handle('files:list', async (_event, { id, relativePath = '' }) => {
    const root = getServerRoot(storeApi, id);
    const folder = resolveInside(root, relativePath);
    const entries = await fs.promises.readdir(folder);
    const result = await Promise.all(entries.map(async (name) => {
      const full = path.join(folder, name);
      const stat = await fs.promises.stat(full);
      return {
        name,
        relativePath: path.relative(root, full),
        isDirectory: stat.isDirectory(),
        size: stat.size,
        updatedAt: stat.mtimeMs
      };
    }));
    return result.sort((a, b) => Number(b.isDirectory) - Number(a.isDirectory) || a.name.localeCompare(b.name));
  });

  ipcMain.handle('files:read', async (_event, { id, relativePath }) => {
    const root = getServerRoot(storeApi, id);
    const file = resolveInside(root, relativePath);
    const ext = path.extname(file).toLowerCase();
    if (!textExtensions.has(ext)) throw new Error(`Unsupported text file type: ${ext || 'none'}`);
    const stat = await fs.promises.stat(file);
    if (stat.size > 1024 * 1024 * 4) throw new Error('File is too large to edit safely');
    return { content: await fs.promises.readFile(file, 'utf8'), language: ext.slice(1) || 'text' };
  });

  ipcMain.handle('files:write', async (_event, { id, relativePath, content }) => {
    const root = getServerRoot(storeApi, id);
    const file = resolveInside(root, relativePath);
    await fs.promises.writeFile(file, String(content ?? ''), 'utf8');
    return true;
  });

  ipcMain.handle('files:create', async (_event, { id, relativePath, type }) => {
    const root = getServerRoot(storeApi, id);
    const target = resolveInside(root, relativePath);
    if (type === 'folder') await fs.promises.mkdir(target, { recursive: true });
    else await fs.promises.writeFile(target, '', { flag: 'wx' });
    return true;
  });

  ipcMain.handle('files:delete', async (_event, { id, relativePath }) => {
    const root = getServerRoot(storeApi, id);
    const target = resolveInside(root, relativePath);
    await fs.promises.rm(target, { recursive: true, force: true });
    return true;
  });

  ipcMain.handle('files:rename', async (_event, { id, relativePath, nextName }) => {
    if (!nextName || nextName.includes('/') || nextName.includes('\\')) throw new Error('Invalid file name');
    const root = getServerRoot(storeApi, id);
    const current = resolveInside(root, relativePath);
    const next = resolveInside(root, path.join(path.dirname(relativePath), nextName));
    await fs.promises.rename(current, next);
    return true;
  });

  ipcMain.handle('properties:get', async (_event, id) => {
    const root = getServerRoot(storeApi, id);
    const propsPath = resolveInside(root, 'server.properties');
    const jsonFiles = ['ops.json', 'whitelist.json', 'banned-players.json'];
    const properties = {};
    if (fs.existsSync(propsPath)) {
      const lines = (await fs.promises.readFile(propsPath, 'utf8')).split(/\r?\n/);
      for (const line of lines) {
        if (!line || line.trim().startsWith('#') || !line.includes('=')) continue;
        const [key, ...rest] = line.split('=');
        properties[key.trim()] = rest.join('=').trim();
      }
    }
    const json = {};
    for (const file of jsonFiles) {
      const full = resolveInside(root, file);
      if (fs.existsSync(full)) {
        try { json[file] = JSON.parse(await fs.promises.readFile(full, 'utf8')); }
        catch { json[file] = []; }
      } else {
        json[file] = [];
      }
    }
    return { properties, json };
  });

  ipcMain.handle('properties:save', async (_event, { id, properties, json }) => {
    const root = getServerRoot(storeApi, id);
    const lines = ['#Minecraft server properties', `#Edited by ServerPilot ${new Date().toISOString()}`];
    for (const [key, value] of Object.entries(properties || {})) lines.push(`${key}=${value}`);
    await fs.promises.writeFile(resolveInside(root, 'server.properties'), lines.join('\n'), 'utf8');
    for (const [file, value] of Object.entries(json || {})) {
      if (!['ops.json', 'whitelist.json', 'banned-players.json'].includes(file)) continue;
      await fs.promises.writeFile(resolveInside(root, file), JSON.stringify(value, null, 2), 'utf8');
    }
    return true;
  });
}

module.exports = { createFileHandlers };
