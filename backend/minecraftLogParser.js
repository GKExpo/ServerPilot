function stripMinecraftPrefix(line) {
  let text = String(line || '').trim();
  for (let index = 0; index < 3; index += 1) {
    const next = text
      .replace(/^\[[^/]+\/(?:INFO|WARN|ERROR)\]:\s*/, '')
      .replace(/^\[\d{2}:\d{2}:\d{2}\s+(?:INFO|WARN|ERROR)\]:\s*/, '')
      .replace(/^\[[^\]]+\]\s*/, '');
    if (next === text) break;
    text = next.trim();
  }
  return text
    .trim();
}

function parseMinecraftLog(rawLine) {
  const line = stripMinecraftPrefix(rawLine);
  if (!line) return null;

  let match = line.match(/^([A-Za-z0-9_]{3,16}) joined the game$/);
  if (match) return { type: 'join', username: match[1], text: `${match[1]} joined the server` };

  match = line.match(/^([A-Za-z0-9_]{3,16}) left the game$/);
  if (match) return { type: 'leave', username: match[1], text: `${match[1]} left the server` };

  match = line.match(/^<([A-Za-z0-9_]{3,16})>\s(.+)$/);
  if (match) return { type: 'chat', username: match[1], message: match[2], text: `${match[1]} sent message: ${match[2]}` };

  match = line.match(/^([A-Za-z0-9_]{3,16}) has made the advancement \[(.+)\]$/);
  if (match) return { type: 'advancement', username: match[1], message: match[2], text: `${match[1]} made advancement: ${match[2]}` };

  match = line.match(/^([A-Za-z0-9_]{3,16}) has completed the challenge \[(.+)\]$/);
  if (match) return { type: 'advancement', username: match[1], message: match[2], text: `${match[1]} completed challenge: ${match[2]}` };

  match = line.match(/^([A-Za-z0-9_]{3,16}) (?:was|drowned|blew up|hit the ground|fell|burned|went up|tried|walked|died|starved|suffocated|froze|withered|experienced|discovered|was slain|was shot|was pricked|was squashed|was killed|fell out|left the confines|didn't want).+$/);
  if (match) return { type: 'death', username: match[1], message: line, text: line };

  match = line.match(/^([A-Za-z0-9_]{3,16})\[[^\]]+\] logged in with entity id \d+ at \((.+)\)$/);
  if (match) return { type: 'login', username: match[1], message: match[2], text: `${match[1]} logged in` };

  match = line.match(/^UUID of player ([A-Za-z0-9_]{3,16}) is ([0-9a-fA-F-]{32,36})$/);
  if (match) return { type: 'uuid', username: match[1], uuid: match[2], text: `Resolved UUID for ${match[1]}` };

  match = line.match(/^(?:Kicked|Banned) player ([A-Za-z0-9_]{3,16})(?::\s*(.*))?$/i);
  if (match) return { type: 'moderation', username: match[1], message: match[2] || line, text: line };

  match = line.match(/^([A-Za-z0-9_]{3,16}) was kicked from the game(?::\s*(.*))?$/i);
  if (match) return { type: 'kick', username: match[1], message: match[2] || line, text: `${match[1]} was kicked` };

  match = line.match(/^([A-Za-z0-9_]{3,16}) issued server command: \/?(.+)$/);
  if (match) return { type: 'command', username: match[1], message: match[2], text: `${match[1]} used command: /${match[2]}` };

  match = line.match(/^([A-Za-z0-9_]{3,16}) moved (?:too quickly|wrongly)!/);
  if (match) return { type: 'movement', username: match[1], message: line, text: line };

  if (/Done \([^)]+\)! For help, type "help"/.test(line) || /^Done \([^)]+\)!/.test(line)) {
    return { type: 'ready', text: 'Server finished startup' };
  }

  if (/Stopping server|Saving players|ThreadedAnvilChunkStorage.*All dimensions are saved|Closing Server/i.test(line)) {
    return { type: 'shutdown', text: line };
  }

  return null;
}

module.exports = { parseMinecraftLog, stripMinecraftPrefix };
