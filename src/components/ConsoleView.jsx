import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, Ban, Search, Send, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { api } from '../services/api';

const NEAR_BOTTOM_PX = 80;
const MAX_VISIBLE_LOGS = 900;

export function ConsoleView({ server, logs }) {
  const [command, setCommand] = useState('');
  const [query, setQuery] = useState('');
  const [showErrors, setShowErrors] = useState(true);
  const [showWarnings, setShowWarnings] = useState(true);
  const [clearedAt, setClearedAt] = useState(0);
  const [followLatest, setFollowLatest] = useState(true);
  const viewport = useRef(null);
  const logCount = useRef(0);

  const visibleSource = useMemo(() => logs.slice(clearedAt), [logs, clearedAt]);
  const filtered = useMemo(() => {
    const result = visibleSource.filter((log) => {
      if (!showErrors && log.level === 'error') return false;
      if (!showWarnings && log.level === 'warn') return false;
      return !query || log.message.toLowerCase().includes(query.toLowerCase());
    });
    return query ? result.slice(-1400) : result.slice(-MAX_VISIBLE_LOGS);
  }, [visibleSource, query, showErrors, showWarnings]);

  function isNearBottom(element) {
    return element.scrollHeight - element.scrollTop - element.clientHeight < NEAR_BOTTOM_PX;
  }

  function onScroll() {
    const element = viewport.current;
    if (!element) return;
    setFollowLatest(isNearBottom(element));
  }

  function jumpToLatest(behavior = 'smooth') {
    const element = viewport.current;
    if (!element) return;
    element.scrollTo({ top: element.scrollHeight, behavior });
    setFollowLatest(true);
  }

  useEffect(() => {
    if (!followLatest || logCount.current === filtered.length) return;
    logCount.current = filtered.length;
    const id = requestAnimationFrame(() => jumpToLatest('smooth'));
    return () => cancelAnimationFrame(id);
  }, [filtered.length, followLatest]);

  useEffect(() => {
    logCount.current = 0;
    setFollowLatest(true);
    setClearedAt(0);
    requestAnimationFrame(() => jumpToLatest('auto'));
  }, [server?.id]);

  async function submit(e) {
    e.preventDefault();
    if (!server || !command.trim()) return;
    await api.invoke('server:command', { id: server.id, command });
    setCommand('');
  }

  return (
    <div className="flex h-full flex-col p-5">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-64 flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <input className="pl-9" placeholder="Search logs..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <button className={clsx('btn ghost', !showErrors && 'opacity-50')} onClick={() => setShowErrors((v) => !v)}><Ban className="h-4 w-4" /> Errors</button>
        <button className={clsx('btn ghost', !showWarnings && 'opacity-50')} onClick={() => setShowWarnings((v) => !v)}><Ban className="h-4 w-4" /> Warnings</button>
        <button className="btn ghost" onClick={() => setClearedAt(logs.length)}><Trash2 className="h-4 w-4" /> Clear</button>
      </div>
      <div className="relative min-h-0 flex-1">
        <div ref={viewport} onScroll={onScroll} className="terminal h-full overflow-auto rounded-lg border border-line bg-black/50 p-4 font-mono text-sm">
          {filtered.map((log, index) => (
            <div key={`${log.at}-${index}-${log.message}`} className={clsx('whitespace-pre-wrap break-words leading-6', log.level === 'error' && 'text-danger', log.level === 'warn' && 'text-warn', log.level === 'command' && 'text-neon', log.level === 'info' && 'text-zinc-300')}>
              <span className="text-zinc-600">[{new Date(log.at).toLocaleTimeString()}]</span> <span className="text-zinc-500">{log.source || 'server'}</span> {log.message}
            </div>
          ))}
        </div>
        {!followLatest && (
          <button className="absolute bottom-4 right-4 rounded-lg border border-neon/40 bg-panel2 px-4 py-2 text-sm font-semibold text-neon shadow-glow" onClick={() => jumpToLatest()}>
            <ArrowDown className="mr-2 inline h-4 w-4" /> Jump to Latest Logs
          </button>
        )}
      </div>
      <form onSubmit={submit} className="mt-4 flex gap-3">
        <input value={command} onChange={(e) => setCommand(e.target.value)} placeholder="Send command: say Hello, op username, stop..." disabled={!server} />
        <button className="btn primary" disabled={!server || !command.trim()}><Send className="h-4 w-4" /> Send</button>
      </form>
    </div>
  );
}
