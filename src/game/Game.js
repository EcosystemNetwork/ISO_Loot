import IsometricEngine from '../engine/IsometricEngine.js';
import GameState from './GameState.js';
import CommandParser from '../agents/CommandParser.js';

export default class Game {
  constructor() {
    this.engine = null;
    this.state = new GameState();
    this.parser = new CommandParser();
    this._lastTime = 0;
  }

  init() {
    const canvas = document.getElementById('gameCanvas');
    this.engine = new IsometricEngine(canvas);

    // generate map & default agents
    this.state.generateMap(12, 12);
    this.state.addAgent('Atlas', 2, 2, '#e74c3c');
    this.state.addAgent('Nova',  6, 4, '#3498db');
    this.state.addAgent('Echo',  9, 8, '#2ecc71');

    this.state.addMessage('Welcome to ISO Loot! Type a command below.');

    // UI event listeners
    const input = document.getElementById('promptInput');
    const btn   = document.getElementById('sendBtn');
    const submit = () => {
      const text = input.value.trim();
      if (text) { this.handlePrompt(text); input.value = ''; }
    };
    btn.addEventListener('click', submit);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });

    // start loop
    this._lastTime = performance.now();
    requestAnimationFrame((t) => this._loop(t));
    this.updateUI();
  }

  handlePrompt(text) {
    this.state.addMessage(`> ${text}`);
    const cmd = this.parser.parse(text);

    if (!cmd) {
      this.state.addMessage('⚠ Unknown command. Try: AgentName move to X,Y | explore | gather <resource> | build <structure> | say <msg>');
      this.updateUI();
      return;
    }

    const targets = cmd.agentName.toLowerCase() === 'all'
      ? this.state.getAllAgents()
      : [this.state.getAgent(cmd.agentName)].filter(Boolean);

    if (targets.length === 0) {
      this.state.addMessage(`⚠ Agent "${cmd.agentName}" not found.`);
      this.updateUI();
      return;
    }

    for (const agent of targets) {
      switch (cmd.action) {
        case 'move':
          agent.moveTo(cmd.params.x, cmd.params.y);
          this.state.addMessage(`${agent.name} → moving to (${cmd.params.x}, ${cmd.params.y})`);
          break;
        case 'explore':
          agent.explore();
          this.state.addMessage(`${agent.name} → exploring`);
          break;
        case 'gather':
          agent.gather(cmd.params.resource);
          this.state.addMessage(`${agent.name} → gathering ${cmd.params.resource}`);
          break;
        case 'build':
          agent.build(cmd.params.structure);
          this.state.addMessage(`${agent.name} → building ${cmd.params.structure}`);
          break;
        case 'say':
          agent.say(cmd.params.message);
          this.state.addMessage(`${agent.name} says: "${cmd.params.message}"`);
          break;
      }
    }
    this.updateUI();
  }

  updateUI() {
    // agent status panel
    const panel = document.getElementById('agentStatus');
    if (panel) {
      panel.innerHTML = this.state.getAllAgents().map((a) => `
        <div class="agent-card">
          <div class="name" style="color:${a.color}">${a.name}</div>
          <div class="detail">${a.getStatus()}</div>
          <div class="detail">Inventory: ${a.inventory.length ? a.inventory.join(', ') : 'empty'}</div>
        </div>
      `).join('');
    }

    // message log
    const log = document.getElementById('messageLog');
    if (log) {
      log.innerHTML = this.state.messages.map((m) => `<div class="msg">${m.text}</div>`).join('');
      log.scrollTop = log.scrollHeight;
    }
  }

  _loop(now) {
    const dt = Math.min((now - this._lastTime) / 1000, 0.1);
    this._lastTime = now;

    this.state.update(dt);
    this.engine.setMap(this.state.map);
    this.engine.setAgents(this.state.getAllAgents());
    this.engine.render();

    // refresh UI every ~15 frames
    if (this.state.tick % 15 === 0) this.updateUI();

    requestAnimationFrame((t) => this._loop(t));
  }
}
