const { contextBridge, ipcRenderer } = require('electron');

const validChannels = new Set([
  'app:data:get',
  'settings:update',
  'dialog:select-folder',
  'dialog:select-file',
  'server:detect',
  'server:add',
  'server:update',
  'server:remove',
  'server:start',
  'server:stop',
  'server:restart',
  'server:kill',
  'server:command',
  'server:open-folder',
  'server:open-terminal',
  'metrics:get',
  'files:list',
  'files:read',
  'files:write',
  'files:create',
  'files:delete',
  'files:rename',
  'properties:get',
  'properties:save',
  'backups:create',
  'backups:list',
  'backups:restore'
]);

const eventChannels = new Set(['server:log', 'server:status', 'server:metrics', 'server:players', 'toast']);

contextBridge.exposeInMainWorld('serverPilot', {
  invoke(channel, payload) {
    if (!validChannels.has(channel)) throw new Error(`Blocked IPC channel: ${channel}`);
    return ipcRenderer.invoke(channel, payload);
  },
  on(channel, callback) {
    if (!eventChannels.has(channel)) throw new Error(`Blocked IPC event: ${channel}`);
    const listener = (_event, data) => callback(data);
    ipcRenderer.on(channel, listener);
    return () => ipcRenderer.removeListener(channel, listener);
  }
});
