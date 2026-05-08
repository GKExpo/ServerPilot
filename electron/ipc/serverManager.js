const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const pidusage = require('pidusage');
const { parseMinecraftLog } = require('../../backend/minecraftLogParser');

const runtime = new Map();
const STOP_TIMEOUT_MS = 15000;

function splitArgs(value) {
  return String(value || '').match(/(?:[^\s"]+|"[^"]*")+/g)?.map((arg) => arg.replace(/^"|"$/g, '')) || [];
}

function sanitizeJvmArgs(value) {
  const args = splitArgs(value);
  const sanitized = [];
  const ignored = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    const lower = arg.toLowerCase();
    const fileName = path.basename(lower);
    if (fileName === 'java' || fileName === 'java.exe') {
      ignored.push(arg);
      continue;
    }
    if (lower === '-jar') {
      ignored.push(arg);
      if (args[index + 1]) {
        ignored.push(args[index + 1]);
        index += 1;
      }
      continue;
    }
    if (lower === 'nogui' || lower === 'gui' || lower.endsWith('.jar') || lower.startsWith('-xms') || lower.startsWith('-xmx')) {
      ignored.push(arg);
      continue;
    }
    sanitized.push(arg);
  }
  return { sanitized, ignored };
}

function cleanLogMessage(message) {
  return String(message)
    .replace(/[\u001B\u009B][[\]()#;?]*(?:(?:(?:[a-zA-Z\d]*(?:;[a-zA-Z\d]*)*)?\u0007)|(?:(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PR-TZcf-nq-uy=><~]))/g, '')
    .replace(/[^\S\r\n\t]+$/gm, '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '')
    .replace(/\r?\n$/, '');
}

function playitMessageIsUseful(message) {
  const text = cleanLogMessage(message).trim();
  if (!text) return false;
  if (/^\d+$/.test(text)) return false;
  if (/^[\s|_./\\-]+$/.test(text)) return false;
  return /(playit|agent|tunnel|secret|claim|error|warn|connected|online|offline|failed|login|account|minecraft|address|region|proxy)/i.test(text);
}

function playerSnapshot(state) {
  const online = Array.from(state.players.values()).filter((player) => player.online);
  online.sort((a, b) => a.username.localeCompare(b.username));
  return {
    online,
    onlineCount: online.length,
    activity: state.activities.slice(-150).reverse()
  };
}

function publicState(server, state = {}) {
  return {
    serverId: server.id,
    status: state.status || 'OFFLINE',
    pid: state.process?.pid || null,
    playitPid: state.playit?.pid || null,
    startedAt: state.startedAt || null,
    playitStatus: state.playitStatus || 'PLAYIT STOPPED',
    crashReason: state.crashReason || '',
    lastLogs: state.lastLogs || []
  };
}

function createPlayer(username, patch = {}) {
  const now = new Date().toISOString();
  return {
    username,
    joinTime: patch.joinTime || now,
    online: patch.online ?? true,
    status: patch.status || 'Online',
    ping: patch.ping || 'Pending',
    lastActivity: patch.lastActivity || now,
    lastActivityText: patch.lastActivityText || 'Joined',
    dimension: patch.dimension || 'Overworld',
    uuid: patch.uuid || 'Pending'
  };
}

function createServerHandlers({ ipcMain, app, shell, send, notify, storeApi }) {
  function emitStatus(server, state) {
    send('server:status', publicState(server, state));
  }

  function emitPlayers(serverId, state) {
    send('server:players', { serverId, ...playerSnapshot(state) });
  }

  function rememberLog(state, message) {
    const text = cleanLogMessage(message);
    if (!text) return '';
    state.lastLogs = [...(state.lastLogs || []), text].slice(-30);
    return text;
  }

  function addActivity(serverId, state, event) {
    const activity = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      at: new Date().toISOString(),
      ...event
    };
    state.activities = [...(state.activities || []), activity].slice(-250);
    emitPlayers(serverId, state);
  }

  function upsertPlayer(serverId, state, username, patch = {}, activity) {
    const existing = state.players.get(username) || createPlayer(username, patch);
    const next = {
      ...existing,
      ...patch,
      username,
      lastActivity: patch.lastActivity || new Date().toISOString()
    };
    state.players.set(username, next);
    if (activity) addActivity(serverId, state, { username, ...activity });
    else emitPlayers(serverId, state);
  }

  function processMinecraftEvent(server, state, line) {
    const event = parseMinecraftLog(line);
    if (!event) return;
    const now = new Date().toISOString();

    if (event.type === 'ready' && state.status === 'STARTING') {
      state.status = 'ONLINE';
      emitStatus(server, state);
      notify('Server online', `${server.name} finished startup.`);
      return;
    }

    if (event.type === 'join') {
      upsertPlayer(server.id, state, event.username, {
        online: true,
        joinTime: now,
        status: 'Online',
        lastActivity: now,
        lastActivityText: 'Joined'
      }, { type: 'join', text: event.text });
      return;
    }

    if (event.type === 'leave') {
      const existing = state.players.get(event.username) || createPlayer(event.username, { online: false });
      state.players.set(event.username, {
        ...existing,
        online: false,
        status: 'Offline',
        lastActivity: now,
        lastActivityText: 'Left'
      });
      addActivity(server.id, state, { type: 'leave', username: event.username, text: event.text });
      return;
    }

    if (event.type === 'uuid') {
      upsertPlayer(server.id, state, event.username, {
        uuid: event.uuid,
        lastActivity: now,
        lastActivityText: 'Login attempt'
      }, { type: 'uuid', text: event.text });
      return;
    }

    if (['chat', 'death', 'advancement', 'command', 'login', 'kick', 'moderation', 'movement'].includes(event.type)) {
      upsertPlayer(server.id, state, event.username, {
        online: event.type === 'kick' ? false : true,
        status: event.type === 'kick' ? 'Kicked' : 'Online',
        lastActivity: now,
        lastActivityText: event.type === 'chat' ? `Chat: ${event.message}` : event.text
      }, { type: event.type, text: event.text, message: event.message });
    }
  }

  function emitLog(server, state, level, message, source = 'server') {
    const text = rememberLog(state, message);
    if (!text) return;
    send('server:log', {
      serverId: server.id,
      level,
      source,
      message: text,
      at: new Date().toISOString()
    });
    if (source === 'server') processMinecraftEvent(server, state, text);
  }

  function attachLineStream(stream, onLine) {
    let buffer = '';
    const onData = (data) => {
      buffer += data.toString();
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || '';
      for (const line of lines) onLine(line);
    };
    stream?.on('data', onData);
    return () => {
      if (buffer.trim()) onLine(buffer);
      stream?.off('data', onData);
    };
  }

  function forceKillProcess(proc, label, server, state) {
    if (!proc || proc.killed || !proc.pid) return;
    try {
      if (process.platform === 'win32') {
        spawn('taskkill.exe', ['/PID', String(proc.pid), '/T', '/F'], { windowsHide: true });
      } else {
        proc.kill('SIGKILL');
      }
      emitLog(server, state, 'warn', `${label} did not exit in time and was terminated.`);
    } catch (error) {
      emitLog(server, state, 'error', `Failed to terminate ${label}: ${error.message}`);
    }
  }

  function startPlayit(server, settings, state) {
    const playitPath = server.playitPath || settings.playitPath;
    if (!server.autoStartPlayit && !settings.autoStartPlayit) {
      state.playitStatus = 'PLAYIT STOPPED';
      return;
    }
    if (state.playit && !state.playit.killed) return;
    if (!playitPath || !fs.existsSync(playitPath)) {
      state.playitStatus = 'PLAYIT STOPPED';
      emitLog(server, state, 'warn', 'Playit auto-start is enabled, but no valid Playit executable path is configured.', 'playit');
      return;
    }
    state.playitStatus = 'PLAYIT STARTING';
    emitStatus(server, state);
    state.playit = spawn(playitPath, [], { cwd: path.dirname(playitPath), windowsHide: true });
    state.playitStatus = 'PLAYIT ONLINE';
    emitLog(server, state, 'info', `Playit started with PID ${state.playit.pid}.`, 'playit');
    emitStatus(server, state);
    const cleanupStdout = attachLineStream(state.playit.stdout, (line) => {
      if (playitMessageIsUseful(line)) emitLog(server, state, 'info', line, 'playit');
    });
    const cleanupStderr = attachLineStream(state.playit.stderr, (line) => {
      if (playitMessageIsUseful(line)) emitLog(server, state, /error|failed/i.test(line) ? 'error' : 'info', line, 'playit');
    });
    state.cleanup.push(cleanupStdout, cleanupStderr);
    state.playit.once('exit', (code) => {
      cleanupStdout();
      cleanupStderr();
      state.playitStatus = 'PLAYIT STOPPED';
      if (!state.intentionalStop && code) emitLog(server, state, 'warn', `Playit exited with code ${code}.`, 'playit');
      else emitLog(server, state, 'info', 'Playit stopped.', 'playit');
      emitStatus(server, state);
    });
  }

  function stopPlayit(server, state) {
    if (!state?.playit || state.playit.killed) {
      state.playitStatus = 'PLAYIT STOPPED';
      return;
    }
    state.playitStatus = 'PLAYIT STOPPING';
    emitStatus(server, state);
    try {
      state.playit.kill();
    } catch {}
    setTimeout(() => {
      if (state.playit && !state.playit.killed) forceKillProcess(state.playit, 'Playit', server, state);
    }, 3000).unref?.();
  }

  function cleanupState(id, state) {
    if (state.forceTimer) clearTimeout(state.forceTimer);
    for (const cleanup of state.cleanup || []) {
      try { cleanup(); } catch {}
    }
    runtime.delete(id);
  }

  async function startServer(id) {
    const server = storeApi.getServer(id);
    if (!server) throw new Error('Server not found');
    const current = runtime.get(id);
    if (current?.process && !current.process.killed) throw new Error('Server is already running');
    if (!server.folderPath || !fs.existsSync(server.folderPath)) throw new Error('Server folder does not exist');
    const jarPath = path.join(server.folderPath, server.jarName || '');
    if (!server.jarName || !fs.existsSync(jarPath)) throw new Error('Server JAR does not exist');

    const settings = storeApi.getSettings();
    const javaPath = server.javaPath || settings.defaultJavaPath || 'java';
    const extraArgs = sanitizeJvmArgs(server.jvmArgs);
    const args = [
      `-Xms${server.ramMin || settings.defaultRamMin || '2G'}`,
      `-Xmx${server.ramMax || settings.defaultRamMax || '4G'}`,
      ...extraArgs.sanitized,
      '-jar',
      server.jarName,
      'nogui'
    ];
    const child = spawn(javaPath, args, { cwd: server.folderPath, windowsHide: true });
    const state = {
      process: child,
      status: 'STARTING',
      startedAt: Date.now(),
      metrics: [],
      players: new Map(),
      activities: [],
      lastLogs: [],
      cleanup: [],
      intentionalStop: false,
      playitStatus: 'PLAYIT STOPPED',
      crashReason: ''
    };
    runtime.set(id, state);
    emitStatus(server, state);
    emitPlayers(id, state);
    emitLog(server, state, 'info', `Starting: ${javaPath} ${args.join(' ')}`);
    if (extraArgs.ignored.length) emitLog(server, state, 'warn', `Ignored JVM arguments that ServerPilot manages automatically: ${extraArgs.ignored.join(' ')}`);
    startPlayit(server, settings, state);
    notify('Server starting', `${server.name} is starting.`);

    const cleanupStdout = attachLineStream(child.stdout, (line) => emitLog(server, state, 'info', line));
    const cleanupStderr = attachLineStream(child.stderr, (line) => emitLog(server, state, 'error', line));
    state.cleanup.push(cleanupStdout, cleanupStderr);

    child.once('error', (error) => {
      state.crashReason = error.message;
      state.status = 'CRASHED';
      emitLog(server, state, 'error', error.message);
      emitStatus(server, state);
      notify('Crash detected', `${server.name}: ${error.message}`);
    });

    child.once('exit', (code, signal) => {
      const intentional = state.intentionalStop || state.status === 'STOPPING';
      const crashed = !intentional && (code !== 0 || signal);
      state.status = crashed ? 'CRASHED' : 'OFFLINE';
      state.crashReason = crashed ? `Process exited unexpectedly with code ${code ?? 'none'}${signal ? ` and signal ${signal}` : ''}.` : '';
      for (const player of state.players.values()) {
        player.online = false;
        player.status = 'Offline';
      }
      stopPlayit(server, state);
      emitLog(server, state, crashed ? 'error' : 'info', crashed ? `Server crashed. ${state.crashReason}` : `Server stopped cleanly with code ${code ?? 0}.`);
      emitPlayers(id, state);
      emitStatus(server, state);
      notify(crashed ? 'Crash detected' : 'Server stopped', crashed ? `${server.name} stopped unexpectedly.` : `${server.name} is offline.`);
      if (crashed && storeApi.getSettings().autoRestartCrashed) {
        setTimeout(() => ipcMain.emit('serverpilot:auto-restart', null, id), 2500).unref?.();
      }
      setTimeout(() => cleanupState(id, state), 5000).unref?.();
    });

    return publicState(server, state);
  }

  function requestGracefulStop(id, forceTimeout = STOP_TIMEOUT_MS) {
    const server = storeApi.getServer(id);
    const state = runtime.get(id);
    if (!server || !state?.process) return null;
    if (state.status === 'OFFLINE') return publicState(server, state);
    state.intentionalStop = true;
    state.status = 'STOPPING';
    state.crashReason = '';
    emitStatus(server, state);
    emitLog(server, state, 'info', 'Stopping server gracefully...');
    try {
      state.process.stdin.write('stop\n');
    } catch {
      try { state.process.kill(); } catch {}
    }
    stopPlayit(server, state);
    if (state.forceTimer) clearTimeout(state.forceTimer);
    state.forceTimer = setTimeout(() => {
      if (state.process && !state.process.killed) forceKillProcess(state.process, 'Minecraft server', server, state);
    }, forceTimeout);
    state.forceTimer.unref?.();
    return publicState(server, state);
  }

  ipcMain.handle('server:start', async (_event, id) => startServer(id));

  ipcMain.on('serverpilot:auto-restart', async (_event, id) => {
    try {
      await startServer(id);
    } catch (error) {
      const server = storeApi.getServer(id);
      const state = runtime.get(id) || { lastLogs: [], players: new Map(), activities: [], cleanup: [] };
      if (server) emitLog(server, state, 'error', `Auto-restart failed: ${error.message}`);
    }
  });

  ipcMain.handle('server:stop', async (_event, id) => requestGracefulStop(id));
  ipcMain.handle('server:kill', async (_event, id) => requestGracefulStop(id, 3000));

  ipcMain.handle('server:restart', async (_event, id) => {
    const state = runtime.get(id);
    if (state?.process && !state.process.killed) {
      requestGracefulStop(id);
      await new Promise((resolve) => state.process.once('exit', resolve));
    }
    return startServer(id);
  });

  ipcMain.handle('server:command', (_event, { id, command }) => {
    const server = storeApi.getServer(id);
    const state = runtime.get(id);
    if (!server || !state?.process || state.process.killed) throw new Error('Server is not running');
    state.process.stdin.write(`${String(command || '').trim()}\n`);
    emitLog(server, state, 'command', `> ${command}`);
    return true;
  });

  ipcMain.handle('server:open-folder', async (_event, id) => {
    const server = storeApi.getServer(id);
    if (!server?.folderPath) throw new Error('Missing server folder');
    await shell.openPath(server.folderPath);
    return true;
  });

  ipcMain.handle('server:open-terminal', (_event, id) => {
    const server = storeApi.getServer(id);
    if (!server?.folderPath || !fs.existsSync(server.folderPath)) throw new Error('Missing server folder');
    spawn('cmd.exe', ['/c', 'start', 'cmd.exe', '/K', `cd /d "${server.folderPath}"`], { windowsHide: true });
    return true;
  });

  ipcMain.handle('metrics:get', async (_event, id) => {
    const server = storeApi.getServer(id);
    const state = runtime.get(id);
    if (!server || !state?.process || state.process.killed) {
      return { status: 'OFFLINE', cpu: 0, memory: 0, uptime: 0, pid: null, playitStatus: 'PLAYIT STOPPED', tps: 20, players: 0, history: [] };
    }
    let usage = { cpu: 0, memory: 0 };
    try {
      usage = await pidusage(state.process.pid);
    } catch {}
    const point = {
      time: new Date().toLocaleTimeString(),
      cpu: Number(usage.cpu.toFixed(1)),
      memory: Math.round(usage.memory / 1024 / 1024)
    };
    state.metrics = [...(state.metrics || []), point].slice(-40);
    const payload = {
      status: state.status,
      cpu: point.cpu,
      memory: point.memory,
      systemMemory: Math.round((os.totalmem() - os.freemem()) / 1024 / 1024),
      uptime: Math.floor((Date.now() - state.startedAt) / 1000),
      pid: state.process.pid,
      playitPid: state.playit?.pid || null,
      playitStatus: state.playitStatus,
      tps: 20,
      players: playerSnapshot(state).onlineCount,
      history: state.metrics,
      crashReason: state.crashReason,
      lastLogs: state.lastLogs || []
    };
    send('server:metrics', { serverId: id, ...payload });
    return payload;
  });

  app?.once('before-quit', () => {
    for (const [id, state] of runtime.entries()) {
      const server = storeApi.getServer(id);
      if (!server) continue;
      state.intentionalStop = true;
      try { state.process?.stdin?.write('stop\n'); } catch {}
      try { state.process?.kill(); } catch {}
      try { state.playit?.kill(); } catch {}
    }
  });
}

module.exports = { createServerHandlers };
