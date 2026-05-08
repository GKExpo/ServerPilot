import {
  Ban,
  CheckCircle2,
  Clock,
  Copy,
  Crown,
  Gamepad2,
  Gauge,
  Heart,
  ListChecks,
  MapPin,
  MessageSquare,
  Pickaxe,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  Swords,
  TerminalSquare,
  UserCheck,
  UserMinus,
  Users
} from 'lucide-react';
import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { formatUptime } from '../utils/format';
import { useInterval } from '../hooks/useInterval';

const activityIcons = {
  join: UserCheck,
  leave: UserMinus,
  chat: MessageSquare,
  death: ShieldAlert,
  advancement: Sparkles,
  command: TerminalSquare,
  kick: ShieldAlert,
  moderation: Ban,
  login: Clock,
  uuid: CheckCircle2
};

const filters = [
  { id: 'all', label: 'All', icon: Users },
  { id: 'online', label: 'Online', icon: UserCheck },
  { id: 'whitelist', label: 'Whitelist', icon: ListChecks },
  { id: 'operators', label: 'Operators', icon: Crown },
  { id: 'banned', label: 'Banned', icon: Ban },
  { id: 'monitoring', label: 'Monitoring', icon: Gauge }
];

export function Players({ server, playersState }) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('username');
  const [filter, setFilter] = useState('all');
  const [selectedName, setSelectedName] = useState('');
  const [now, setNow] = useState(Date.now());
  useInterval(() => setNow(Date.now()), 1000);

  const knownPlayers = useMemo(() => buildKnownPlayers(playersState), [playersState]);
  const selected = useMemo(() => {
    if (!knownPlayers.length) return null;
    return knownPlayers.find((player) => player.username === selectedName) || knownPlayers[0];
  }, [knownPlayers, selectedName]);

  const filteredPlayers = useMemo(() => {
    const list = knownPlayers.filter((player) => {
      if (filter === 'online' && !player.online) return false;
      if (!['all', 'online', 'monitoring'].includes(filter)) return false;
      const needle = `${player.username} ${player.uuid}`.toLowerCase();
      return !query || needle.includes(query.toLowerCase());
    });
    list.sort((a, b) => {
      if (sort === 'duration') return new Date(a.joinTime || 0).getTime() - new Date(b.joinTime || 0).getTime();
      if (sort === 'activity') return new Date(b.lastActivity || 0).getTime() - new Date(a.lastActivity || 0).getTime();
      if (sort === 'status') return Number(b.online) - Number(a.online) || a.username.localeCompare(b.username);
      return a.username.localeCompare(b.username);
    });
    return list;
  }, [knownPlayers, query, sort, filter]);

  const onlineCount = playersState.onlineCount || knownPlayers.filter((player) => player.online).length;
  const totalCount = knownPlayers.length;
  const latest = latestActivityTime(playersState.activity);

  return (
    <div className="space-y-4 p-5">
      <div className="grid gap-4 2xl:grid-cols-[1fr_31rem]">
        <section className="space-y-4">
          <div className="rounded-xl border border-line bg-panel p-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-lg border border-neon/25 bg-neon/10 text-neon">
                  <Users className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-2xl font-bold text-white">Players</h3>
                  <p className="truncate text-sm text-zinc-500">Live player sessions, activity, and moderation for {server?.name || 'this server'}.</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Counter label="Online" value={onlineCount} tone="green" />
                <Counter label="Seen" value={totalCount} tone="blue" />
                <Counter label="Events" value={(playersState.activity || []).length} tone="purple" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-panel p-3">
            <div className="flex flex-wrap gap-2">
              {filters.map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.id} onClick={() => setFilter(item.id)} className={clsx('flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition', filter === item.id ? 'bg-neon text-black' : 'text-zinc-400 hover:bg-white/5 hover:text-white')}>
                    <Icon className="h-4 w-4" /> {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 rounded-xl border border-line bg-panel p-4">
            <div className="relative min-w-72 flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <input className="pl-9" placeholder="Search by username or UUID..." value={query} onChange={(event) => setQuery(event.target.value)} />
            </div>
            <select className="w-48" value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="username">Sort by name</option>
              <option value="status">Sort by status</option>
              <option value="duration">Sort by join time</option>
              <option value="activity">Sort by activity</option>
            </select>
            <div className="flex items-center rounded-lg border border-line bg-black/20 px-3 text-sm text-zinc-500">
              Updated {latest ? timeAgo(latest, now) : 'when logs arrive'}
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {filteredPlayers.map((player) => (
              <PlayerCard key={player.username} player={player} now={now} selected={selected?.username === player.username} onSelect={() => setSelectedName(player.username)} />
            ))}
            {filteredPlayers.length === 0 && (
              <div className="rounded-xl border border-dashed border-line bg-panel p-10 text-center text-zinc-500 xl:col-span-2">
                No player data matches this view yet. Join the server or wait for Minecraft logs to report activity.
              </div>
            )}
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <CompactStatus player={selected} now={now} />
            <CompactActions player={selected} server={server} />
            <CompactFiles player={selected} />
          </div>
        </section>

        <aside className="space-y-4">
          <SelectedPlayerPanel player={selected} now={now} />
          <ActivityPanel activity={playersState.activity || []} />
          <LocationPanel player={selected} />
          <StatisticsPanel player={selected} now={now} />
        </aside>
      </div>
    </div>
  );
}

function buildKnownPlayers(playersState) {
  const map = new Map();
  for (const player of playersState.online || []) {
    map.set(player.username, normalizePlayer(player));
  }
  for (const event of playersState.activity || []) {
    if (!event.username) continue;
    const existing = map.get(event.username);
    if (!existing) {
      map.set(event.username, normalizePlayer({
        username: event.username,
        online: !['leave', 'kick', 'moderation'].includes(event.type),
        status: ['leave', 'kick', 'moderation'].includes(event.type) ? 'Offline' : 'Recently active',
        joinTime: event.at,
        lastActivity: event.at,
        lastActivityText: event.text,
        uuid: 'Pending',
        ping: 'Pending',
        dimension: 'Overworld'
      }));
    } else if (new Date(event.at).getTime() > new Date(existing.lastActivity || 0).getTime()) {
      map.set(event.username, {
        ...existing,
        lastActivity: event.at,
        lastActivityText: event.text,
        online: event.type === 'leave' ? false : existing.online,
        status: event.type === 'leave' ? 'Offline' : existing.status
      });
    }
  }
  return Array.from(map.values());
}

function normalizePlayer(player) {
  return {
    username: player.username,
    online: !!player.online,
    status: player.status || (player.online ? 'Online' : 'Offline'),
    joinTime: player.joinTime || player.lastActivity || new Date().toISOString(),
    lastActivity: player.lastActivity || player.joinTime || new Date().toISOString(),
    lastActivityText: player.lastActivityText || (player.online ? 'Online' : 'Offline'),
    ping: player.ping || 'Pending',
    dimension: player.dimension || 'Overworld',
    uuid: player.uuid || 'Pending'
  };
}

function latestActivityTime(activity = []) {
  if (!activity.length) return null;
  return activity.reduce((latest, item) => Math.max(latest, new Date(item.at).getTime()), 0);
}

function timeAgo(time, now) {
  const seconds = Math.max(0, Math.floor((now - time) / 1000));
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function sessionSeconds(player, now) {
  if (!player?.joinTime) return 0;
  return Math.max(0, Math.floor((now - new Date(player.joinTime).getTime()) / 1000));
}

function Counter({ label, value, tone }) {
  const color = tone === 'blue' ? 'text-neon2' : tone === 'purple' ? 'text-fuchsia-300' : 'text-neon';
  return (
    <div className="min-w-24 rounded-lg border border-line bg-black/20 px-4 py-2">
      <div className="text-xs font-bold uppercase tracking-wide text-zinc-600">{label}</div>
      <div className={clsx('text-2xl font-bold', color)}>{value}</div>
    </div>
  );
}

function PlayerAvatar({ player, large }) {
  const letter = player?.username?.slice(0, 1).toUpperCase() || '?';
  return (
    <div className={clsx('relative grid shrink-0 place-items-center overflow-hidden rounded-lg border border-line bg-[#1b2433]', large ? 'h-16 w-16 text-3xl' : 'h-12 w-12 text-xl')}>
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(52,241,123,.22),transparent_45%),linear-gradient(45deg,rgba(0,212,255,.16),transparent_55%)]" />
      <span className="relative font-black text-neon">{letter}</span>
    </div>
  );
}

function PlayerCard({ player, now, selected, onSelect }) {
  return (
    <button onClick={onSelect} className={clsx('rounded-xl border bg-panel p-4 text-left transition hover:border-neon/40 hover:bg-neon/5', selected ? 'border-neon/50 shadow-glow' : 'border-line')}>
      <div className="flex items-start gap-3">
        <PlayerAvatar player={player} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="truncate text-lg font-bold text-white">{player.username}</div>
            <StatusBadge online={player.online} status={player.status} />
          </div>
          <div className="mt-1 truncate text-sm text-zinc-500">{player.lastActivityText}</div>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <Mini label="Session" value={player.online ? formatUptime(sessionSeconds(player, now)) : timeAgo(new Date(player.lastActivity).getTime(), now)} />
            <Mini label="World" value={player.dimension} />
            <Mini label="Ping" value={player.ping} />
          </div>
        </div>
      </div>
    </button>
  );
}

function StatusBadge({ online, status }) {
  return (
    <span className={clsx('inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-bold uppercase', online ? 'bg-neon/10 text-neon' : 'bg-danger/10 text-danger')}>
      <span className={clsx('h-2 w-2 rounded-full', online ? 'bg-neon' : 'bg-danger')} />
      {online ? status || 'Online' : 'Offline'}
    </span>
  );
}

function Mini({ label, value }) {
  return (
    <div className="min-w-0 rounded-lg border border-line bg-black/20 px-3 py-2">
      <div className="text-[0.66rem] font-bold uppercase tracking-wide text-zinc-600">{label}</div>
      <div className="mt-1 truncate text-sm font-semibold text-zinc-200">{value}</div>
    </div>
  );
}

function SelectedPlayerPanel({ player, now }) {
  return (
    <Panel title="Player Profile">
      <div className="flex items-center gap-4">
        <PlayerAvatar player={player} large />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="truncate text-2xl font-bold text-white">{player?.username || 'No player selected'}</h4>
            {player && <StatusBadge online={player.online} status={player.status} />}
          </div>
          <div className="mt-2 flex min-w-0 items-center gap-2 text-sm text-zinc-500">
            <span className="truncate">{player?.uuid || 'Select a player to inspect live state.'}</span>
            {player?.uuid && player.uuid !== 'Pending' && <Copy className="h-4 w-4 text-zinc-600" />}
          </div>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Info label="Session" value={player?.online ? formatUptime(sessionSeconds(player, now)) : 'Offline'} />
        <Info label="Last Seen" value={player ? timeAgo(new Date(player.lastActivity).getTime(), now) : '-'} />
      </div>
    </Panel>
  );
}

function CompactStatus({ player, now }) {
  return (
    <Panel title="Status">
      <StatusRow label="Health" icon={Heart} value="20 / 20" tone="danger" />
      <StatusRow label="Hunger" icon={Gamepad2} value="20 / 20" tone="warn" />
      <Info label="Join Time" value={player ? new Date(player.joinTime).toLocaleTimeString() : '-'} />
      <Info label="Session" value={player?.online ? formatUptime(sessionSeconds(player, now)) : '-'} />
    </Panel>
  );
}

function CompactActions({ player, server }) {
  return (
    <Panel title="Actions">
      <div className="grid gap-2 sm:grid-cols-2">
        <ActionButton icon={MessageSquare} label="Message" command={`tell ${player?.username || '<player>'} `} disabled={!player || !server} />
        <ActionButton icon={TerminalSquare} label="OP" command={`op ${player?.username || '<player>'}`} disabled={!player || !server} />
        <ActionButton icon={Shield} label="De-OP" command={`deop ${player?.username || '<player>'}`} disabled={!player || !server} />
        <ActionButton icon={Ban} label="Kick" command={`kick ${player?.username || '<player>'}`} disabled={!player || !server} danger />
        <ActionButton icon={Swords} label="Ban" command={`ban ${player?.username || '<player>'}`} disabled={!player || !server} danger />
        <ActionButton icon={MapPin} label="Teleport" command={`tp ${player?.username || '<player>'} `} disabled={!player || !server} />
      </div>
    </Panel>
  );
}

function CompactFiles({ player }) {
  return (
    <Panel title="Files">
      <FileTile icon={Users} label="Player Data" value={player?.uuid || 'Pending'} />
      <FileTile icon={Pickaxe} label="Statistics" value="stats/*.json" />
      <FileTile icon={Sparkles} label="Advancements" value="advancements/*.json" />
    </Panel>
  );
}

function ActionButton({ icon: Icon, label, command, disabled, danger }) {
  return (
    <button type="button" disabled={disabled} title={command} className={clsx('flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold', danger ? 'border-danger/30 bg-danger/10 text-danger' : 'border-line bg-black/20 text-zinc-300 hover:border-neon/30 hover:text-neon')}>
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}

function LocationPanel({ player }) {
  return (
    <Panel title="Location">
      <div className="flex items-center gap-2 rounded-lg border border-line bg-black/20 p-3 font-semibold text-zinc-200"><MapPin className="h-4 w-4 text-neon" /> minecraft:{(player?.dimension || 'Overworld').toLowerCase()}</div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Info label="X" value="Pending" />
        <Info label="Y" value="Pending" />
        <Info label="Z" value="Pending" />
      </div>
    </Panel>
  );
}

function ActivityPanel({ activity }) {
  return (
    <div className="rounded-xl border border-line bg-panel">
      <div className="border-b border-line px-5 py-4 font-semibold text-white">Live Activity</div>
      <div className="max-h-80 overflow-auto p-4">
        {activity.map((item) => {
          const Icon = activityIcons[item.type] || Clock;
          const danger = ['death', 'kick', 'moderation'].includes(item.type);
          return (
            <div key={item.id} className="mb-3 flex gap-3 rounded-lg border border-line bg-black/20 p-3 last:mb-0">
              <div className={clsx('mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg', danger ? 'bg-danger/10 text-danger' : item.type === 'leave' ? 'bg-zinc-700/40 text-zinc-300' : 'bg-neon/10 text-neon')}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="break-words text-sm font-medium text-zinc-200">{item.text}</div>
                <div className="mt-1 text-xs text-zinc-600">{new Date(item.at).toLocaleTimeString()}</div>
              </div>
            </div>
          );
        })}
        {activity.length === 0 && <div className="p-8 text-center text-zinc-500">Player events will appear here as soon as Minecraft logs them.</div>}
      </div>
    </div>
  );
}

function StatisticsPanel({ player, now }) {
  return (
    <Panel title="Statistics">
      <div className="grid gap-3 sm:grid-cols-2">
        <Info label="Play Time" value={player?.online ? formatUptime(sessionSeconds(player, now)) : 'Offline'} />
        <Info label="Distance" value="Pending" />
      </div>
      <StatList rows={[
        ['Last event', player?.lastActivityText || 'Pending'],
        ['Ping', player?.ping || 'Pending'],
        ['UUID', player?.uuid || 'Pending']
      ]} />
    </Panel>
  );
}

function Panel({ title, children }) {
  return (
    <div className="rounded-xl border border-line bg-panel p-4">
      <h4 className="mb-3 font-semibold text-white">{title}</h4>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function StatusRow({ label, icon: Icon, value, tone }) {
  const color = tone === 'danger' ? 'text-danger' : tone === 'warn' ? 'text-warn' : 'text-neon';
  return (
    <div className="flex items-center justify-between rounded-lg border border-line bg-black/20 p-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-zinc-300"><Icon className={clsx('h-4 w-4', color)} /> {label}</div>
      <span className="text-sm font-bold text-white">{value}</span>
    </div>
  );
}

function FileTile({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-line bg-black/20 p-3">
      <div className="flex items-center gap-2 font-semibold text-zinc-200"><Icon className="h-4 w-4 text-zinc-500" /> {label}</div>
      <div className="mt-1 truncate text-xs text-zinc-600">{value}</div>
    </div>
  );
}

function StatList({ rows }) {
  return (
    <div className="space-y-2">
      {rows.map(([label, value]) => (
        <div key={label} className="flex gap-3 rounded-md bg-white/[0.03] px-3 py-2 text-sm">
          <span className="w-24 shrink-0 text-zinc-500">{label}</span>
          <span className="min-w-0 truncate font-semibold text-zinc-200">{value}</span>
        </div>
      ))}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="min-w-0 rounded-md border border-line bg-black/20 px-3 py-2">
      <div className="text-xs uppercase text-zinc-600">{label}</div>
      <div className="mt-1 truncate font-semibold text-zinc-200">{value}</div>
    </div>
  );
}
