const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const extract = require('extract-zip');

function resolveServer(storeApi, id) {
  const server = storeApi.getServer(id);
  if (!server?.folderPath || !fs.existsSync(server.folderPath)) throw new Error('Server folder not found');
  return server;
}

function createBackupHandlers({ ipcMain, notify, storeApi }) {
  ipcMain.handle('backups:list', async (_event, id) => {
    const server = resolveServer(storeApi, id);
    const backupDir = path.join(server.folderPath, 'backups');
    await fs.promises.mkdir(backupDir, { recursive: true });
    const entries = await fs.promises.readdir(backupDir);
    const backups = await Promise.all(entries.filter((name) => name.endsWith('.zip')).map(async (name) => {
      const fullPath = path.join(backupDir, name);
      const stat = await fs.promises.stat(fullPath);
      return { name, fullPath, size: stat.size, createdAt: stat.birthtimeMs || stat.mtimeMs };
    }));
    return backups.sort((a, b) => b.createdAt - a.createdAt);
  });

  ipcMain.handle('backups:create', async (_event, id) => {
    const server = resolveServer(storeApi, id);
    const backupDir = path.join(server.folderPath, 'backups');
    await fs.promises.mkdir(backupDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outPath = path.join(backupDir, `${server.name.replace(/[^a-z0-9-_]+/gi, '-')}-${stamp}.zip`);
    await new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outPath);
      const archive = archiver('zip', { zlib: { level: 9 } });
      output.on('close', resolve);
      archive.on('error', reject);
      archive.pipe(output);
      archive.glob('**/*', { cwd: server.folderPath, ignore: ['backups/**'] });
      archive.finalize();
    });
    notify('Backup completed', `${server.name} backup is ready.`);
    return { fullPath: outPath, name: path.basename(outPath) };
  });

  ipcMain.handle('backups:restore', async (_event, { id, backupPath }) => {
    const server = resolveServer(storeApi, id);
    if (!backupPath || path.dirname(backupPath) !== path.join(server.folderPath, 'backups')) throw new Error('Invalid backup path');
    await extract(backupPath, { dir: server.folderPath });
    notify('Backup restored', `${server.name} was restored from ${path.basename(backupPath)}.`);
    return true;
  });
}

module.exports = { createBackupHandlers };
