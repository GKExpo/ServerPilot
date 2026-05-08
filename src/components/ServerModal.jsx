import { useEffect, useState } from 'react';
import { FolderOpen, Save, X } from 'lucide-react';
import { api } from '../services/api';

const serverTypes = ['Paper', 'Fabric', 'Forge', 'Vanilla', 'Unknown'];

export function ServerModal({ open, server, settings, onClose, onSaved }) {
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        name: '',
        folderPath: '',
        jarName: '',
        javaPath: settings.defaultJavaPath || 'java',
        ramMin: settings.defaultRamMin || '2G',
        ramMax: settings.defaultRamMax || '4G',
        jvmArgs: '',
        serverType: 'Paper',
        autoStartPlayit: settings.autoStartPlayit,
        playitPath: settings.playitPath || '',
        ...server
      });
    }
  }, [open, server, settings]);

  if (!open || !form) return null;
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  async function pickFolder() {
    const folder = await api.invoke('dialog:select-folder');
    if (!folder) return;
    update('folderPath', folder);
    const detected = await api.invoke('server:detect', folder);
    setForm((current) => ({
      ...current,
      folderPath: folder,
      jarName: current.jarName || detected.jarName,
      serverType: detected.serverType,
      name: current.name || folder.split(/[\\/]/).pop()
    }));
  }

  async function pickExecutable(key) {
    const file = await api.invoke('dialog:select-file');
    if (file) update(key, file);
  }

  async function save() {
    setBusy(true);
    try {
      const saved = await api.invoke(form.id ? 'server:update' : 'server:add', form);
      onSaved(saved);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/70 p-6 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-xl border border-line bg-panel2 shadow-2xl">
        <div className="flex items-center justify-between border-b border-line p-5">
          <h2 className="text-lg font-semibold text-zinc-100">{form.id ? 'Edit Server' : 'Add Server'}</h2>
          <button onClick={onClose} className="rounded-md p-2 text-zinc-400 hover:bg-white/5 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <label className="field">Server name<input value={form.name} onChange={(e) => update('name', e.target.value)} /></label>
          <label className="field">Server type<select value={form.serverType} onChange={(e) => update('serverType', e.target.value)}>{serverTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
          <label className="field md:col-span-2">Folder path<div className="input-row"><input value={form.folderPath} onChange={(e) => update('folderPath', e.target.value)} /><button onClick={pickFolder}><FolderOpen className="h-4 w-4" /></button></div></label>
          <label className="field">Server JAR<input value={form.jarName} onChange={(e) => update('jarName', e.target.value)} placeholder="paper.jar" /></label>
          <label className="field">Java executable<div className="input-row"><input value={form.javaPath} onChange={(e) => update('javaPath', e.target.value)} /><button onClick={() => pickExecutable('javaPath')}><FolderOpen className="h-4 w-4" /></button></div></label>
          <label className="field">Min RAM<input value={form.ramMin} onChange={(e) => update('ramMin', e.target.value)} placeholder="2G" /></label>
          <label className="field">Max RAM<input value={form.ramMax} onChange={(e) => update('ramMax', e.target.value)} placeholder="4G" /></label>
          <label className="field md:col-span-2">JVM arguments<input value={form.jvmArgs} onChange={(e) => update('jvmArgs', e.target.value)} placeholder="Optional tuning only, example: -XX:+UseG1GC" /></label>
          <label className="field md:col-span-2">Playit executable<div className="input-row"><input value={form.playitPath} onChange={(e) => update('playitPath', e.target.value)} /><button onClick={() => pickExecutable('playitPath')}><FolderOpen className="h-4 w-4" /></button></div></label>
          <label className="flex items-center gap-3 text-sm text-zinc-300"><input type="checkbox" checked={!!form.autoStartPlayit} onChange={(e) => update('autoStartPlayit', e.target.checked)} /> Auto-start Playit with this server</label>
        </div>
        <div className="flex justify-end gap-3 border-t border-line p-5">
          <button className="btn ghost" onClick={onClose}>Cancel</button>
          <button className="btn primary" onClick={save} disabled={busy || !form.name || !form.folderPath || !form.jarName}><Save className="h-4 w-4" /> Save Server</button>
        </div>
      </div>
    </div>
  );
}
