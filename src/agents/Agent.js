const VALID_STATES = ['idle', 'moving', 'gathering', 'building', 'exploring'];
const MOVE_SPEED = 3; // tiles per second

export default class Agent {
  constructor(id, name, x = 0, y = 0, color = '#ff5555') {
    this.id = id;
    this.name = name;
    this.x = x;
    this.y = y;
    this.color = color;
    this.state = 'idle';
    this.inventory = [];
    this.currentAction = null;
    this.actionQueue = [];
    this.lastMessage = '';

    // smooth movement internals
    this._targetX = x;
    this._targetY = y;
  }

  moveTo(x, y) {
    this.actionQueue.push({ type: 'move', x, y });
  }

  gather(resourceType) {
    this.actionQueue.push({ type: 'gather', resource: resourceType });
  }

  explore() {
    const dx = Math.floor(Math.random() * 5) - 2;
    const dy = Math.floor(Math.random() * 5) - 2;
    const nx = Math.max(0, Math.min(11, Math.round(this.x) + dx));
    const ny = Math.max(0, Math.min(11, Math.round(this.y) + dy));
    this.actionQueue.push({ type: 'explore', x: nx, y: ny });
  }

  build(structureType) {
    this.actionQueue.push({ type: 'build', structure: structureType });
  }

  say(message) {
    this.lastMessage = message;
    this.actionQueue.push({ type: 'say', message });
  }

  getStatus() {
    if (this.state === 'idle') return `${this.name} is idle at (${Math.round(this.x)}, ${Math.round(this.y)})`;
    if (this.state === 'moving') return `${this.name} is moving to (${this._targetX}, ${this._targetY})`;
    if (this.state === 'gathering') return `${this.name} is gathering ${this.currentAction?.resource ?? 'resources'}`;
    if (this.state === 'building') return `${this.name} is building ${this.currentAction?.structure ?? 'something'}`;
    if (this.state === 'exploring') return `${this.name} is exploring`;
    return `${this.name}: ${this.state}`;
  }

  /* called every frame */
  update(deltaTime) {
    if (this.state === 'moving' || this.state === 'exploring') {
      const dx = this._targetX - this.x;
      const dy = this._targetY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 0.05) {
        this.x = this._targetX;
        this.y = this._targetY;
        this.state = 'idle';
        this.currentAction = null;
      } else {
        const step = Math.min(MOVE_SPEED * deltaTime, dist);
        this.x += (dx / dist) * step;
        this.y += (dy / dist) * step;
      }
      return;
    }

    // process action timer for gather / build
    if ((this.state === 'gathering' || this.state === 'building') && this.currentAction) {
      this.currentAction._timer = (this.currentAction._timer ?? 0) + deltaTime;
      if (this.currentAction._timer >= 2) {
        if (this.state === 'gathering') {
          this.inventory.push(this.currentAction.resource);
        }
        this.state = 'idle';
        this.currentAction = null;
      }
      return;
    }

    // pick next action from queue
    if (this.state === 'idle' && this.actionQueue.length > 0) {
      const action = this.actionQueue.shift();
      this.currentAction = action;

      switch (action.type) {
        case 'move':
          this._targetX = action.x;
          this._targetY = action.y;
          this.state = 'moving';
          break;
        case 'explore':
          this._targetX = action.x;
          this._targetY = action.y;
          this.state = 'exploring';
          break;
        case 'gather':
          this.state = 'gathering';
          break;
        case 'build':
          this.state = 'building';
          break;
        case 'say':
          this.lastMessage = action.message;
          this.state = 'idle';
          this.currentAction = null;
          break;
        default:
          this.currentAction = null;
      }
    }
  }
}
