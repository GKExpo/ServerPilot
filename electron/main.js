const path = require('path');
const { app, BrowserWindow, ipcMain, dialog, shell, Notification } = require('electron');
const { createStorageHandlers } = require('./ipc/storage');
const { createServerHandlers } = require('./ipc/serverManager');
const { createFileHandlers } = require('./ipc/fileManager');
const { createBackupHandlers } = require('./ipc/backupManager');

app.setPath('userData', path.join(app.getPath('appData'), 'serverpilot-v2'));

let mainWindow;

function send(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send(channel, payload);
}

function notify(title, body) {
  if (Notification.isSupported()) new Notification({ title, body }).show();
  send('toast', { title, body });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1480,
    height: 900,
    minWidth: 1040,
    minHeight: 680,
    backgroundColor: '#070a0f',
    title: 'ServerPilot V2',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      webviewTag: false
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist-renderer', 'index.html'));
  }
}

app.whenReady().then(() => {
  const deps = { app, ipcMain, dialog, shell, send, notify };
  const storeApi = createStorageHandlers(deps);
  createServerHandlers({ ...deps, storeApi });
  createFileHandlers({ ...deps, storeApi });
  createBackupHandlers({ ...deps, storeApi });
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });

  app.on('web-contents-created', (event, contents) => {
    contents.on('will-attach-webview', (e) => {
      e.preventDefault();
    });
    contents.setWindowOpenHandler(() => {
      return { action: 'deny' };
    });
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
