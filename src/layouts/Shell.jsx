import { Activity, Archive, FileCode2, LayoutDashboard, Settings, TerminalSquare, ToggleLeft, Users } from 'lucide-react';
import clsx from 'clsx';
import { Sidebar } from '../components/Sidebar';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'console', label: 'Console', icon: TerminalSquare },
  { id: 'players', label: 'Players', icon: Users },
  { id: 'files', label: 'Files', icon: FileCode2 },
  { id: 'properties', label: 'Properties', icon: ToggleLeft },
  { id: 'backups', label: 'Backups', icon: Archive },
  { id: 'settings', label: 'Settings', icon: Settings }
];

export function Shell({ servers, selectedId, statuses, tab, onTab, onSelect, onAdd, onEdit, onRemove, children }) {
  const selected = servers.find((server) => server.id === selectedId);
  return (
    <div className="flex h-screen overflow-hidden bg-void text-zinc-100">
      <Sidebar servers={servers} selectedId={selectedId} statuses={statuses} onSelect={onSelect} onAdd={onAdd} onEdit={onEdit} onRemove={onRemove} />
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-line bg-panel2/60 px-5 py-3 backdrop-blur-xl">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-neon" />
              <h2 className="truncate text-lg font-semibold">{selected?.name || 'No server selected'}</h2>
            </div>
            <p className="mt-1 truncate text-xs text-zinc-500">{selected?.folderPath || 'Add or select a Minecraft server to activate controls.'}</p>
          </div>
          <nav className="flex flex-wrap justify-end gap-2">
            {tabs.map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.id} onClick={() => onTab(item.id)} className={clsx('flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-all duration-300 ease-in-out', tab === item.id ? 'bg-gradient-to-r from-neon to-emerald-400 text-black shadow-[0_0_15px_rgba(52,241,123,0.3)]' : 'text-zinc-400 hover:bg-white/5 hover:text-white')}>
                  <Icon className="h-4 w-4" /> {item.label}
                </button>
              );
            })}
          </nav>
        </header>
        <section key={tab} className="min-h-0 flex-1 overflow-auto animate-page-enter">{children}</section>
      </main>
    </div>
  );
}
