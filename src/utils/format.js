export function formatBytes(bytes = 0) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index ? 1 : 0)} ${units[index]}`;
}

export function formatUptime(seconds = 0) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':');
}

export function languageFromName(name = '') {
  const ext = name.split('.').pop()?.toLowerCase();
  if (['yml', 'yaml'].includes(ext)) return 'yaml';
  if (ext === 'json') return 'json';
  if (ext === 'properties') return 'ini';
  return 'plaintext';
}
