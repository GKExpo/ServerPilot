import { Plus, Server, Settings, Trash2, Pencil } from 'lucide-react';
import clsx from 'clsx';
import { StatusPill } from './StatusPill';

export function Sidebar({ servers, selectedId, statuses, onSelect, onAdd, onEdit, onRemove }) {
  return (
    <aside className="flex h-full w-80 flex-col border-r border-line bg-[#090d14]">
      <div className="border-b border-line p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg border border-neon/30 bg-neon/10 shadow-glow">
            <Server className="h-5 w-5 text-neon" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">ServerPilot</h1>
            <p className="text-xs text-zinc-500">Minecraft control deck</p>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-3">
        <button onClick={onAdd} className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg border border-neon/30 bg-neon/10 px-4 py-3 text-sm font-semibold text-neon hover:bg-neon/15">
          <Plus className="h-4 w-4" /> Add Server
        </button>
        <div className="space-y-2">
          {servers.map((server) => (
            <button key={server.id} onClick={() => onSelect(server.id)} className={clsx('group w-full rounded-lg border p-3 text-left transition', selectedId === server.id ? 'border-neon/40 bg-neon/10 shadow-glow' : 'border-line bg-panel hover:border-zinc-600')}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-semibold text-zinc-100">{server.name}</div>
                  <div className="mt-1 truncate text-xs text-zinc-500">{server.serverType} · {server.ramMin}-{server.ramMax}</div>
                </div>
                <StatusPill status={statuses[server.id]?.status || 'OFFLINE'} />
              </div>
              <div className="mt-3 flex items-center justify-end gap-1 opacity-0 transition group-hover:opacity-100">
                <span onClick={(e) => { e.stopPropagation(); onEdit(server); }} className="rounded p-1 text-zinc-400 hover:bg-white/5 hover:text-white"><Pencil className="h-4 w-4" /></span>
                <span onClick={(e) => { e.stopPropagation(); onRemove(server.id); }} className="rounded p-1 text-zinc-400 hover:bg-danger/10 hover:text-danger"><Trash2 className="h-4 w-4" /></span>
              </div>
            </button>
          ))}
          {servers.length === 0 && <div className="rounded-lg border border-dashed border-line p-4 text-sm text-zinc-500">Add a server folder to begin.</div>}
        </div>
      </div>
      <div className="border-t border-line p-4 text-xs text-zinc-500">
        <div className="flex items-center gap-2"><Settings className="h-4 w-4" /> Built for local Windows hosting</div>
      </div>
    </aside>
  );
}
