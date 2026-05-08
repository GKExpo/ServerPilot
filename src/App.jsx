import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Shell } from './layouts/Shell';
import { ServerModal } from './components/ServerModal';
import { ToastProvider, useToast } from './components/ToastProvider';
import { ConsoleView } from './components/ConsoleView';
import { Dashboard } from './pages/Dashboard';
import { Files } from './pages/Files';
import { Properties } from './pages/Properties';
import { Backups } from './pages/Backups';
import { Settings } from './pages/Settings';
import { Players } from './pages/Players';
import { api } from './services/api';
import { useInterval } from './hooks/useInterval';

function AppInner() {
  const [servers, setServers] = useState([]);
  const [settings, setSettings] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [tab, setTab] = useState('dashboard');
  const [statuses, setStatuses] = useState({});
  const [metrics, setMetrics] = useState({});
  const [logs, setLogs] = useState({});
  const [players, setPlayers] = useState({});
  const [modal, setModal] = useState({ open: false, server: null });
  const logBuffer = useRef({});
  const flushTimer = useRef(null);
  const toast = useToast();

  const selected = useMemo(() => servers.find((server) => server.id === selectedId), [servers, selectedId]);

  const load = useCallback(async () => {
    const data = await api.invoke('app:data:get');
    setServers(data.servers);
    setSettings(data.settings);
    setSelectedId((current) => current || data.servers[0]?.id || null);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => api.on('server:status', (state) => {
    setStatuses((current) => ({ ...current, [state.serverId]: state }));
  }), []);

  useEffect(() => api.on('server:log', (log) => {
    logBuffer.current[log.serverId] = [...(logBuffer.current[log.serverId] || []), log];
    if (flushTimer.current) return;
    flushTimer.current = setTimeout(() => {
      const batch = logBuffer.current;
      logBuffer.current = {};
      flushTimer.current = null;
      setLogs((current) => {
        const next = { ...current };
        for (const [serverId, items] of Object.entries(batch)) {
          next[serverId] = [...(next[serverId] || []), ...items].slice(-2000);
        }
        return next;
      });
    }, 120);
  }), []);

  useEffect(() => api.on('server:metrics', (payload) => {
    setMetrics((current) => ({ ...current, [payload.serverId]: payload }));
  }), []);

  useEffect(() => api.on('server:players', (payload) => {
    setPlayers((current) => ({ ...current, [payload.serverId]: payload }));
  }), []);

  useInterval(async () => {
    if (!selectedId) return;
    const next = await api.invoke('metrics:get', selectedId);
    setMetrics((current) => ({ ...current, [selectedId]: next }));
  }, 1500);

  async function remove(id) {
    if (!confirm('Remove this server from ServerPilot? Files on disk will not be deleted.')) return;
    await api.invoke('server:remove', id);
    await load();
    setSelectedId((current) => current === id ? null : current);
  }

  function saved(server) {
    setServers((current) => {
      const exists = current.some((item) => item.id === server.id);
      return exists ? current.map((item) => item.id === server.id ? server : item) : [...current, server];
    });
    setSelectedId(server.id);
    toast.push({ title: 'Server saved', body: `${server.name} is ready.` });
  }

  const page = (() => {
    if (tab === 'console') return <ConsoleView server={selected} logs={logs[selectedId] || []} />;
    if (tab === 'players') return <Players server={selected} playersState={players[selectedId] || { online: [], activity: [], onlineCount: 0 }} />;
    if (tab === 'files') return <Files server={selected} />;
    if (tab === 'properties') return <Properties server={selected} />;
    if (tab === 'backups') return <Backups server={selected} />;
    if (tab === 'settings') return <Settings settings={settings} onSaved={setSettings} />;
    return <Dashboard server={selected} status={statuses[selectedId]} metrics={metrics[selectedId] || { history: [] }} playersState={players[selectedId] || { onlineCount: 0 }} refresh={load} />;
  })();

  return (
    <>
      <Shell servers={servers} selectedId={selectedId} statuses={statuses} tab={tab} onTab={setTab} onSelect={setSelectedId} onAdd={() => setModal({ open: true, server: null })} onEdit={(server) => setModal({ open: true, server })} onRemove={remove}>
        {page}
      </Shell>
      <ServerModal open={modal.open} server={modal.server} settings={settings} onClose={() => setModal({ open: false, server: null })} onSaved={saved} />
    </>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}
