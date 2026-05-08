import { Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../services/api';

const keys = [
  ['motd', 'MOTD', 'text'],
  ['server-port', 'Port', 'number'],
  ['max-players', 'Max players', 'number'],
  ['online-mode', 'Online mode', 'bool'],
  ['white-list', 'Whitelist', 'bool'],
  ['pvp', 'PVP', 'bool'],
  ['difficulty', 'Difficulty', 'text'],
  ['gamemode', 'Gamemode', 'text'],
  ['enable-command-block', 'Command blocks', 'bool'],
  ['view-distance', 'View distance', 'number']
];

export function Properties({ server }) {
  const [data, setData] = useState({ properties: {}, json: {} });
  const [rawJson, setRawJson] = useState({});

  async function load() {
    if (!server) return;
    const next = await api.invoke('properties:get', server.id);
    setData(next);
    setRawJson(Object.fromEntries(Object.entries(next.json).map(([key, value]) => [key, JSON.stringify(value, null, 2)])));
  }

  useEffect(() => { load(); }, [server?.id]);

  function setProp(key, value) {
    setData((current) => ({ ...current, properties: { ...current.properties, [key]: value } }));
  }

  async function save() {
    const json = {};
    for (const [key, value] of Object.entries(rawJson)) json[key] = JSON.parse(value || '[]');
    await api.invoke('properties:save', { id: server.id, properties: data.properties, json });
  }

  return (
    <div className="space-y-5 p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Visual Configuration</h3>
        <button className="btn primary" disabled={!server} onClick={save}><Save className="h-4 w-4" /> Save</button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {keys.map(([key, label, type]) => (
          <label key={key} className="field rounded-lg border border-line bg-panel p-4">
            {label}
            {type === 'bool' ? (
              <select value={data.properties[key] || 'false'} onChange={(e) => setProp(key, e.target.value)}>
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </select>
            ) : (
              <input type={type === 'number' ? 'number' : 'text'} value={data.properties[key] || ''} onChange={(e) => setProp(key, e.target.value)} />
            )}
          </label>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        {['ops.json', 'whitelist.json', 'banned-players.json'].map((file) => (
          <label key={file} className="field">
            {file}
            <textarea className="h-64 font-mono" value={rawJson[file] || '[]'} onChange={(e) => setRawJson((current) => ({ ...current, [file]: e.target.value }))} />
          </label>
        ))}
      </div>
    </div>
  );
}
