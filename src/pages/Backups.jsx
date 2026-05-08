import { Archive, RefreshCw, RotateCcw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { formatBytes } from '../utils/format';

export function Backups({ server }) {
  const [backups, setBackups] = useState([]);
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!server) return setBackups([]);
    setBackups(await api.invoke('backups:list', server.id));
  }

  useEffect(() => { load(); }, [server?.id]);

  async function create() {
    setBusy(true);
    try {
      await api.invoke('backups:create', server.id);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function restore(backup) {
    if (!confirm(`Restore ${backup.name}? This overwrites matching server files.`)) return;
    await api.invoke('backups:restore', { id: server.id, backupPath: backup.fullPath });
  }

  return (
    <div className="space-y-5 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Backup History</h3>
          <p className="text-sm text-zinc-500">Backups are stored in the server's backups folder.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn ghost" disabled={!server} onClick={load}><RefreshCw className="h-4 w-4" /> Refresh</button>
          <button className="btn primary" disabled={!server || busy} onClick={create}><Archive className="h-4 w-4" /> Backup Server</button>
        </div>
      </div>
      <div className="rounded-xl border border-line bg-panel">
        {backups.map((backup) => (
          <div key={backup.fullPath} className="flex items-center justify-between gap-4 border-b border-line px-5 py-4 last:border-0">
            <div className="min-w-0">
              <div className="truncate font-semibold">{backup.name}</div>
              <div className="text-sm text-zinc-500">{new Date(backup.createdAt).toLocaleString()} · {formatBytes(backup.size)}</div>
            </div>
            <button className="btn ghost" onClick={() => restore(backup)}><RotateCcw className="h-4 w-4" /> Restore</button>
          </div>
        ))}
        {backups.length === 0 && <div className="p-8 text-center text-zinc-500">No backups yet.</div>}
      </div>
    </div>
  );
}
