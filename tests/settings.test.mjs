import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULTS, PRESETS, normalize } from '../settings.mjs';

test('clamps boost and pan and rejects non-finite values', () => {
  const s=normalize({volume:999,bass:-99,treble:Infinity,balance:5,bands:[40,-40,NaN]});
  assert.equal(s.volume,150);
  assert.equal(s.bass,-12);
  assert.equal(s.treble,0);
  assert.equal(s.balance,1);
  assert.deepEqual(s.bands,[12,-12,0,0,0,0,0,0,0,0]);
});
test('reset creates independent neutral settings', () => {
  const a=normalize();a.bands[0]=12;
  const b=normalize();
  assert.deepEqual(b.bands,Array(10).fill(0));
  assert.equal(b.volume,100);
  assert.equal(b.enabled,true);
  assert.equal(DEFAULTS.bands[0],0);
});
test('all presets have ten bounded bands and a neutral preset exists', () => {
  for(const preset of Object.values(PRESETS)) {
    assert.equal(preset.bands.length,10);
    assert.deepEqual(normalize(preset).bands,preset.bands);
    assert.equal(normalize(preset).bass,preset.bass);
    assert.equal(normalize(preset).treble,preset.treble);
  }
  assert.deepEqual(PRESETS.Flat.bands,Array(10).fill(0));
});
test('offers exactly 50 distinct sound profiles', () => {
  assert.equal(Object.keys(PRESETS).length,50);
  const profiles=Object.values(PRESETS).map(p=>JSON.stringify([p.bands,p.bass,p.treble]));
  assert.equal(new Set(profiles).size,50);
});
test('every preset preserves user volume, balance and bypass', () => {
  for(const preset of Object.values(PRESETS)) {
    const config=normalize({...normalize({volume:47,balance:-0.4,enabled:false}),...preset});
    assert.equal(config.volume,47);
    assert.equal(config.balance,-0.4);
    assert.equal(config.enabled,false);
  }
});
