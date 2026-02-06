import Agent from '../agents/Agent.js';

const TILE_TYPES = ['grass', 'water', 'stone', 'sand'];
const MAX_MESSAGES = 50;

export default class GameState {
  constructor() {
    this.agents = new Map();
    this.map = [];
    this.messages = [];
    this.tick = 0;
    this._nextId = 1;
  }

  addAgent(name, x, y, color) {
    const agent = new Agent(this._nextId++, name, x, y, color);
    this.agents.set(name.toLowerCase(), agent);
    return agent;
  }

  removeAgent(name) {
    this.agents.delete(name.toLowerCase());
  }

  getAgent(name) {
    return this.agents.get(name.toLowerCase()) ?? null;
  }

  getAllAgents() {
    return [...this.agents.values()];
  }

  update(deltaTime) {
    this.tick++;
    for (const agent of this.agents.values()) {
      agent.update(deltaTime);
    }
  }

  addMessage(text) {
    this.messages.push({ text, time: Date.now() });
    if (this.messages.length > MAX_MESSAGES) {
      this.messages.shift();
    }
  }

  generateMap(width, height) {
    this.map = [];
    for (let row = 0; row < height; row++) {
      const r = [];
      for (let col = 0; col < width; col++) {
        // weighted random: mostly grass
        const rand = Math.random();
        if (rand < 0.60) r.push('grass');
        else if (rand < 0.75) r.push('sand');
        else if (rand < 0.88) r.push('stone');
        else r.push('water');
      }
      this.map.push(r);
    }
    return this.map;
  }
}
