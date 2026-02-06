import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import Agent from '../src/agents/Agent.js';

describe('Agent', () => {
  it('creates with default values', () => {
    const a = new Agent(1, 'Test', 3, 4, '#ff0000');
    assert.strictEqual(a.id, 1);
    assert.strictEqual(a.name, 'Test');
    assert.strictEqual(a.x, 3);
    assert.strictEqual(a.y, 4);
    assert.strictEqual(a.color, '#ff0000');
    assert.strictEqual(a.state, 'idle');
    assert.deepStrictEqual(a.inventory, []);
    assert.deepStrictEqual(a.actionQueue, []);
  });

  it('moveTo adds to action queue', () => {
    const a = new Agent(1, 'Test');
    a.moveTo(5, 6);
    assert.strictEqual(a.actionQueue.length, 1);
    assert.deepStrictEqual(a.actionQueue[0], { type: 'move', x: 5, y: 6 });
  });

  it('getStatus returns correct idle status', () => {
    const a = new Agent(1, 'Bot', 2, 3);
    assert.ok(a.getStatus().includes('idle'));
  });

  it('gather changes state after update', () => {
    const a = new Agent(1, 'Bot');
    a.gather('wood');
    a.update(0.016); // pick up action
    assert.strictEqual(a.state, 'gathering');
  });

  it('explore sets agent to exploring state', () => {
    const a = new Agent(1, 'Bot', 5, 5);
    a.explore();
    a.update(0.016);
    assert.strictEqual(a.state, 'exploring');
  });

  it('say stores message', () => {
    const a = new Agent(1, 'Bot');
    a.say('hi there');
    assert.strictEqual(a.lastMessage, 'hi there');
  });

  it('smooth movement towards target', () => {
    const a = new Agent(1, 'Bot', 0, 0);
    a.moveTo(10, 0);
    a.update(0.016); // pick action
    a.update(1);     // move for 1 second
    assert.ok(a.x > 0, 'agent should have moved');
    assert.ok(a.x < 10, 'agent should not have arrived yet');
  });

  it('gather completes and adds to inventory', () => {
    const a = new Agent(1, 'Bot');
    a.gather('stone');
    a.update(0.016); // pick action
    a.update(2.1);   // exceed 2s timer
    assert.strictEqual(a.state, 'idle');
    assert.ok(a.inventory.includes('stone'));
  });
});
