import { FolderOpen, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../services/api';

export function Settings({ settings, onSaved }) {
  const [form, setForm] = useState(settings);
  useEffect(() => setForm(settings), [settings]);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  async function pick(key) {
    const file = await api.invoke('dialog:select-file');
    if (file) update(key, file);
  }

  async function save() {
    const saved = await api.invoke('settings:update', form);
    onSaved(saved);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-5">
      <div>
        <h3 className="text-xl font-semibold">Settings</h3>
        <p className="text-sm text-zinc-500">Defaults apply to newly added servers and global automation.</p>
      </div>
      <div className="grid gap-4 rounded-xl border border-line bg-panel p-5 md:grid-cols-2">
        <label className="field md:col-span-2">Default Java path<div className="input-row"><input value={form.defaultJavaPath || ''} onChange={(e) => update('defaultJavaPath', e.target.value)} /><button onClick={() => pick('defaultJavaPath')}><FolderOpen className="h-4 w-4" /></button></div></label>
        <label className="field">Default min RAM<input value={form.defaultRamMin || ''} onChange={(e) => update('defaultRamMin', e.target.value)} /></label>
        <label className="field">Default max RAM<input value={form.defaultRamMax || ''} onChange={(e) => update('defaultRamMax', e.target.value)} /></label>
        <label className="field md:col-span-2">Playit executable<div className="input-row"><input value={form.playitPath || ''} onChange={(e) => update('playitPath', e.target.value)} /><button onClick={() => pick('playitPath')}><FolderOpen className="h-4 w-4" /></button></div></label>
        <label className="flex items-center gap-3 rounded-lg border border-line bg-black/20 p-4 text-sm"><input type="checkbox" checked={!!form.autoStartPlayit} onChange={(e) => update('autoStartPlayit', e.target.checked)} /> Auto-start Playit when servers launch</label>
        <label className="flex items-center gap-3 rounded-lg border border-line bg-black/20 p-4 text-sm"><input type="checkbox" checked={!!form.autoRestartCrashed} onChange={(e) => update('autoRestartCrashed', e.target.checked)} /> Auto-restart crashed servers</label>
        <label className="field md:col-span-2">Theme<select value={form.theme || 'neon'} onChange={(e) => update('theme', e.target.value)}><option value="neon">Neon green gamer</option><option value="dark">Dark mode</option></select></label>
      </div>
      <button className="btn primary" onClick={save}><Save className="h-4 w-4" /> Save Settings</button>
    </div>
  );
}
