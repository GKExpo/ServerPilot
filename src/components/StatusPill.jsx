import clsx from 'clsx';

export function StatusPill({ status = 'OFFLINE' }) {
  const online = status === 'ONLINE';
  const starting = status === 'STARTING';
  const stopping = status === 'STOPPING';
  const warn = ['CRASHED'].includes(status);
  return (
    <span className={clsx('inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold', online ? 'border-neon/40 bg-neon/10 text-neon' : starting || stopping ? 'border-warn/40 bg-warn/10 text-warn' : warn ? 'border-danger/40 bg-danger/10 text-danger' : 'border-zinc-700 bg-zinc-900 text-zinc-400')}>
      <span className={clsx('h-2 w-2 rounded-full', online ? 'bg-neon shadow-glow' : starting || stopping ? 'animate-pulse bg-warn' : warn ? 'bg-danger' : 'bg-zinc-500')} />
      {status}
    </span>
  );
}
