const MOVE_RE  = /^(\S+)\s+move\s+to\s+(\d+)\s*[,\s]\s*(\d+)$/i;
const EXPLORE_RE = /^(\S+)\s+explore$/i;
const GATHER_RE  = /^(\S+)\s+gather\s+(.+)$/i;
const BUILD_RE   = /^(\S+)\s+build\s+(.+)$/i;
const SAY_RE     = /^(\S+)\s+say\s+(.+)$/i;

export default class CommandParser {
  parse(promptText) {
    const text = (promptText ?? '').trim();
    if (!text) return null;

    let m;

    if ((m = MOVE_RE.exec(text))) {
      return { agentName: m[1], action: 'move', params: { x: Number(m[2]), y: Number(m[3]) } };
    }
    if ((m = EXPLORE_RE.exec(text))) {
      return { agentName: m[1], action: 'explore', params: {} };
    }
    if ((m = GATHER_RE.exec(text))) {
      return { agentName: m[1], action: 'gather', params: { resource: m[2].trim().toLowerCase() } };
    }
    if ((m = BUILD_RE.exec(text))) {
      return { agentName: m[1], action: 'build', params: { structure: m[2].trim().toLowerCase() } };
    }
    if ((m = SAY_RE.exec(text))) {
      return { agentName: m[1], action: 'say', params: { message: m[2] } };
    }

    return null;
  }
}
