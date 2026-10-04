'use strict';
// チップチューン風BGMと効果音（WebAudioで生成。音源ファイルなし）
const AUDIO = (() => {
  let ac = null, master, bgBus, sfBus, noiseBuf;
  let muted = false, want = null, cur = null, trk = null, iv = null, step = 0, nextT = 0;
  try { muted = localStorage.getItem('gk-mute') === '1'; } catch (e) {}

  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    master = ac.createGain(); master.gain.value = muted ? 0 : 0.6; master.connect(ac.destination);
    bgBus = ac.createGain(); bgBus.gain.value = 0.3; bgBus.connect(master);
    sfBus = ac.createGain(); sfBus.gain.value = 0.55; sfBus.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    if (want) { const w = want; want = null; cur = null; bgm(w); }
  }

  function env(g, t, vol, dur, sus) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.006);
    if (sus) g.gain.setValueAtTime(vol * 0.8, t + dur * 0.75);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  function osc(type, f, t, dur, vol, dest, f2, sus) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    env(g, t, vol, dur, sus);
    o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(t, dur, vol, dest, hp) {
    const s = ac.createBufferSource(); s.buffer = noiseBuf;
    const g = ac.createGain(); env(g, t, vol, dur);
    let n = s;
    if (hp) { const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp; s.connect(f); n = f; }
    n.connect(g); g.connect(dest); s.start(t); s.stop(t + dur + 0.05);
  }

  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  function freq(tok) {
    const m = tok.match(/^([A-G])([#b]?)(\d)$/);
    if (!m) return 0;
    const n = NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (+m[3] + 1) * 12;
    return 440 * Math.pow(2, (n - 69) / 12);
  }
  function parse(str) {
    const toks = str.split(/\s+/).filter(x => x && x !== '|');
    const at = {}; let last = null;
    toks.forEach((t, i) => {
      if (t === '-') { if (last) last.len++; }
      else if (t === '.') { last = null; }
      else { last = { f: freq(t), len: 1 }; at[i] = last; }
    });
    return { n: toks.length, at };
  }

  // オリジナル曲（8分音符単位）
  const TR = {
    title: { bpm: 128, drum: 'k.h.s.h.k.h.s.hh',
      lead: 'C5 - E5 G5 - E5 G5 C6 | B5 - G5 - E5 - - . | A5 - F5 A5 - F5 A5 C6 | B5 - - - G5 - - . | C6 - B5 A5 - G5 F5 - | E5 - F5 G5 - A5 B5 - | C6 - G5 E5 - D5 E5 - | C5 - - - - - - .',
      bass: 'C3 C3 G3 C3 C3 C3 G3 C3 | G2 G2 D3 G2 G2 G2 D3 G2 | F2 F2 C3 F2 F2 F2 C3 F2 | G2 G2 D3 G2 G2 G2 B2 G2 | A2 A2 E3 A2 F2 F2 C3 F2 | C3 C3 G3 C3 G2 G2 D3 G2 | C3 C3 G3 C3 G2 G2 B2 G2 | C3 C3 G3 C3 C3 . . .' },
    invest: { bpm: 104, drum: 'k...h...s...h...',
      lead: 'A4 - C5 - F5 - E5 - | D5 - C5 - A4 - - - | Bb4 - D5 - G5 - F5 - | E5 - - - C5 - - - | A4 - C5 - F5 - A5 - | G5 - F5 - D5 - - - | Bb4 - A4 - G4 - E4 - | F4 - - - - - . .',
      bass: 'F2 . C3 . F2 . C3 . | D2 . A2 . D2 . A2 . | Bb2 . F3 . Bb2 . F3 . | C3 . G3 . C3 . G3 . | F2 . C3 . F2 . C3 . | D2 . A2 . D2 . A2 . | G2 . D3 . C3 . E3 . | F2 . C3 . F2 . . .' },
    cross: { bpm: 128, drum: 'k.h.s.h.k.k.s.h.',
      lead: 'A4 . A4 C5 E5 - D5 C5 | B4 - G#4 - E4 - - . | A4 . A4 C5 E5 - F5 E5 | D5 - - - B4 - - . | F5 - E5 - D5 - C5 - | B4 - C5 - D5 - E5 - | A5 - G#5 - E5 - D5 - | C5 - B4 - A4 - - .',
      bass: 'A2 A3 A2 A3 A2 A3 A2 A3 | E2 E3 E2 E3 E2 E3 E2 E3 | A2 A3 A2 A3 A2 A3 A2 A3 | G2 G3 G2 G3 G2 G3 G2 G3 | F2 F3 F2 F3 F2 F3 F2 F3 | G2 G3 G2 G3 G2 G3 G2 G3 | E2 E3 E2 E3 E2 E3 E2 E3 | A2 A3 A2 A3 E2 E3 A2 .' },
    pursuit: { bpm: 160, drum: 'k.hsk.hsk.hsk.ss',
      lead: 'D5 F5 A5 F5 D5 F5 A5 - | C5 E5 G5 E5 C5 E5 G5 - | Bb4 D5 F5 D5 Bb4 D5 F5 - | A4 C#5 E5 C#5 A5 - - - | D6 - C6 - A5 - F5 - | G5 - F5 - E5 - C5 - | F5 - E5 - D5 - C#5 - | D5 - - - A4 - - -',
      bass: 'D3 D3 D2 D3 D3 D3 D2 D3 | C3 C3 C2 C3 C3 C3 C2 C3 | Bb2 Bb2 Bb1 Bb2 Bb2 Bb2 Bb1 Bb2 | A2 A2 A1 A2 A2 A2 A1 A2 | D3 D3 D2 D3 F3 F3 F2 F3 | C3 C3 C2 C3 C3 C3 C2 C3 | Bb2 Bb2 Bb1 Bb2 A2 A2 A1 A2 | D3 D3 D2 D3 A2 A2 A1 A2' },
    sad: { bpm: 76, lt: 'triangle',
      lead: 'D5 - - E5 F5 - - - | E5 - D5 - C#5 - - - | Bb4 - - C5 D5 - - - | A4 - - - - - . . | D5 - - E5 F5 - G5 - | A5 - - G5 F5 - E5 - | D5 - - C#5 D5 - E5 - | D5 - - - - - . .',
      bass: 'D3 - A3 - F3 - A3 - | A2 - E3 - G3 - E3 - | Bb2 - F3 - D3 - F3 - | A2 - E3 - C#3 - E3 - | D3 - A3 - F3 - A3 - | F2 - C3 - A2 - C3 - | G2 - D3 - A2 - E3 - | D3 - A3 - D3 - . .' },
    love: { bpm: 92,
      lead: 'E5 - G5 - C6 - B5 A5 | G5 - - - E5 - - - | F5 - A5 - D6 - C6 B5 | A5 - - - G5 - - - | E5 - G5 - C6 - D6 E6 | F6 - E6 - D6 - C6 - | B5 - G5 - A5 - B5 - | C6 - - - - - . .',
      bass: 'C3 G3 E3 G3 C3 G3 E3 G3 | A2 E3 C3 E3 A2 E3 C3 E3 | F2 C3 A2 C3 F2 C3 A2 C3 | G2 D3 B2 D3 G2 D3 B2 D3 | C3 G3 E3 G3 A2 E3 C3 E3 | F2 C3 A2 C3 D3 A3 F3 A3 | G2 D3 B2 D3 G2 D3 B2 D3 | C3 G3 E3 G3 C3 . . .' },
    comic: { bpm: 116, drum: 'k.h.s.h.',
      lead: 'C5 . E5 . G5 . E5 . | F5 . A5 . G5 . . . | E5 . C5 . D5 . B4 . | C5 . G4 . C5 . . . | A4 . C5 . F5 . A5 . | G5 . E5 . C5 . . . | D5 . F5 . E5 . D5 . | C5 . . . . . . .',
      bass: 'C3 . G2 . C3 . G2 . | F2 . C3 . G2 . D3 . | C3 . G2 . G2 . D3 . | C3 . G2 . C3 . . . | F2 . C3 . F2 . C3 . | C3 . G2 . C3 . G2 . | G2 . D3 . G2 . B2 . | C3 . G2 . C3 . . .' },
  };

  function tick() {
    if (!trk) return;
    const sd = 60 / trk.bpm / 2;
    while (nextT < ac.currentTime + 0.15) {
      const s = step % trk.len;
      const L = trk.p.lead.at[s], B = trk.p.bass.at[s];
      if (L && L.f) osc(trk.lt || 'square', L.f, nextT, L.len * sd * 0.92, trk.lt ? 0.16 : 0.075, bgBus, null, true);
      if (B && B.f) osc('triangle', B.f, nextT, B.len * sd * 0.9, 0.22, bgBus, null, true);
      if (trk.drum) {
        const ch = trk.drum[s % trk.drum.length];
        if (ch === 'k') osc('sine', 130, nextT, 0.12, 0.45, bgBus, 40);
        else if (ch === 's') noise(nextT, 0.1, 0.16, bgBus, 1500);
        else if (ch === 'h') noise(nextT, 0.03, 0.06, bgBus, 6000);
      }
      nextT += sd; step++;
    }
  }
  function stopBgm() { if (iv) clearInterval(iv); iv = null; trk = null; }
  function bgm(name) {
    if (!name || name === 'stop') { stopBgm(); cur = null; want = null; return; }
    if (name === cur) return;
    cur = name;
    if (!ac) { want = name; return; }
    stopBgm();
    const t = TR[name]; if (!t) return;
    if (!t.p) { t.p = { lead: parse(t.lead), bass: parse(t.bass) }; t.len = Math.max(t.p.lead.n, t.p.bass.n); }
    trk = t; step = 0; nextT = ac.currentTime + 0.08;
    iv = setInterval(tick, 25);
  }

  function se(n) {
    if (!ac || muted) return;
    const t = ac.currentTime;
    switch (n) {
      case 'objection':
        noise(t, 0.3, 0.3, sfBus, 700);
        osc('sawtooth', 523, t, 0.4, 0.13, sfBus, 262); osc('square', 784, t, 0.4, 0.08, sfBus, 392); break;
      case 'damage': osc('square', 320, t, 0.45, 0.2, sfBus, 55); noise(t, 0.3, 0.2, sfBus, 200); break;
      case 'get': [523, 659, 784, 1047].forEach((f, i) => osc('square', f, t + i * 0.07, 0.14, 0.11, sfBus)); break;
      case 'select': osc('square', 1300, t, 0.04, 0.07, sfBus); break;
      case 'buzz': for (let i = 0; i < 3; i++) osc('square', 95, t + i * 0.24, 0.17, 0.2, sfBus); break;
      case 'crash': noise(t, 1.0, 0.35, sfBus, 90); osc('sawtooth', 120, t, 0.9, 0.2, sfBus, 30); break;
      case 'stamp':
        osc('sine', 95, t, 0.3, 0.7, sfBus, 40); noise(t, 0.12, 0.3, sfBus, 300);
        [784, 988, 1175, 1568].forEach((f, i) => osc('square', f, t + 0.3 + i * 0.08, 0.3, 0.08, sfBus)); break;
      case 'shock': osc('square', 220, t, 0.3, 0.13, sfBus, 110); osc('square', 233, t, 0.3, 0.13, sfBus, 117); break;
      case 'flash': osc('triangle', 1600, t, 0.25, 0.12, sfBus, 300); break;
      case 'title': [392, 523, 659, 784].forEach((f, i) => osc('square', f, t + i * 0.1, 0.3, 0.09, sfBus)); break;
      case 'drop': osc('triangle', 900, t, 0.08, 0.2, sfBus, 400); osc('triangle', 700, t + 0.1, 0.08, 0.15, sfBus, 300); break;
    }
  }
  let lastBlip = 0;
  function blip(fem) {
    if (!ac || muted) return;
    const now = performance.now(); if (now - lastBlip < 40) return; lastBlip = now;
    osc('square', fem ? 1050 : 640, ac.currentTime, 0.028, 0.035, sfBus);
  }
  function toggle() {
    muted = !muted;
    try { localStorage.setItem('gk-mute', muted ? '1' : '0'); } catch (e) {}
    if (master) master.gain.value = muted ? 0 : 0.6;
    return muted;
  }
  return { init, bgm, se, blip, toggle, isMuted: () => muted };
})();
