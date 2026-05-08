import Editor from '@monaco-editor/react';
import { File, Folder, FolderPlus, RefreshCw, Save, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { formatBytes, languageFromName } from '../utils/format';

export function Files({ server }) {
  const [path, setPath] = useState('');
  const [entries, setEntries] = useState([]);
  const [openFile, setOpenFile] = useState(null);
  const [content, setContent] = useState('');

  async function load(nextPath = path) {
    if (!server) return;
    setEntries(await api.invoke('files:list', { id: server.id, relativePath: nextPath }));
    setPath(nextPath);
  }

  useEffect(() => { load(''); setOpenFile(null); }, [server?.id]);

  async function open(entry) {
    if (entry.isDirectory) return load(entry.relativePath);
    const data = await api.invoke('files:read', { id: server.id, relativePath: entry.relativePath });
    setOpenFile(entry);
    setContent(data.content);
  }

  async function create(type) {
    const name = prompt(type === 'folder' ? 'Folder name' : 'File name');
    if (!name) return;
    await api.invoke('files:create', { id: server.id, relativePath: path ? `${path}\\${name}` : name, type });
    load();
  }

  async function remove(entry) {
    if (!confirm(`Delete ${entry.name}?`)) return;
    await api.invoke('files:delete', { id: server.id, relativePath: entry.relativePath });
    if (openFile?.relativePath === entry.relativePath) setOpenFile(null);
    load();
  }

  async function save() {
    await api.invoke('files:write', { id: server.id, relativePath: openFile.relativePath, content });
  }

  const parent = path.includes('\\') || path.includes('/') ? path.split(/[\\/]/).slice(0, -1).join('\\') : '';

  return (
    <div className="grid h-full grid-cols-[360px_1fr] gap-0">
      <div className="border-r border-line p-4">
        <div className="mb-3 flex gap-2">
          <button className="btn ghost" disabled={!server} onClick={() => load()}><RefreshCw className="h-4 w-4" /></button>
          <button className="btn ghost" disabled={!server} onClick={() => create('folder')}><FolderPlus className="h-4 w-4" /></button>
          <button className="btn ghost" disabled={!server} onClick={() => create('file')}><File className="h-4 w-4" /></button>
        </div>
        <button className="mb-3 text-sm text-zinc-400 hover:text-neon" onClick={() => load(parent)}>/{path || 'server root'}</button>
        <div className="space-y-1 overflow-auto">
          {entries.map((entry) => (
            <div key={entry.relativePath} className="group flex items-center gap-2 rounded-md px-2 py-2 hover:bg-white/5">
              <button className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => open(entry)}>
                {entry.isDirectory ? <Folder className="h-4 w-4 text-neon" /> : <File className="h-4 w-4 text-zinc-400" />}
                <span className="truncate text-sm">{entry.name}</span>
                {!entry.isDirectory && <span className="ml-auto text-xs text-zinc-600">{formatBytes(entry.size)}</span>}
              </button>
              <button className="opacity-0 group-hover:opacity-100" onClick={() => remove(entry)}><Trash2 className="h-4 w-4 text-zinc-500 hover:text-danger" /></button>
            </div>
          ))}
        </div>
      </div>
      <div className="min-w-0 p-4">
        {openFile ? (
          <div className="flex h-full flex-col rounded-lg border border-line bg-panel">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <div className="truncate text-sm font-semibold">{openFile.relativePath}</div>
              <button className="btn primary" onClick={save}><Save className="h-4 w-4" /> Save</button>
            </div>
            <Editor theme="vs-dark" language={languageFromName(openFile.name)} value={content} onChange={(value) => setContent(value || '')} options={{ minimap: { enabled: false }, fontSize: 14, wordWrap: 'on' }} />
          </div>
        ) : (
          <div className="grid h-full place-items-center rounded-lg border border-dashed border-line text-zinc-500">Open a YAML, JSON, TXT, properties, or config file.</div>
        )}
      </div>
    </div>
  );
}
