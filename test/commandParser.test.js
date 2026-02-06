import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import CommandParser from '../src/agents/CommandParser.js';

const parser = new CommandParser();

describe('CommandParser', () => {
  it('parses move commands', () => {
    const result = parser.parse('Atlas move to 5,3');
    assert.deepStrictEqual(result, { agentName: 'Atlas', action: 'move', params: { x: 5, y: 3 } });
  });

  it('parses move commands with spaces around comma', () => {
    const result = parser.parse('Nova move to 10 , 7');
    assert.deepStrictEqual(result, { agentName: 'Nova', action: 'move', params: { x: 10, y: 7 } });
  });

  it('parses explore commands', () => {
    const result = parser.parse('Echo explore');
    assert.deepStrictEqual(result, { agentName: 'Echo', action: 'explore', params: {} });
  });

  it('parses gather commands', () => {
    const result = parser.parse('Atlas gather wood');
    assert.deepStrictEqual(result, { agentName: 'Atlas', action: 'gather', params: { resource: 'wood' } });
  });

  it('parses build commands', () => {
    const result = parser.parse('Nova build house');
    assert.deepStrictEqual(result, { agentName: 'Nova', action: 'build', params: { structure: 'house' } });
  });

  it('parses say commands', () => {
    const result = parser.parse('Echo say hello world');
    assert.deepStrictEqual(result, { agentName: 'Echo', action: 'say', params: { message: 'hello world' } });
  });

  it('parses "all" target', () => {
    const result = parser.parse('all explore');
    assert.strictEqual(result.agentName, 'all');
    assert.strictEqual(result.action, 'explore');
  });

  it('is case insensitive', () => {
    const result = parser.parse('ATLAS MOVE TO 1,2');
    assert.strictEqual(result.action, 'move');
    assert.strictEqual(result.agentName, 'ATLAS');
    assert.deepStrictEqual(result.params, { x: 1, y: 2 });
  });

  it('returns null for unknown commands', () => {
    assert.strictEqual(parser.parse('gibberish'), null);
  });

  it('returns null for empty input', () => {
    assert.strictEqual(parser.parse(''), null);
    assert.strictEqual(parser.parse(null), null);
  });
});
