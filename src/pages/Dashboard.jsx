import { AlertTriangle, Cpu, FolderOpen, HardDrive, Play, Plus, Power, RefreshCw, Server, TerminalSquare, Timer, Users, Zap } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { MetricCard } from '../components/MetricCard';
import { StatusPill } from '../components/StatusPill';
import { api } from '../services/api';
import { formatUptime } from '../utils/format';

export function Dashboard({ server, status, metrics, playersState, refresh, onAdd }) {
  const currentStatus = status?.status || metrics.status || 'OFFLINE';
  const active = ['STARTING', 'ONLINE'].includes(currentStatus);
  const stopping = currentStatus === 'STOPPING';
  const canStart = server && !['STARTING', 'ONLINE', 'STOPPING'].includes(currentStatus);
  const canStop = server && ['STARTING', 'ONLINE'].includes(currentStatus);

  if (!server) {
    return (
      <div className="flex h-full items-center justify-center p-5">
        <div className="w-full max-w-md animate-page-enter rounded-2xl border border-neon/20 bg-panel2/60 p-8 text-center shadow-[0_0_40px_rgba(52,241,123,0.1)] backdrop-blur-xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-neon/10">
            <Server className="h-8 w-8 text-neon" />
          </div>
          <h2 className="text-2xl font-bold text-white">No Servers Found</h2>
          <p className="mt-2 text-zinc-400">Create your first local Minecraft server to start playing and managing everything from one place.</p>
          <button className="btn primary mt-8 w-full" onClick={onAdd}>
            <Plus className="h-5 w-5" /> Add Server
          </button>
        </div>
      </div>
    );
  }

  async function action(channel) {
    if (!server) return;
    await api.invoke(channel, server.id);
    refresh?.();
  }

  return (
    <div className="space-y-5 p-5">
      <div className="rounded-xl border border-line bg-panel/80 p-5 transition-all hover:shadow-[0_0_20px_rgba(52,241,123,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <StatusPill status={currentStatus} />
              <span className="inline-flex items-center gap-2 rounded-full border border-line bg-black/20 px-3 py-1 text-xs font-semibold text-zinc-400">
                <span className={metrics.playitStatus === 'PLAYIT ONLINE' ? 'h-2 w-2 rounded-full bg-neon' : 'h-2 w-2 rounded-full bg-zinc-600'} />
                {metrics.playitStatus || status?.playitStatus || 'PLAYIT STOPPED'}
              </span>
            </div>
            <h3 className="text-2xl font-bold">{server?.name || 'Select a server'}</h3>
            <p className="mt-1 text-sm text-zinc-500">{server ? `${server.serverType} - ${server.jarName}` : 'No server loaded'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn primary" disabled={!canStart} onClick={() => action('server:start')}><Play className="h-4 w-4" /> Start</button>
            <button className="btn ghost" disabled={!canStop || stopping} onClick={() => action('server:stop')}><Power className="h-4 w-4" /> Stop Server</button>
            <button className="btn ghost" disabled={!server || stopping} onClick={() => action('server:restart')}><RefreshCw className="h-4 w-4" /> Restart</button>
            <button className="btn ghost" disabled={!server} onClick={() => action('server:open-folder')}><FolderOpen className="h-4 w-4" /> Folder</button>
            <button className="btn ghost" disabled={!server} onClick={() => action('server:open-terminal')}><TerminalSquare className="h-4 w-4" /> Terminal</button>
            <button className="btn ghost" disabled={!server} onClick={() => action('backups:create')}><HardDrive className="h-4 w-4" /> Backup</button>
          </div>
        </div>
      </div>

      {currentStatus === 'CRASHED' && (
        <div className="rounded-xl border border-danger/40 bg-danger/10 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 font-semibold text-danger"><AlertTriangle className="h-5 w-5" /> Crash detected</div>
              <p className="mt-2 text-sm text-zinc-300">{status?.crashReason || metrics.crashReason || 'The server process exited unexpectedly.'}</p>
              <pre className="mt-3 max-h-32 overflow-auto rounded-lg bg-black/35 p-3 text-xs text-zinc-400">{(status?.lastLogs || metrics.lastLogs || []).slice(-6).join('\n')}</pre>
            </div>
            <button className="btn primary" onClick={() => action('server:start')}><RefreshCw className="h-4 w-4" /> Restart Server</button>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <MetricCard icon={Cpu} label="CPU" value={`${metrics.cpu || 0}%`} />
        <MetricCard icon={HardDrive} label="RAM" value={`${metrics.memory || 0} MB`} accent="text-neon2" />
        <MetricCard icon={Timer} label="Uptime" value={active ? formatUptime(metrics.uptime || 0) : '00:00:00'} />
        <MetricCard icon={Zap} label="Java PID" value={metrics.pid || status?.pid || '-'} accent="text-warn" />
        <MetricCard icon={ActivityIcon} label="TPS" value={metrics.tps || 20} />
        <MetricCard icon={Users} label="Players" value={playersState?.onlineCount ?? metrics.players ?? 0} accent="text-neon2" />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <div className="h-80 rounded-xl border border-line bg-panel/80 p-5 transition-all hover:shadow-[0_0_20px_rgba(52,241,123,0.05)]">
          <h4 className="mb-4 font-semibold">CPU Usage</h4>
          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={metrics.history || []}>
              <defs><linearGradient id="cpu" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#34f17b" stopOpacity={0.45}/><stop offset="95%" stopColor="#34f17b" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid stroke="#1f2937" /><XAxis dataKey="time" stroke="#71717a" /><YAxis stroke="#71717a" /><Tooltip contentStyle={{ background: '#111827', border: '1px solid #1f2937' }} />
              <Area type="monotone" dataKey="cpu" stroke="#34f17b" fill="url(#cpu)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="h-80 rounded-xl border border-line bg-panel/80 p-5 transition-all hover:shadow-[0_0_20px_rgba(52,241,123,0.05)]">
          <h4 className="mb-4 font-semibold">Memory Usage</h4>
          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={metrics.history || []}>
              <defs><linearGradient id="ram" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00d4ff" stopOpacity={0.45}/><stop offset="95%" stopColor="#00d4ff" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid stroke="#1f2937" /><XAxis dataKey="time" stroke="#71717a" /><YAxis stroke="#71717a" /><Tooltip contentStyle={{ background: '#111827', border: '1px solid #1f2937' }} />
              <Area type="monotone" dataKey="memory" stroke="#00d4ff" fill="url(#ram)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function ActivityIcon(props) {
  return <Zap {...props} />;
}
