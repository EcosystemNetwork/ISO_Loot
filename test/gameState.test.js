import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import GameState from '../src/game/GameState.js';

describe('GameState', () => {
  it('adds agents', () => {
    const gs = new GameState();
    const agent = gs.addAgent('Atlas', 1, 2, '#f00');
    assert.strictEqual(agent.name, 'Atlas');
    assert.strictEqual(gs.agents.size, 1);
  });

  it('gets agent by name (case insensitive)', () => {
    const gs = new GameState();
    gs.addAgent('Nova', 0, 0, '#0f0');
    const agent = gs.getAgent('nova');
    assert.strictEqual(agent.name, 'Nova');
  });

  it('returns null for unknown agent', () => {
    const gs = new GameState();
    assert.strictEqual(gs.getAgent('nobody'), null);
  });

  it('gets all agents', () => {
    const gs = new GameState();
    gs.addAgent('A', 0, 0, '#f00');
    gs.addAgent('B', 1, 1, '#0f0');
    assert.strictEqual(gs.getAllAgents().length, 2);
  });

  it('removes agents', () => {
    const gs = new GameState();
    gs.addAgent('X', 0, 0, '#f00');
    gs.removeAgent('X');
    assert.strictEqual(gs.agents.size, 0);
  });

  it('adds messages and respects max limit', () => {
    const gs = new GameState();
    for (let i = 0; i < 60; i++) {
      gs.addMessage(`msg ${i}`);
    }
    assert.strictEqual(gs.messages.length, 50);
    assert.ok(gs.messages[0].text.includes('10')); // first 10 were dropped
  });

  it('generateMap creates correct dimensions', () => {
    const gs = new GameState();
    const map = gs.generateMap(12, 8);
    assert.strictEqual(map.length, 8);
    assert.strictEqual(map[0].length, 12);
  });

  it('generateMap tiles are valid types', () => {
    const gs = new GameState();
    const map = gs.generateMap(5, 5);
    const validTypes = ['grass', 'water', 'stone', 'sand'];
    for (const row of map) {
      for (const tile of row) {
        assert.ok(validTypes.includes(tile), `unexpected tile: ${tile}`);
      }
    }
  });

  it('update increments tick and updates agents', () => {
    const gs = new GameState();
    gs.addAgent('T', 0, 0, '#f00');
    gs.update(0.016);
    assert.strictEqual(gs.tick, 1);
  });
});
