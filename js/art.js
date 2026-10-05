'use strict';
// ドット絵を 240x160（GBA解像度）のキャンバスにコードで描く
const ART = (() => {
  const W = 240, H = 160, OL = '#1a0f12';
  let c = null;
  const use = x => { c = x; };

  // ---------- 基本図形（アンチエイリアスなし） ----------
  function R(x, y, w, h, col) { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
  function RO(x, y, w, h, col, ol = OL) { R(x - 1, y - 1, w + 2, h + 2, ol); R(x, y, w, h, col); }
  function E(cx, cy, rx, ry, col) {
    c.fillStyle = col;
    const y0 = Math.floor(cy - ry), y1 = Math.ceil(cy + ry);
    for (let y = y0; y <= y1; y++) {
      const t = (y + 0.5 - cy) / ry; if (t <= -1 || t >= 1) continue;
      const h = rx * Math.sqrt(1 - t * t);
      const a = Math.round(cx - h), b = Math.round(cx + h);
      if (b > a) c.fillRect(a, y, b - a, 1);
    }
  }
  function EO(cx, cy, rx, ry, col, ol = OL) { E(cx, cy, rx + 1, ry + 1, ol); E(cx, cy, rx, ry, col); }
  function P(pts, col) {
    c.fillStyle = col;
    let y0 = Infinity, y1 = -Infinity;
    for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
      const sy = y + 0.5, xs = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        if ((a[1] <= sy && b[1] > sy) || (b[1] <= sy && a[1] > sy)) xs.push(a[0] + (sy - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
      }
      xs.sort((p, q) => p - q);
      for (let i = 0; i + 1 < xs.length; i += 2) {
        const a = Math.round(xs[i]), b = Math.round(xs[i + 1]);
        if (b > a) c.fillRect(a, y, b - a, 1);
      }
    }
  }
  function PO(pts, col, ol = OL) {
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) P(pts.map(p => [p[0] + dx, p[1] + dy]), ol);
    P(pts, col);
  }
  function ring(cx, cy, r0, r1, col) {
    c.fillStyle = col;
    for (let y = Math.floor(cy - r1); y <= cy + r1; y++)
      for (let x = Math.floor(cx - r1); x <= cx + r1; x++) {
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
        if (d >= r0 && d <= r1) c.fillRect(x, y, 1, 1);
      }
  }
  function heart(x, y, s, col) {
    E(x - s / 2, y, s / 2 + 0.6, s / 2 + 0.6, col); E(x + s / 2, y, s / 2 + 0.6, s / 2 + 0.6, col);
    P([[x - s - 0.6, y + 0.4], [x + s + 0.6, y + 0.4], [x, y + s * 1.5]], col);
  }
  function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  const BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  // ディザリングの縦グラデーション（GBAっぽさの要）
  function vgrad(x, y, w, h, cols) {
    if (cols.length < 2) { R(x, y, w, h, cols[0]); return; }
    const img = c.getImageData(x, y, w, h), d = img.data, cs = cols.map(hex), n = cs.length - 1;
    for (let j = 0; j < h; j++) {
      const pos = (j / Math.max(1, h - 1)) * n, i = Math.min(n - 1, Math.floor(pos)), f = pos - i;
      for (let k = 0; k < w; k++) {
        const th = (BAY[((y + j) & 3) * 4 + ((x + k) & 3)] + 0.5) / 16;
        const col = f > th ? cs[i + 1] : cs[i], o = (j * w + k) * 4;
        d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255;
      }
    }
    c.putImageData(img, x, y);
  }
  function alpha(a, fn) { c.globalAlpha = a; fn(); c.globalAlpha = 1; }

  // ---------- 背景 ----------
  const BG = {
    black() { R(0, 0, W, H, '#000'); },
    title() {
      vgrad(0, 0, W, H, ['#1a0410', '#4a0a24', '#8a1838', '#c02a50']);
      const r = rng(11);
      alpha(0.18, () => { for (let i = 0; i < 26; i++) heart(r() * W, r() * 110, 2 + r() * 5, '#ffb0c8'); });
      alpha(0.25, () => { for (let i = 0; i < 12; i++) P([[120, 70], [120 + Math.cos(i / 12 * 6.283) * 300, 70 + Math.sin(i / 12 * 6.283) * 300], [120 + Math.cos((i + 0.4) / 12 * 6.283) * 300, 70 + Math.sin((i + 0.4) / 12 * 6.283) * 300]], '#ff7aa0'); });
      for (let i = 0; i < 4; i++) {
        const x = 38 + i * 55;
        E(x, 126, 12, 14, '#12040a'); P([[x - 26, 161], [x - 22, 144], [x - 10, 138], [x + 10, 138], [x + 22, 144], [x + 26, 161]], '#12040a');
        // ？マーク
        R(x - 3, 118, 6, 2, '#ff5a8a'); R(x + 2, 120, 2, 3, '#ff5a8a'); R(x - 1, 123, 3, 2, '#ff5a8a'); R(x - 1, 127, 2, 2, '#ff5a8a');
      }
    },
    office() {
      vgrad(0, 0, W, H, ['#070a1e', '#121a40', '#1e2a5a']);
      const r = rng(7);
      for (let i = 0; i < 4; i++) {
        const x = 10 + i * 57;
        R(x - 1, 11, 51, 76, '#3a4268');
        vgrad(x, 12, 49, 74, ['#03040c', '#0c1636', '#1a2a5a']);
        for (let b = 0; b < 5; b++) {
          const bw = 7 + Math.floor(r() * 10), bh = 12 + Math.floor(r() * 34), bx = x + Math.floor(r() * (49 - bw));
          R(bx, 86 - bh, bw, bh, '#05070f');
          for (let k = 0; k < bh / 3; k++) if (r() < 0.5) R(bx + 1 + Math.floor(r() * (bw - 2)), 86 - bh + 2 + Math.floor(r() * (bh - 3)), 1, 1, r() < 0.7 ? '#ffd870' : '#d8ecff');
        }
        R(x + 24, 12, 1, 74, '#3a4268'); R(x, 48, 49, 1, '#3a4268');
      }
      R(0, 0, W, 7, '#0a0d20'); for (let i = 0; i < 3; i++) R(30 + i * 80, 3, 40, 2, '#c8d8ff');
      vgrad(0, 96, W, 64, ['#22283f', '#121528']);
      R(0, 120, W, 5, '#5a5f78'); R(0, 125, W, 35, '#2a2e44');
      for (const mx of [16, 100, 184]) {
        RO(mx, 94, 40, 25, '#111');
        vgrad(mx + 2, 96, 36, 20, mx === 100 ? ['#6aa0f0', '#2a50a0'] : ['#1a2a50', '#0a1428']);
        if (mx === 100) for (let l = 0; l < 4; l++) R(mx + 5, 99 + l * 4, 18 + ((l * 7) % 12), 1, '#e0eeff');
        R(mx + 18, 119, 4, 2, '#333');
      }
      R(104, 124, 30, 4, '#c8c8d0'); // キーボード
      R(150, 112, 7, 9, '#f4f4f4'); R(157, 114, 2, 4, '#f4f4f4'); R(151, 113, 5, 2, '#6a3a1a'); // コーヒー
    },
    bar() {
      vgrad(0, 0, W, H, ['#140a06', '#24140c', '#3a2414']);
      for (let x = 0; x < W; x += 30) R(x, 0, 1, 124, '#1a0c06');
      const r = rng(3), cols = ['#3a7a3a', '#8a2a1a', '#c8a040', '#4a3a8a', '#2a6a7a', '#aa6020', '#d0d0c0'];
      for (const sy of [32, 60, 88]) {
        R(8, sy, 224, 3, '#7a4a24'); R(8, sy + 3, 224, 1, '#2a1408');
        let x = 12;
        while (x < 224) {
          const bw = 5 + Math.floor(r() * 3), bh = 11 + Math.floor(r() * 8), col = cols[Math.floor(r() * cols.length)];
          R(x, sy - bh, bw, bh, col); R(x + Math.floor(bw / 2) - 1, sy - bh - 4, 2, 4, col);
          R(x + 1, sy - bh + 2, 1, bh - 4, '#ffffff55'); R(x, sy - bh + 5, bw, 3, '#e8dcc0');
          x += bw + 2 + Math.floor(r() * 3);
        }
      }
      for (const lx of [40, 200]) { R(lx, 0, 1, 8, '#555'); P([[lx - 8, 15], [lx + 8, 15], [lx + 4, 8], [lx - 4, 8]], '#d89040'); E(lx, 16, 5, 2, '#fff0c0'); }
      alpha(0.12, () => { E(40, 24, 34, 22, '#ffcc66'); E(200, 24, 34, 22, '#ffcc66'); });
    },
    french() {
      vgrad(0, 0, W, 100, ['#3a0a12', '#5a1420', '#6a1a26']);
      for (let y = 6, row = 0; y < 96; y += 10, row++) for (let x = (row % 2) * 6; x < W; x += 12) { R(x, y, 2, 1, '#7e2a36'); R(x + 1, y - 1, 1, 3, '#7e2a36'); }
      R(0, 98, W, 62, '#2a120a'); R(0, 97, W, 3, '#c9a227');
      for (let x = 6; x < W; x += 40) { R(x, 106, 30, 44, '#36180e'); R(x, 106, 30, 1, '#4e2616'); }
      // 窓
      E(32, 26, 19, 10, '#c9a227'); R(13, 26, 38, 56, '#c9a227');
      E(32, 26, 16, 8, '#0a1030'); vgrad(16, 26, 32, 54, ['#0a1030', '#1a2a60']);
      const r = rng(5); for (let i = 0; i < 10; i++) R(18 + r() * 28, 20 + r() * 40, 1, 1, '#fff8d0');
      R(31, 18, 2, 62, '#c9a227'); R(16, 50, 32, 2, '#c9a227');
      // 絵画
      RO(186, 22, 40, 32, '#c9a227', '#6a4a10');
      vgrad(189, 25, 34, 26, ['#88b0d8', '#c8d8a0']); E(214, 31, 4, 4, '#fff0b0'); P([[189, 51], [200, 38], [210, 46], [218, 40], [223, 51]], '#4a7a3a');
      // シャンデリア
      R(119, 0, 2, 6, '#c9a227'); E(120, 9, 22, 4, '#c9a227'); E(120, 9, 18, 2, '#8a6a10');
      for (const i of [-16, -8, 0, 8, 16]) { R(120 + i, 3, 1, 4, '#fff'); E(120 + i, 2, 1.2, 1.8, '#ffe080'); R(120 + i, 13, 1, 3, '#e0f0ff'); }
      alpha(0.14, () => E(120, 10, 46, 20, '#ffe080'));
    },
    aquarium() {
      vgrad(0, 0, W, H, ['#021426', '#04264a', '#063660']);
      R(26, 6, 188, 118, '#0e1a26');
      vgrad(29, 9, 182, 112, ['#3ab0e0', '#1478b0', '#0a5088', '#063a68']);
      alpha(0.1, () => { for (let i = 0; i < 5; i++) P([[40 + i * 40, 9], [58 + i * 40, 9], [44 + i * 40, 121], [26 + i * 40, 121]], '#ffffff'); });
      vgrad(29, 108, 182, 13, ['#c8b07a', '#a08a58']);
      E(60, 110, 10, 4, '#7a7060'); E(190, 111, 12, 5, '#6a6050');
      for (const x of [44, 72, 176, 200]) for (let k = 0; k < 10; k++) R(x + Math.round(Math.sin(k * 0.9) * 2), 106 - k * 3, 2, 3, '#2a8a4a');
      R(26, 6, 188, 3, '#24384a'); R(26, 121, 188, 3, '#24384a');
      R(0, 124, W, 36, '#03101e');
      // 掲示板
      RO(4, 39, 24, 32, '#efe6c8', '#3a2a1a'); R(4, 39, 24, 5, '#d04848');
      for (let l = 0; l < 5; l++) R(7, 48 + l * 4, l === 4 ? 12 : 18, 1, '#6a6050');
      R(7, 66, 18, 2, '#d04848');
    },
    izakaya() {
      for (let x = 0; x < W; x += 12) { R(x, 0, 12, H, (x / 12) % 2 ? '#7a5030' : '#6e4828'); R(x, 0, 1, H, '#4a2c14'); }
      R(0, 0, W, 9, '#3a2010'); R(0, 9, W, 2, '#24120a');
      for (let i = 0; i < 6; i++) {
        const x = 180 + i * 9; RO(x, 13, 7, 34, '#f4ecd8', '#5a3a20');
        for (let k = 0; k < 5; k++) R(x + 3, 16 + k * 6, 1, 4, '#222');
      }
      R(30, 11, 1, 8, '#222');
      EO(30, 41, 13, 17, '#d82a20');
      for (const yy of [30, 36, 42, 48, 54]) { const w = Math.sqrt(1 - ((yy - 41) / 17) ** 2) * 13; R(30 - w, yy, w * 2, 1, '#a81810'); }
      R(23, 22, 15, 3, '#222'); R(23, 57, 15, 3, '#222');
      R(27, 34, 7, 2, '#1a0606'); R(29, 36, 3, 8, '#1a0606'); R(27, 40, 7, 1, '#1a0606');
      alpha(0.15, () => E(30, 41, 30, 30, '#ffb060'));
      R(60, 18, 50, 3, '#3a2010'); // 棚
      for (let i = 0; i < 4; i++) { E(66 + i * 12, 14, 4, 4, '#e8e0d0'); R(64 + i * 12, 10, 4, 2, '#3a3a6a'); }
    },
    park() { BG._park(false); },
    park_eve() { BG._park(true); },
    _park(eve) {
      vgrad(0, 0, W, 96, eve ? ['#5a3a8a', '#e0708a', '#f8b070', '#fde0b0'] : ['#5aa8f0', '#8ac8f8', '#d0ecff']);
      if (eve) { E(196, 74, 13, 13, '#ffe8b0'); alpha(0.3, () => E(196, 74, 26, 22, '#ffd080')); }
      const cl = eve ? '#ffd0c0' : '#ffffff';
      E(50, 24, 16, 6, cl); E(64, 21, 12, 7, cl); E(170, 30, 18, 6, cl); E(186, 27, 10, 6, cl);
      for (let x = -6; x < W + 10; x += 18) EO(x, 84 + (x % 36 ? 2 : -2), 14, 12, eve ? '#4a5a2a' : '#3a8a3a', eve ? '#2a3418' : '#1e5a22');
      vgrad(0, 92, W, 68, eve ? ['#6a8a3a', '#4a6a2a'] : ['#7ac04a', '#4a9a3a']);
      P([[96, 92], [144, 92], [180, 160], [60, 160]], eve ? '#c8a878' : '#e0cca0');
      // ベンチ
      R(48, 99, 144, 4, '#8a5a30'); R(48, 105, 144, 4, '#8a5a30'); R(48, 103, 144, 1, '#5a3a18');
      R(54, 109, 3, 14, '#3a3a3a'); R(183, 109, 3, 14, '#3a3a3a');
      // 木
      R(10, 36, 9, 64, '#6a4424'); R(12, 36, 2, 64, '#8a5a34');
      EO(14, 30, 24, 22, eve ? '#4a6a2a' : '#3a9a3a', eve ? '#24341a' : '#1a5a1a');
      E(8, 24, 8, 6, eve ? '#6a8a3a' : '#5aba4a');
    },
    court() {
      vgrad(0, 0, W, H, ['#2a1a10', '#4a2e18', '#5a3a1e']);
      for (let x = 30; x < 210; x += 38) { R(x, 18, 32, 92, '#6a4422'); R(x, 18, 32, 1, '#8a5a30'); R(x, 109, 32, 1, '#3a2210'); R(x + 3, 21, 26, 86, '#704826'); }
      for (const px of [0, 214]) { R(px, 0, 26, H, '#8a6a40'); R(px + 3, 0, 3, H, '#a88a58'); R(px + 20, 0, 3, H, '#5a4020'); R(px, 0, 26, 8, '#6a4a28'); }
      R(0, 0, W, 7, '#8a1020'); for (let x = 0; x < W; x += 20) E(x + 10, 7, 10, 4, '#8a1020');
      // ハートの天秤
      R(119, 14, 2, 20, '#e0c050'); R(100, 18, 40, 2, '#e0c050');
      for (const sx of [102, 138]) { R(sx, 20, 1, 8, '#e0c050'); heart(sx, 30, 3, '#ff5a7a'); }
      R(114, 33, 12, 2, '#e0c050');
      R(0, 110, W, 50, '#3a2410');
    },
  };
  BG.default = BG.black;

  const ANIM = {
    aquarium(t) {
      c.save(); c.beginPath(); c.rect(29, 9, 182, 99); c.clip();
      const cols = ['#ffd040', '#ff7a40', '#c0e0ff', '#ffe0f0', '#80f0c0', '#ffd040'];
      for (let i = 0; i < 6; i++) {
        const dir = i % 2 ? 1 : -1, sp = 0.012 + (i % 3) * 0.006;
        let x = (t * sp + i * 41) % 220; if (dir < 0) x = 220 - x; x += 10;
        const y = 22 + i * 13 + Math.sin(t / 700 + i) * 3, col = cols[i];
        E(x, y, 5, 2.5, col); P([[x - dir * 4, y], [x - dir * 9, y - 3], [x - dir * 9, y + 3]], col); R(x + dir * 3, y - 1, 1, 1, '#000');
      }
      for (let i = 0; i < 3; i++) {
        const jx = 54 + i * 62, jy = 40 + Math.sin(t / 900 + i * 2) * 8;
        alpha(0.75, () => { E(jx, jy, 7, 5, '#f0d8ff'); for (let k = -2; k <= 2; k++) R(jx + k * 3, jy + 3, 1, 8 + Math.sin(t / 300 + k) * 2, '#e8c8ff'); });
      }
      for (let i = 0; i < 8; i++) { const by = 108 - ((t * 0.02 + i * 30) % 100); R(36 + i * 23 + Math.sin(t / 400 + i) * 2, by, 2, 2, '#d8f4ff'); }
      c.restore();
    },
    bar(t) { alpha(0.06 + 0.03 * Math.sin(t / 600), () => E(120, 140, 120, 30, '#ffb060')); },
  };

  // ---------- キャラクター ----------
  const CH = {
    ichijo:   { skin: '#d49a6a', skinS: '#b07848', hair: '#26262c', hairH: '#5a5a66', style: 'slick', outfit: 'suit', suit: '#1e2a4c', suitS: '#131b33', shirt: '#f4f4f4', tie: '#c9a227', eye: 'narrow', thick: true, smileEyes: 'open', gray: true, pocket: true },
    ninomiya: { skin: '#f6d2ae', skinS: '#dcae88', hair: '#8a5430', hairH: '#c08850', style: 'fluffy', outfit: 'cardigan', suit: '#d8c8a8', suitS: '#b8a484', shirt: '#fafafa', eye: 'big', smileEyes: 'happy', earring: true, iris: '#4a2a18' },
    miura:    { skin: '#d8a476', skinS: '#b88050', hair: '#18181a', hairH: '#3a3a40', style: 'crew', outfit: 'suit', suit: '#5a6068', suitS: '#40464e', shirt: '#e8eef4', tie: '#7a2430', eye: 'tired', thick: true, stubble: true, broad: true, smileEyes: 'happy' },
    yotsuya:  { skin: '#f4d0aa', skinS: '#d8ac84', hair: '#2a2420', hairH: '#4a403a', style: 'messy', outfit: 'check', suit: '#3e7a58', suitS: '#2c5a40', shirt: '#e8e4d8', eye: 'dot', glasses: true, smileEyes: 'happy' },
    saeko:    { skin: '#f8dcc0', skinS: '#e0b898', hair: '#141018', hairH: '#3e3450', style: 'long', outfit: 'lady', suit: '#1c1c24', suitS: '#0e0e14', shirt: '#b81e3a', eye: 'sharp', fem: true, lips: '#c0203c', smileEyes: 'open' },
    kanae:    { skin: '#f8d8b8', skinS: '#e0b494', hair: '#5a3622', hairH: '#8a5a3a', style: 'bob', outfit: 'lady', suit: '#283a6a', suitS: '#1a2850', shirt: '#fafafa', eye: 'big', fem: true, lips: '#d0505a', smileEyes: 'happy' },
  };
  let cx = 120, hy = 58, hrx = 20, hry = 24, top = 88;

  function backHair(p) {
    const h = p.hair;
    switch (p.style) {
      case 'slick': EO(cx, hy - 7, hrx + 1, hry - 5, h); break;
      case 'fluffy': EO(cx, hy - 4, hrx + 5, hry - 1, h); break;
      case 'crew': break;
      case 'messy':
        EO(cx, hy - 6, hrx + 3, hry - 3, h);
        PO([[cx - 18, hy - 14], [cx - 27, hy - 22], [cx - 12, hy - 22]], h);
        PO([[cx + 16, hy - 16], [cx + 27, hy - 20], [cx + 18, hy - 6]], h);
        PO([[cx - 4, hy - 26], [cx + 2, hy - 34], [cx + 8, hy - 25]], h);
        P([[cx - 18, hy - 14], [cx - 25, hy - 21], [cx - 12, hy - 21]], h);
        P([[cx + 16, hy - 16], [cx + 25, hy - 19], [cx + 18, hy - 7]], h);
        P([[cx - 4, hy - 26], [cx + 2, hy - 32], [cx + 8, hy - 25]], h);
        E(cx, hy - 6, hrx + 3, hry - 3, h);
        break;
      case 'long': PO([[cx - hrx - 5, hy - 6], [cx - hrx - 1, hy - 20], [cx - 8, hy - hry - 3], [cx + 8, hy - hry - 3], [cx + hrx + 1, hy - 20], [cx + hrx + 5, hy - 6], [cx + hrx + 9, hy + 46], [cx - hrx - 9, hy + 46]], h); break;
      case 'bob': PO([[cx - hrx - 5, hy - 4], [cx - hrx - 1, hy - 18], [cx - 6, hy - hry - 3], [cx + 6, hy - hry - 3], [cx + hrx + 1, hy - 18], [cx + hrx + 5, hy - 4], [cx + hrx + 6, hy + 20], [cx - hrx - 6, hy + 20]], h); break;
    }
  }
  function frontHair(p) {
    const h = p.hair, hl = p.hairH;
    switch (p.style) {
      case 'slick':
        PO([[cx - hrx - 1, hy + 2], [cx - hrx - 1, hy - 12], [cx - 14, hy - 23], [cx - 2, hy - 28], [cx + 12, hy - 26], [cx + hrx, hy - 16], [cx + hrx + 1, hy + 2], [cx + hrx - 2, hy - 6], [cx + hrx - 6, hy - 12], [cx + 6, hy - 15], [cx - 6, hy - 16], [cx - hrx + 5, hy - 12], [cx - hrx + 2, hy - 4]], h);
        R(cx - 10, hy - 23, 12, 1, hl); R(cx - 15, hy - 19, 8, 1, hl); R(cx + 4, hy - 22, 8, 1, hl); R(cx + 8, hy - 18, 6, 1, hl);
        if (p.gray) { R(cx - hrx, hy - 8, 2, 7, '#8a8a96'); R(cx + hrx - 1, hy - 8, 2, 7, '#8a8a96'); }
        break;
      case 'fluffy':
        for (const i of [-15, -8, 0, 8, 15]) EO(cx + i, hy - 18 + Math.abs(i) / 3, 8, 7, h);
        for (const i of [-15, -8, 0, 8, 15]) E(cx + i, hy - 18 + Math.abs(i) / 3, 7, 6, h);
        PO([[cx - hrx, hy - 13], [cx + hrx + 1, hy - 15], [cx + 9, hy - 7], [cx + 1, hy - 10], [cx - 8, hy - 6], [cx - 14, hy - 9]], h);
        R(cx - 9, hy - 22, 6, 1, hl); R(cx + 3, hy - 23, 6, 1, hl); R(cx - 2, hy - 14, 7, 1, hl);
        break;
      case 'crew':
        PO([[cx - hrx - 1, hy - 1], [cx - hrx, hy - 14], [cx - 12, hy - 25], [cx + 12, hy - 25], [cx + hrx, hy - 14], [cx + hrx + 1, hy - 1], [cx + hrx - 2, hy - 1], [cx + hrx - 3, hy - 11], [cx - hrx + 3, hy - 11], [cx - hrx + 2, hy - 1]], h);
        for (let i = 0; i < 12; i++) R(cx - 14 + i * 2.5, hy - 20 + (i % 3) * 3, 1, 1, hl);
        break;
      case 'messy':
        PO([[cx - hrx - 2, hy - 2], [cx - hrx, hy - 18], [cx - 10, hy - 27], [cx + 8, hy - 27], [cx + hrx + 2, hy - 16], [cx + hrx + 2, hy - 2], [cx + hrx - 2, hy - 8], [cx + 14, hy - 6], [cx + 10, hy - 12], [cx + 6, hy - 6], [cx + 1, hy - 11], [cx - 4, hy - 6], [cx - 8, hy - 12], [cx - 12, hy - 6], [cx - 16, hy - 12], [cx - hrx + 1, hy - 5]], h);
        R(cx - 6, hy - 22, 5, 1, hl); R(cx + 4, hy - 20, 4, 1, hl);
        break;
      case 'long':
        PO([[cx - 1, hy - hry - 1], [cx - hrx - 2, hy - 14], [cx - hrx - 2, hy + 16], [cx - hrx + 3, hy + 13], [cx - hrx + 4, hy - 6], [cx - 8, hy - 14]], h);
        PO([[cx + 1, hy - hry - 1], [cx + hrx + 2, hy - 14], [cx + hrx + 2, hy + 16], [cx + hrx - 3, hy + 13], [cx + hrx - 4, hy - 6], [cx + 8, hy - 14]], h);
        PO([[cx - hrx - 3, hy + 10], [cx - hrx + 3, hy + 10], [cx - hrx + 4, hy + 50], [cx - hrx - 6, hy + 50]], h);
        PO([[cx + hrx + 3, hy + 10], [cx + hrx - 3, hy + 10], [cx + hrx - 4, hy + 50], [cx + hrx + 6, hy + 50]], h);
        R(cx - 13, hy - 16, 4, 1, hl); R(cx + 9, hy - 16, 4, 1, hl);
        break;
      case 'bob':
        PO([[cx - hrx - 2, hy + 18], [cx - hrx - 2, hy - 12], [cx - 10, hy - hry - 1], [cx + 10, hy - hry - 1], [cx + hrx + 2, hy - 12], [cx + hrx + 2, hy + 18], [cx + hrx - 3, hy + 18], [cx + hrx - 3, hy - 6], [cx + 8, hy - 8], [cx + 2, hy - 6], [cx - 5, hy - 8], [cx - hrx + 3, hy - 6], [cx - hrx + 3, hy + 18]], h);
        R(cx - 8, hy - 18, 6, 1, hl); R(cx + 4, hy - 17, 5, 1, hl);
        break;
    }
  }
  function body(p) {
    const sw = p.broad ? 64 : (p.fem ? 50 : 57);
    const pts = [[cx - sw, 161], [cx - sw + 3, top + 20], [cx - sw + 14, top + 6], [cx - 20, top], [cx + 20, top], [cx + sw - 14, top + 6], [cx + sw - 3, top + 20], [cx + sw, 161]];
    PO(pts, p.suit);
    P([[cx + sw - 14, top + 6], [cx + sw - 3, top + 20], [cx + sw, 161], [cx + sw - 9, 161], [cx + sw - 11, top + 22]], p.suitS);
    if (p.outfit === 'check') {
      c.save(); c.beginPath(); pts.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.closePath(); c.clip();
      for (let x = 0; x < W; x += 10) R(x, top - 4, 3, 80, p.suitS);
      for (let y = top + 2; y < H; y += 10) R(0, y, W, 3, '#2c5a40aa');
      for (let x = 6; x < W; x += 10) R(x, top - 4, 1, 80, '#7ab890');
      c.restore();
      P([[cx + sw - 14, top + 6], [cx + sw - 3, top + 20], [cx + sw, 161], [cx + sw - 9, 161], [cx + sw - 11, top + 22]], '#00000033');
    }
    if (p.outfit === 'cardigan') {
      PO([[cx - 14, top - 2], [cx + 14, top - 2], [cx + 10, 161], [cx - 10, 161]], p.shirt);
    }
  }
  function collar(p) {
    switch (p.outfit) {
      case 'suit':
        PO([[cx - 11, top - 3], [cx + 11, top - 3], [cx, top + 30]], p.shirt);
        PO([[cx - 11, top - 4], [cx - 2, top + 7], [cx - 13, top + 5]], p.shirt, '#8a8a90');
        PO([[cx + 11, top - 4], [cx + 2, top + 7], [cx + 13, top + 5]], p.shirt, '#8a8a90');
        PO([[cx - 3, top + 3], [cx + 3, top + 3], [cx + 4, top + 23], [cx, top + 29], [cx - 4, top + 23]], p.tie);
        EO(cx, top + 3, 3, 2.5, p.tie);
        R(cx - 17, top + 13, 3, 3, p.suitS); R(cx + 14, top + 13, 3, 3, p.suitS);
        if (p.pocket) { P([[cx + 22, top + 21], [cx + 30, top + 21], [cx + 27, top + 17], [cx + 25, top + 19]], '#ffffff'); R(cx + 21, top + 21, 10, 1, p.suitS); }
        break;
      case 'cardigan':
        P([[cx - 9, top - 2], [cx + 9, top - 2], [cx, top + 9]], p.skin);
        for (let i = 0; i < 7; i++) R(cx - 8 + i * 1.3, top + i * 1.6, 1, 1, '#c8d0e0');
        for (let i = 0; i < 7; i++) R(cx + 8 - i * 1.3, top + i * 1.6, 1, 1, '#c8d0e0');
        for (let i = 0; i < 4; i++) { R(cx - 18, top + 20 + i * 10, 2, 2, '#8a7050'); R(cx + 17, top + 20 + i * 10, 2, 2, '#8a7050'); }
        break;
      case 'check':
        P([[cx - 7, top - 2], [cx + 7, top - 2], [cx, top + 7]], p.shirt);
        PO([[cx - 12, top - 4], [cx - 1, top + 6], [cx - 6, top + 11], [cx - 16, top + 3]], p.suit);
        PO([[cx + 12, top - 4], [cx + 1, top + 6], [cx + 6, top + 11], [cx + 16, top + 3]], p.suit);
        R(cx, top + 8, 1, 70, p.suitS); for (let i = 0; i < 5; i++) R(cx + 2, top + 14 + i * 11, 2, 2, '#e8e4d8');
        R(cx + 18, top + 18, 10, 9, p.suitS); R(cx + 20, top + 16, 2, 6, '#3a5ad0'); R(cx + 24, top + 15, 2, 7, '#e0c040'); // ペン
        break;
      case 'lady':
        PO([[cx - 12, top - 3], [cx + 12, top - 3], [cx, top + 28]], p.shirt);
        P([[cx - 7, top - 3], [cx + 7, top - 3], [cx, top + 11]], p.skin);
        R(cx - 1, top + 10, 3, 3, '#f0e0a0');
        break;
    }
  }
  function brow(x, y, dir, kind, p) {
    const col = p.brow || p.hair, th = p.thick ? 2 : 1;
    const slope = kind === 'up' ? -3 : kind === 'down' ? 3 : 0, yo = kind === 'high' ? -3 : 0;
    for (let i = 0; i < 9; i++) {
      const k = dir < 0 ? i / 8 : (8 - i) / 8;
      R(x - 4 + i, y + yo + Math.round(slope * k), 1, th, col);
    }
  }
  function eye(x, y, s, dir, p, look) {
    const dk = '#1a1016';
    if (s === 'closed') { R(x - 3, y + 1, 7, 1, dk); return; }
    if (s === 'happy') { R(x - 3, y + 2, 1, 1, dk); R(x - 2, y + 1, 1, 1, dk); R(x - 1, y, 3, 1, dk); R(x + 2, y + 1, 1, 1, dk); R(x + 3, y + 2, 1, 1, dk); return; }
    if (s === 'blank') { EO(x, y + 1, 3, 2.5, '#ffffff', dk); return; }
    if (s === 'wide') { EO(x, y + 1, 3.5, 3.5, '#ffffff', dk); R(x, y + 1, 1, 1, dk); return; }
    if (p.eye === 'dot') { const h = s === 'half' ? 1 : 3; R(x - 1 + look, y + (s === 'half' ? 1 : 0), 2, h, dk); return; }
    let h = (p.eye === 'narrow' || p.eye === 'tired') ? 2 : p.eye === 'big' ? 4 : 3;
    if (s === 'half') h = Math.max(1, h - 2);
    R(x - 3, y, 7, h, '#ffffff');
    const px = x - 1 + look;
    R(px, y, 3, h, p.iris || '#2a1a14'); if (h > 2) R(px, y, 1, 1, '#ffffff');
    R(x - 4, y - 1, 9, 1, dk);
    const o = dir > 0 ? 1 : -1;
    if (p.eye === 'sharp') { R(x + o * 4, y - 2, 1, 1, dk); R(x + o * 5, y - 3, 1, 1, dk); }
    if (p.fem) { R(x + o * 5, y - 1, 1, 1, dk); R(x + o * 5, y - 2, 1, 1, dk); }
    if (p.eye === 'tired') R(x - 2, y + h + 1, 5, 1, p.skinS);
  }
  function drop(x, y) {
    E(x, y + 2, 3.2, 3.2, '#2a6aa8'); P([[x, y - 5], [x + 3, y + 1], [x - 3, y + 1]], '#2a6aa8');
    E(x, y + 2, 2.2, 2.2, '#bfe8ff'); P([[x, y - 3], [x + 2, y + 1], [x - 2, y + 1]], '#bfe8ff'); R(x - 1, y + 1, 1, 1, '#fff');
  }
  function face(p, expr, mouth, blink) {
    const ey = hy + 1, dk = '#1a1016';
    let es = 'open', bk = 'flat', look = 0;
    switch (expr) {
      case 'smile': es = p.smileEyes === 'happy' ? 'happy' : 'open'; break;
      case 'sweat': bk = 'up'; look = -1; break;
      case 'shock': es = 'wide'; bk = 'high'; break;
      case 'angry': bk = 'down'; break;
      case 'sad': es = 'half'; bk = 'up'; break;
      case 'blush': es = 'happy'; bk = 'up'; break;
      case 'break': es = 'blank'; bk = 'up'; break;
    }
    if (blink && (es === 'open' || es === 'half')) es = 'closed';
    brow(cx - 9, ey - 6, -1, bk, p); brow(cx + 9, ey - 6, 1, bk, p);
    if (p.glasses) { EO(cx - 9, ey + 1, 6, 5, '#eef4fa', '#2a2a2a'); EO(cx + 9, ey + 1, 6, 5, '#eef4fa', '#2a2a2a'); R(cx - 3, ey, 6, 1, '#2a2a2a'); }
    eye(cx - 9, ey, es, -1, p, look); eye(cx + 9, ey, es, 1, p, look);
    if (p.glasses) { R(cx - 13, ey - 2, 2, 1, '#fff'); R(cx + 5, ey - 2, 2, 1, '#fff'); }
    R(cx, hy + 7, 1, 3, p.skinS); R(cx - 1, hy + 10, 2, 1, p.skinS);
    const my = hy + 15, mc = p.lips || '#7a3a34';
    if (p.stubble) for (const [dx, dy] of [[-8, 14], [-6, 17], [-3, 19], [0, 20], [3, 19], [6, 17], [8, 14], [-5, 21], [5, 21], [-1, 22], [2, 22], [-10, 11], [10, 11]]) R(cx + dx, hy + dy, 1, 1, '#9a7058');
    if (expr === 'break') { EO(cx, my + 2, 5, 4, '#2a0606', dk); R(cx - 3, my - 1, 7, 1, '#ffffff'); }
    else if (mouth) { EO(cx, my + 1, 3.5, 2.5, '#7a1a24', dk); R(cx - 2, my + 2, 4, 1, '#e06070'); }
    else switch (expr) {
      case 'smile': case 'blush': R(cx - 4, my - 1, 1, 1, mc); R(cx - 3, my, 7, 1, mc); R(cx + 4, my - 1, 1, 1, mc); break;
      case 'sweat': R(cx - 4, my, 2, 1, mc); R(cx - 2, my + 1, 2, 1, mc); R(cx, my, 2, 1, mc); R(cx + 2, my + 1, 2, 1, mc); break;
      case 'shock': EO(cx, my + 1, 2.5, 3, '#3a0a0e', dk); break;
      case 'angry': R(cx - 5, my - 2, 11, 5, dk); R(cx - 4, my - 1, 9, 3, '#ffffff'); R(cx, my - 1, 1, 3, '#bbb'); break;
      case 'sad': R(cx - 4, my + 1, 1, 1, mc); R(cx - 3, my, 7, 1, mc); R(cx + 4, my + 1, 1, 1, mc); break;
      default: R(cx - 3, my, 7, 1, mc);
    }
    if (p.fem && !mouth && expr !== 'break' && expr !== 'shock' && expr !== 'angry') R(cx - 2, my + 1, 5, 1, '#e08a90');
    if (expr === 'blush') for (const s of [-1, 1]) { E(cx + s * 12, ey + 7, 4, 1.6, '#ff90a0'); R(cx + s * 12 - 2, ey + 6, 1, 2, '#ff6a80'); R(cx + s * 12 + 1, ey + 6, 1, 2, '#ff6a80'); }
  }
  function drawChar(id, expr, mouth, blink) {
    const p = CH[id]; if (!p) return;
    cx = 120; hy = p.fem ? 60 : 58; hrx = p.fem ? 18 : 20; hry = p.fem ? 22 : 24; top = hy + 30;
    backHair(p);
    body(p);
    PO([[cx - 7, hy + 14], [cx + 7, hy + 14], [cx + 8, top + 4], [cx - 8, top + 4]], p.skin);
    R(cx - 7, hy + 18, 15, 4, p.skinS);
    collar(p);
    EO(cx - hrx, hy + 3, 3, 5, p.skin); EO(cx + hrx, hy + 3, 3, 5, p.skin);
    R(cx - hrx - 1, hy + 2, 1, 3, p.skinS); R(cx + hrx + 1, hy + 2, 1, 3, p.skinS);
    EO(cx, hy, hrx, hry, p.skin);
    if (!p.fem) P([[cx - hrx + 3, hy + 10], [cx + hrx - 3, hy + 10], [cx + 9, hy + hry - 1], [cx - 9, hy + hry - 1]], p.skin);
    if (expr === 'break') alpha(0.35, () => E(cx, hy - 8, hrx - 1, hry - 10, '#2030a0'));
    face(p, expr, mouth, blink);
    frontHair(p);
    if (p.earring) { R(cx + hrx, hy + 8, 2, 2, '#e8eef8'); R(cx + hrx, hy + 8, 1, 1, '#fff'); }
    if (expr === 'sweat' || expr === 'shock') { drop(cx + hrx - 1, hy - 8); if (expr === 'sweat') drop(cx - hrx + 1, hy - 2); }
    if (expr === 'break') for (let i = 0; i < 6; i++) R(cx - 12 + i * 5, hy - 12, 1, 12 - (i % 2) * 4, '#3a4ac0');
    if (expr === 'shock') for (const [x, y, w, h] of [[cx - hrx - 10, hy - 22, 2, 7], [cx - hrx - 14, hy - 12, 6, 2], [cx + hrx + 9, hy - 22, 2, 7], [cx + hrx + 9, hy - 12, 6, 2]]) R(x, y, w, h, '#ffffff');
  }

  // ---------- 手前の小物（調べるポイント） ----------
  function hands(id, lx, rx, y) {
    const p = CH[id]; if (!p) return;
    R(lx - 12, y - 4, 9, 8, p.suit); R(lx - 12, y - 4, 9, 1, OL);
    EO(lx, y, 7, 4, p.skin); R(lx - 3, y - 2, 1, 4, p.skinS);
    R(rx + 3, y - 4, 9, 8, p.suit); R(rx + 3, y - 4, 9, 1, OL);
    EO(rx, y, 7, 4, p.skin); R(rx + 3, y - 2, 1, 4, p.skinS);
  }
  const FG = {
    french(s) {
      P([[0, 136], [32, 128], [18, 161], [0, 161]], '#4a0c14');
      P([[240, 136], [208, 128], [222, 161], [240, 161]], '#4a0c14');
      if (s.props.receipt) { RO(4, 149, 11, 7, '#f8f8f0', '#888'); R(6, 151, 7, 1, '#999'); R(6, 153, 5, 1, '#999'); }
      PO([[30, 128], [210, 128], [222, 161], [18, 161]], '#f4f0e6', '#8a7a6a');
      P([[24, 150], [216, 150], [222, 161], [18, 161]], '#e0d8c8');
      EO(120, 140, 17, 4.5, '#ffffff', '#b8b0a0'); E(120, 140, 10, 2.5, '#a86040'); R(114, 139, 4, 1, '#3a8a3a');
      EO(62, 118, 5, 6, '#8a1428', '#b8c8d8'); R(57, 112, 11, 3, '#e8eef8'); R(61, 124, 2, 10, '#c8d0d8'); E(62, 134, 5, 1.5, '#c8d0d8'); R(59, 115, 1, 3, '#fff');
      R(150, 120, 2, 8, '#f8f0d0'); E(151, 119, 1, 2, '#ffd040');
      const lit = s.props.phonelit;
      P([[168, 133], [188, 133], [191, 140], [171, 140]], OL); P([[169, 134], [187, 134], [189, 139], [172, 139]], lit ? '#7ad0ff' : '#2a2a34');
      if (s.char === 'ichijo') {
        hands('ichijo', 92, 148, 131);
        R(80, 128, 5, 5, '#d8d8e0'); R(81, 129, 3, 3, '#5a6a8a');
        R(144, 129, 1, 3, '#f6dcc0');
      }
    },
    bar() {
      R(0, 128, W, 32, '#4a2812'); R(0, 124, W, 5, '#8a5428'); R(0, 124, W, 1, '#c88a48');
      for (let x = 8; x < W; x += 26) R(x, 134 + (x % 3), 14, 1, '#3a1e0c');
      E(196, 112, 8, 3, '#e8f4ff'); P([[188, 112], [204, 112], [196, 120]], '#e8f4ff88'); R(195, 120, 2, 6, '#e8f4ff'); E(196, 126, 4, 1, '#e8f4ff');
      P([[189, 113], [203, 113], [196, 119]], '#e05a7a');
      RO(36, 112, 10, 12, '#f0d080', '#8a7040'); R(37, 113, 8, 3, '#fffbe8');
    },
    aquarium(s) {
      if (s.char === 'ninomiya') {
        P([[107, 108], [108, 108], [114, 128], [113, 128]], '#2a7ad0'); P([[132, 108], [133, 108], [127, 128], [126, 128]], '#2a7ad0');
        RO(110, 127, 20, 13, '#ffffff', '#2a3a5a'); R(110, 127, 20, 4, '#2a7ad0');
        for (let i = 0; i < 3; i++) E(115 + i * 5, 135, 1.5, 1.5, '#e8b890');
        EO(158, 142, 7, 6, '#f6d2ae'); R(150, 136, 10, 7, '#d8c8a8'); R(150, 136, 10, 1, OL);
        R(151, 141, 10, 3, '#ff5aa8'); R(155, 141, 2, 2, '#ffe040');
      }
    },
    izakaya(s) {
      R(0, 124, W, 36, '#b07a40'); R(0, 122, W, 3, '#d8a060');
      for (let x = 6; x < W; x += 22) R(x, 132 + (x % 4), 16, 1, '#8a5a28');
      RO(62, 107, 14, 20, '#f0b020', '#8a6010'); E(69, 107, 8, 3, '#ffffff'); R(76, 111, 4, 2, '#8a6010'); R(78, 111, 2, 10, '#8a6010'); R(76, 119, 4, 2, '#8a6010'); R(64, 112, 2, 12, '#ffd860');
      EO(120, 134, 16, 4, '#ffffff', '#999'); R(108, 132, 24, 1, '#c08040'); for (let i = 0; i < 4; i++) E(112 + i * 5, 132, 2, 1.6, '#7a3a1a');
      RO(94, 134, 10, 6, '#ffe070', '#8a6a20'); R(104, 136, 9, 2, '#c8c8d0'); R(111, 135, 2, 4, '#c8c8d0'); R(96, 136, 6, 1, '#8a6a20');
      R(163, 129, 22, 12, OL); R(164, 130, 20, 10, s.props.mphone ? '#9ae0ff' : '#1a1a1a');
      if (s.props.mphone) { R(166, 132, 10, 1, '#1a3a6a'); R(166, 135, 14, 1, '#1a3a6a'); }
      RO(8, 138, 18, 13, '#ff8ab0', '#8a3050'); R(10, 140, 14, 9, s.props.kphone ? '#bff0c0' : '#222');
      if (s.props.kphone) { R(12, 142, 8, 1, '#2a6a2a'); R(12, 145, 6, 1, '#2a6a2a'); }
    },
    court() {
      PO([[64, 128], [176, 128], [184, 161], [56, 161]], '#8a5428');
      R(59, 121, 122, 8, '#b0703a'); R(59, 121, 122, 1, '#d89858'); R(59, 129, 122, 1, OL); R(58, 120, 124, 1, OL);
      R(92, 134, 1, 26, '#6a3a18'); R(148, 134, 1, 26, '#6a3a18');
      for (let i = 0; i < 3; i++) R(100 + i * 16, 140, 8, 8, '#7a4a20');
    },
    park(s) {
      if (s.props.bag) {
        RO(192, 103, 13, 10, '#fffef0', '#8a8070'); R(194, 105, 6, 4, '#3a70e0'); R(201, 105, 2, 2, '#ff4a6a');
        EO(198, 121, 15, 13, '#c06a30'); R(186, 112, 24, 3, '#8a4a20'); R(194, 124, 8, 6, '#a05a28');
      }
      if (s.props.memo) { P([[25, 147], [39, 144], [41, 151], [27, 154]], '#8a8a80'); P([[26, 147], [38, 145], [40, 150], [28, 153]], '#ffffff'); R(29, 148, 7, 1, '#556'); }
      if (s.props.lunch) { RO(34, 125, 26, 11, '#4a8ad0', '#1a3a6a'); P([[37, 133], [45, 133], [37, 127]], '#f8e8a0'); P([[47, 133], [56, 133], [47, 127]], '#f8e8a0'); R(37, 132, 8, 1, '#f0c040'); }
    },
    office() {},
  };
  FG.park_eve = FG.park;

  // ---------- 証拠アイコン（32x32） ----------
  const ICON = {
    profile() { RO(4, 6, 24, 20, '#f8f8f8'); R(4, 6, 24, 4, '#e85a7a'); E(11, 16, 3, 3, '#7a8ab0'); P([[6, 25], [16, 25], [15, 21], [7, 21]], '#7a8ab0'); R(18, 14, 8, 1, '#888'); R(18, 17, 8, 1, '#888'); R(18, 20, 6, 1, '#888'); heart(26, 3, 2, '#ff5a7a'); },
    hand() {
      const sk = '#d49a6a';
      for (let i = 0; i < 4; i++) R(8 + i * 4, 3 + (i === 0 || i === 3 ? 3 : 0), 5, 15, OL);
      E(16, 21, 9, 9, OL); P([[5, 18], [9, 14], [12, 22]], OL);
      for (let i = 0; i < 4; i++) R(9 + i * 4, 4 + (i === 0 || i === 3 ? 3 : 0), 3, 14, sk);
      E(16, 21, 8, 8, sk); P([[6, 18], [9, 15], [12, 21]], sk);
      R(17, 13, 3, 2, '#fff2dc');
    },
    receipt() { R(7, 1, 18, 29, '#888'); R(8, 2, 16, 27, '#fafaf4'); for (let i = 0; i < 5; i++) R(10, 6 + i * 3, 9 + (i % 2) * 3, 1, '#666'); R(10, 23, 12, 2, '#333'); for (let x = 8; x < 24; x += 2) R(x, 28, 1, 1, '#888'); },
    phone() { RO(9, 2, 14, 28, '#222'); R(11, 5, 10, 20, '#7ad0ff'); R(12, 8, 8, 2, '#fff'); R(12, 12, 8, 1, '#2a4a8a'); E(16, 18, 3, 3, '#3ac060'); R(14, 26, 4, 2, '#555'); },
    hairtie() { ring(16, 17, 4, 7, OL); ring(16, 17, 5, 6, '#ff6fb0'); heart(23, 7, 2.5, '#ffe040'); R(22, 9, 1, 3, '#ff6fb0'); },
    card() { RO(3, 8, 26, 16, '#2a2420'); R(6, 12, 10, 2, '#d8b860'); R(6, 16, 16, 1, '#a89060'); R(6, 19, 12, 1, '#a89060'); },
    memo() { EO(16, 13, 13, 9, '#ffffff'); P([[9, 19], [15, 21], [6, 28]], OL); P([[10, 19], [14, 20], [8, 26]], '#ffffff'); R(9, 10, 14, 1, '#666'); R(9, 14, 10, 1, '#666'); },
    pass() { R(15, 0, 2, 7, '#2a7ad0'); RO(6, 7, 20, 20, '#ffffff'); R(6, 7, 20, 5, '#2a7ad0'); E(10, 17, 2, 2, '#e8b890'); E(16, 17, 2, 2, '#e8b890'); E(22, 18, 1.5, 1.5, '#e8b890'); R(9, 22, 14, 1, '#999'); },
    sign() { R(7, 24, 2, 7, '#6a4a2a'); R(23, 24, 2, 7, '#6a4a2a'); RO(3, 4, 26, 20, '#f0e8cc'); R(3, 4, 26, 4, '#d04848'); for (let i = 0; i < 3; i++) R(6, 11 + i * 4, 18 - i * 3, 1, '#6a6050'); },
    key() { ring(10, 10, 3, 5, '#c8c8d0'); R(14, 9, 14, 3, '#c8c8d0'); R(22, 12, 2, 3, '#c8c8d0'); R(26, 12, 2, 2, '#c8c8d0'); RO(4, 18, 12, 9, '#ffe070', '#8a6a20'); R(6, 21, 8, 1, '#8a6a20'); R(6, 23, 5, 1, '#8a6a20'); },
    calendar() { RO(9, 2, 14, 28, '#222'); R(11, 5, 10, 20, '#ffffff'); R(11, 5, 10, 5, '#d04040'); for (let r = 0; r < 4; r++) for (let q = 0; q < 3; q++) R(12 + q * 3, 12 + r * 3, 2, 2, (r === 1 && q === 1) ? '#d04040' : '#999'); },
    chat() { EO(16, 14, 13, 10, '#6ad070', '#2a6030'); P([[19, 21], [26, 28], [13, 23]], '#6ad070'); R(9, 11, 14, 1, '#fff'); R(9, 15, 10, 1, '#fff'); },
    meishi() { RO(3, 8, 26, 16, '#ffffff'); R(5, 10, 6, 6, '#e84040'); R(6, 12, 4, 2, '#fff'); R(13, 11, 13, 1, '#444'); R(13, 14, 10, 1, '#444'); R(5, 19, 20, 1, '#888'); },
    pamphlet() { RO(6, 2, 20, 28, '#ffe060'); RO(12, 6, 8, 7, '#5a8ad0'); R(14, 8, 1, 2, '#fff'); R(17, 8, 1, 2, '#fff'); R(15, 4, 2, 2, '#e04040'); RO(11, 15, 10, 8, '#5a8ad0'); R(9, 16, 2, 5, '#5a8ad0'); R(21, 16, 2, 5, '#5a8ad0'); R(8, 26, 16, 2, '#e04040'); },
    drawing() { RO(3, 4, 26, 24, '#fffef4'); R(9, 8, 9, 6, '#3a70e0'); R(8, 15, 11, 8, '#3a70e0'); R(11, 10, 1, 1, '#000'); R(15, 10, 1, 1, '#000'); R(12, 6, 3, 2, '#e04040'); heart(24, 10, 2.5, '#ff4a6a'); R(6, 25, 20, 1, '#e04040'); R(21, 17, 5, 1, '#40a040'); },
    box() { RO(7, 13, 18, 14, '#1a2a6a'); RO(6, 10, 20, 5, '#24388a'); R(15, 10, 2, 17, '#e0c040'); E(12, 8, 3.5, 2.2, '#e0c040'); E(20, 8, 3.5, 2.2, '#e0c040'); R(9, 20, 5, 1, '#9aaae0'); R(18, 20, 5, 1, '#9aaae0'); },
    note() { RO(5, 2, 22, 28, '#ffffff'); for (let l = 0; l < 6; l++) R(6, 6 + l * 4, 20, 1, '#9ac0f0'); R(9, 2, 1, 28, '#f09090'); for (let l = 0; l < 5; l++) R(11, 4 + l * 4, 6 + (l * 5) % 10, 1, '#333'); heart(22, 25, 2, '#ff5a7a'); },
  };

  // ---------- 公開API ----------
  const bgCache = {};
  function bgCanvas(name) {
    if (!bgCache[name]) {
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
      const prev = c; use(cv.getContext('2d', { willReadFrequently: true }));
      (BG[name] || BG.black)();
      use(prev); bgCache[name] = cv;
    }
    return bgCache[name];
  }
  // 立ち絵画像（assets/chars/<id>_<表情>.png、480x320）。無ければドット絵で代用
  const SPR = {}, EXPRS = ['normal', 'smile', 'sweat', 'shock', 'angry', 'sad', 'blush', 'break'];
  function loadSprites(ids) {
    for (const id of ids) for (const ex of EXPRS) {
      const im = new Image(); im.src = `assets/chars/${id}_${ex}.png`;
      SPR[id + '_' + ex] = im;
    }
  }
  const FIT = { bar: 0.74, izakaya: 0.74, french: 0.78 };
  const sprite = (id, ex) => { const im = SPR[id + '_' + ex]; return im && im.complete && im.naturalWidth ? im : null; };
  // 画面は 480x320。背景・小物は 240x160 の座標で描いて2倍に拡大する
  function render(ctx, s) {
    const SC = ctx.canvas.width / W;
    ctx.imageSmoothingEnabled = false;
    ctx.setTransform(SC, 0, 0, SC, 0, 0);
    ctx.drawImage(bgCanvas(s.bg), 0, 0);
    use(ctx);
    if (ANIM[s.bg]) ANIM[s.bg](s.t);
    if (s.char) {
      const im = sprite(s.char, s.expr) || sprite(s.char, 'normal');
      if (im) {
        // カウンターやテーブルが手前にある場面は、肩まで見えるよう少し小さく描く
        const k = FIT[s.bg] || 1, cw = ctx.canvas.width, ch = ctx.canvas.height;
        ctx.setTransform(1, 0, 0, 1, (s.jitter || 0) * SC, 0);
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(im, cw * (1 - k) / 2, (26 - 22 * k) * cw / 480, cw * k, ch * k);
        ctx.imageSmoothingEnabled = false;
      } else {
        ctx.translate(s.jitter || 0, 0);
        drawChar(s.char, s.expr, s.mouth, s.blink);
      }
      ctx.setTransform(SC, 0, 0, SC, 0, 0);
    }
    if (FG[s.bg]) FG[s.bg](s);
  }
  function icon(ctx, name) { use(ctx); ctx.clearRect(0, 0, 32, 32); (ICON[name] || ICON.memo)(); }
  loadSprites(['ichijo', 'ninomiya', 'miura', 'yotsuya', 'saeko', 'kanae']);
  return { render, icon, W, H };
})();
