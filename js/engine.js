'use strict';
// ゲームエンジン：シナリオ実行・調査・尋問・法廷記録・セーブ
const $ = s => document.querySelector(s);
const esc = s => s.replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

// ---------- シナリオ解析 ----------
function parseScript(src) {
  const L = {}; let cur = null;
  for (const raw of src.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    if (line[0] === '*') { cur = L[line.slice(1).trim()] = []; continue; }
    if (line.startsWith('- ')) {
      const last = cur[cur.length - 1]; const k = line.lastIndexOf('>');
      last.opts.push({ t: line.slice(2, k).trim(), l: line.slice(k + 1).trim() }); continue;
    }
    if (line[0] === '@') {
      const body = line.slice(1), sp = body.search(/\s/);
      const op = sp < 0 ? body : body.slice(0, sp), s = sp < 0 ? '' : body.slice(sp + 1).trim();
      const c = { k: 'op', op, s, a: s ? s.split(/\s+/) : [] };
      if (op === 'choice') c.opts = [];
      cur.push(c); continue;
    }
    if (line[0] === '>') { cur.push({ k: 'say', name: '', text: line.slice(1).trim() }); continue; }
    const m = line.match(/^([^:：|>{}（『]{1,8})(?:\|(\w+))?:\s*(.*)$/);
    if (m) { cur.push({ k: 'say', name: m[1].trim(), expr: m[2], text: m[3] }); continue; }
    cur.push({ k: 'say', name: '', text: line });
  }
  return L;
}
const S = parseScript(SCRIPT_SRC);
const CHAPTERS = [
  { l: 'start', t: '序章　ラストチャンス' },
  { l: 'ch1', t: '第1話　逆転のフルコース' },
  { l: 'ch2', t: '第2話　逆転のアクアリウム' },
  { l: 'ch3', t: '第3話　逆転のバツイチ' },
  { l: 'ch4', t: '第4話　さいごの逆転' },
];
const NAMEMAP = { 一条: 'ichijo', 二宮: 'ninomiya', 三浦: 'miura', 四谷: 'yotsuya', 冴子: 'saeko', カナエ: 'kanae' };
const FEM = { 冴子: 1, カナエ: 1 };

const G = {
  label: null, i: 0, stack: [], onEnd: null, mode: 'title',
  bg: 'title', char: null, expr: 'normal', props: {},
  ev: [], evAlt: {}, hearts: 5, maxHearts: 5, dead: false,
  cross: null, inv: null, invSeen: {}, seenTesti: {}, checkpoint: null,
  typing: false, speaker: null, evPopup: 0, playStart: 0,
};
let advanceFn = null, invTab = 'look', hover = null;

// ---------- セーブ ----------
function loadSave() { try { return JSON.parse(localStorage.getItem('gk-save') || '{}'); } catch (e) { return {}; } }
function writeSave(o) { try { localStorage.setItem('gk-save', JSON.stringify(Object.assign(loadSave(), o))); } catch (e) {} }

// ---------- 描画ループ ----------
const cv = $('#cv'), ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;
let blinkT = 0, blinkOn = false, mouthOn = false, lastFlap = 0;
function frame(ts) {
  if (ts > blinkT) { blinkOn = !blinkOn; blinkT = ts + (blinkOn ? 110 : 2400 + Math.random() * 2200); }
  if (G.typing && G.speaker && G.speaker === G.char) { if (ts - lastFlap > 105) { mouthOn = !mouthOn; lastFlap = ts; } }
  else mouthOn = false;
  ART.render(ctx, { bg: G.bg, char: G.char, expr: G.expr, mouth: mouthOn, blink: blinkOn, props: G.props, t: ts,
    jitter: G.expr === 'break' ? ((ts / 50 | 0) % 2 ? 1 : -1) : 0 });
  if (G.mode === 'invest' && invTab === 'look') drawInvestOverlay(ts);
  $('#hearts').classList.toggle('on', G.bg === 'court' && G.mode !== 'title');
  requestAnimationFrame(frame);
}
function drawInvestOverlay(ts) {
  const d = G.inv.d, seen = G.invSeen[G.inv.id];
  for (const s of d.spots) if (seen[s.id] && s.id !== 'face') {
    const x = s.x + s.w - 6, y = s.y + 1;
    ctx.fillStyle = '#1a0f12'; ctx.fillRect(x - 1, y - 1, 7, 7);
    ctx.fillStyle = '#7cf08a'; ctx.fillRect(x, y, 5, 5);
    ctx.fillStyle = '#1a0f12'; ctx.fillRect(x + 1, y + 2, 1, 1); ctx.fillRect(x + 2, y + 3, 1, 1); ctx.fillRect(x + 3, y + 1, 1, 2);
  }
  if (hover) {
    const s = d.spots.find(q => hitSpot(q, hover.x, hover.y));
    const pulse = (ts / 200 | 0) % 2;
    ctx.strokeStyle = s ? (pulse ? '#ffd84a' : '#ff8a3a') : '#ffffff88';
    ctx.lineWidth = 1;
    const x = Math.round(hover.x), y = Math.round(hover.y);
    ctx.strokeRect(x - 6.5, y - 6.5, 13, 13);
    ctx.fillStyle = ctx.strokeStyle; ctx.fillRect(x, y - 9, 1, 4); ctx.fillRect(x, y + 6, 1, 4); ctx.fillRect(x - 9, y, 4, 1); ctx.fillRect(x + 6, y, 4, 1);
  }
}
const hitSpot = (s, x, y) => x >= s.x && x < s.x + s.w && y >= s.y && y < s.y + s.h;

// ---------- テキスト表示 ----------
function parseMarkup(text) {
  const segs = []; let red = false, buf = '';
  for (const ch of text) {
    if (ch === '{' || ch === '}') { if (buf) segs.push({ t: [...buf], red }); buf = ''; red = ch === '{'; }
    else buf += ch;
  }
  if (buf) segs.push({ t: [...buf], red });
  return segs;
}
function markupHTML(text) { return parseMarkup(text).map(s => s.red ? `<span class="red">${esc(s.t.join(''))}</span>` : esc(s.t.join(''))).join(''); }
function renderSegs(segs, n) {
  let out = '', k = 0;
  for (const s of segs) {
    if (k >= n) break;
    const part = s.t.slice(0, n - k).join(''); k += s.t.length;
    out += s.red ? `<span class="red">${esc(part)}</span>` : esc(part);
  }
  return out;
}
let typeTimer = null;
function showText(name, text, opts = {}) {
  return new Promise(res => {
    clearTimeout(typeTimer);
    $('#tbox').classList.remove('hidden');
    const np = $('#nameplate');
    if (name) { np.textContent = name; np.style.display = ''; } else np.style.display = 'none';
    const tx = $('#text');
    tx.className = opts.green ? 'green' : text.startsWith('（') ? 'blue' : '';
    const segs = parseMarkup(text), total = segs.reduce((a, s) => a + s.t.length, 0), chars = segs.flatMap(s => s.t);
    let n = 0;
    G.typing = true; G.speaker = NAMEMAP[name] || null;
    $('#next').classList.remove('on');
    const fem = !!FEM[name];
    const finish = () => {
      clearTimeout(typeTimer); n = total; tx.innerHTML = renderSegs(segs, n); G.typing = false;
      if (opts.static) { advanceFn = null; res(); return; }
      $('#next').classList.add('on');
      advanceFn = () => { advanceFn = null; $('#next').classList.remove('on'); AUDIO.se('select'); res(); };
    };
    const tick = () => {
      if (n >= total) { finish(); return; }
      const ch = chars[n++];
      tx.innerHTML = renderSegs(segs, n);
      if (name && !' 　…。、！？「」（）'.includes(ch)) AUDIO.blip(fem);
      let d = opts.green ? 22 : 30;
      if ('。！？'.includes(ch)) d = 200; else if ('、'.includes(ch)) d = 100; else if (ch === '…') d = 60;
      typeTimer = setTimeout(tick, d);
    };
    advanceFn = finish;
    tick();
  });
}
function afterSay() {
  if (G.evPopup > 0 && --G.evPopup === 0) $('#evpop').classList.remove('on');
}

// ---------- 演出 ----------
function shake() { const el = $('#shaker'); el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
function flash() { const el = $('#flash'); el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); }
function cutin(txt, who) {
  return new Promise(res => {
    const el = $('#cut'); el.querySelector('span').textContent = txt;
    el.className = 'on ' + (who || 'kanae');
    AUDIO.se('objection'); shake();
    setTimeout(() => { el.className = ''; res(); }, 1000);
  });
}
function waitClick(minMs, fn) {
  const t0 = performance.now();
  advanceFn = () => { if (performance.now() - t0 < minMs) return; advanceFn = null; fn(); };
}
function titleCard(l1, l2) {
  return new Promise(res => {
    $('#tbox').classList.add('hidden');
    const el = $('#tcard'); el.querySelector('.l1').textContent = l1; el.querySelector('.l2').textContent = l2 || '';
    el.classList.add('on'); AUDIO.se('title');
    const done = () => { clearTimeout(t); advanceFn = null; el.classList.remove('on'); res(); };
    const t = setTimeout(done, 3200);
    waitClick(600, done);
  });
}
function banner(s) {
  return new Promise(res => {
    const [m, sub] = s.split('|');
    const el = $('#banner'); el.innerHTML = `<div class="m">${esc(m)}</div>` + (sub ? `<div class="s">${esc(sub)}</div>` : '');
    $('#tbox').classList.add('hidden');
    el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); AUDIO.se('title');
    const done = () => { clearTimeout(t); advanceFn = null; el.classList.remove('on'); res(); };
    const t = setTimeout(done, 1700);
    waitClick(400, done);
  });
}
function stampShow(kind) {
  return new Promise(res => {
    $('#tbox').classList.add('hidden');
    const el = $('#stamp'), s = el.querySelector('.s');
    s.className = 's ' + kind; s.textContent = kind === 'single' ? '独身' : '既婚';
    el.classList.add('on'); AUDIO.se('stamp');
    waitClick(900, () => { el.classList.remove('on'); res(); });
  });
}
function iconCanvas(name, size = 32) {
  const c = document.createElement('canvas'); c.width = 32; c.height = 32;
  ART.icon(c.getContext('2d'), name); return c;
}
const evDesc = id => (G.evAlt[id] && EVID[id].desc2) || EVID[id].desc;
function showEvPop(id, n) {
  const e = EVID[id], el = $('#evpop');
  el.innerHTML = ''; el.appendChild(iconCanvas(e.icon));
  const d = document.createElement('div'); d.textContent = e.name; el.appendChild(d);
  el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  G.evPopup = n;
}
function showGet(id) {
  const e = EVID[id], el = $('#getev');
  el.innerHTML = ''; el.appendChild(iconCanvas(e.icon));
  const d = document.createElement('div'); d.innerHTML = `<b>${esc(e.name)}</b>${markupHTML(evDesc(id))}`;
  el.appendChild(d); el.classList.add('on');
}
function updHearts(hit) {
  const el = $('#hearts');
  el.innerHTML = Array.from({ length: G.maxHearts }, (_, i) => `<span class="${i < G.hearts ? '' : 'lost'}">♥</span>`).join('');
  if (hit) { el.classList.remove('hit'); void el.offsetWidth; el.classList.add('hit'); }
}

// ---------- シナリオ実行 ----------
function runLabel(label, onEnd) {
  G.label = label; G.i = 0; G.stack = []; G.onEnd = onEnd || null;
  G.mode = 'script'; setPanel('script'); step();
}
function step() {
  for (;;) {
    const arr = S[G.label];
    if (!arr) { console.error('ラベルがありません:', G.label); return; }
    if (G.i >= arr.length) {
      if (G.stack.length) { const f = G.stack.pop(); G.label = f.label; G.i = f.i; continue; }
      const cb = G.onEnd; G.onEnd = null; if (cb) cb();
      return;
    }
    const c = arr[G.i++];
    if (exec(c) === 'wait') return;
  }
}
function exec(c) {
  if (c.k === 'say') {
    if (c.expr) { const id = NAMEMAP[c.name]; if (id && id === G.char) G.expr = c.expr; }
    showText(c.name, c.text, { green: c.green }).then(() => { afterSay(); step(); });
    return 'wait';
  }
  const a = c.a;
  switch (c.op) {
    case 'bg': G.bg = a[0]; return;
    case 'ch': if (a[0] === 'none') G.char = null; else { G.char = a[0]; G.expr = a[1] || 'normal'; } return;
    case 'ex': G.expr = a[0]; return;
    case 'bgm': AUDIO.bgm(a[0] === 'stop' ? null : a[0]); return;
    case 'se': AUDIO.se(a[0]); return;
    case 'prop': G.props[a[0]] = a[1] !== '0'; return;
    case 'propclear': G.props = {}; return;
    case 'fx': {
      if (a[0] === 'shake') { shake(); return; }
      if (a[0] === 'flash') { flash(); return; }
      const txt = { objection: '異議あり！', holdit: '待った！', takethat: 'くらえ！' }[a[0]];
      cutin(txt, a[1]).then(step); return 'wait';
    }
    case 'get': {
      const id = a[0];
      if (G.ev.includes(id)) return;
      G.ev.push(id); showGet(id); AUDIO.se('get');
      showText('', `「${EVID[id].name}」を法廷記録にファイルした。`).then(() => { $('#getev').classList.remove('on'); step(); });
      return 'wait';
    }
    case 'evup': G.evAlt[a[0]] = true; return;
    case 'showev': showEvPop(a[0], +(a[1] || 3)); return;
    case 'title': { const [l1, l2] = c.s.split('|'); titleCard(l1, l2).then(step); return 'wait'; }
    case 'banner': banner(c.s).then(step); return 'wait';
    case 'stamp': stampShow(a[0]).then(step); return 'wait';
    case 'wait': setTimeout(step, +a[0]); return 'wait';
    case 'goto': G.label = a[0]; G.i = 0; G.stack = []; return;
    case 'call': G.stack.push({ label: G.label, i: G.i }); G.label = a[0]; G.i = 0; return;
    case 'save': { const sv = loadSave(); writeSave({ max: Math.max(sv.max || 0, +a[0]) }); return; }
    case 'clearev': G.ev = []; G.evAlt = {}; G.invSeen = {}; G.props = {}; G.seenTesti = {}; return;
    case 'hearts': G.hearts = G.maxHearts = +a[0]; updHearts(); return;
    case 'dmg':
      G.hearts = Math.max(0, G.hearts - (+a[0] || 1)); updHearts(true);
      AUDIO.se('damage'); shake(); if (G.hearts <= 0) G.dead = true; return;
    case 'retry': {
      G.hearts = G.maxHearts; G.dead = false; updHearts();
      const cp = G.checkpoint; G.label = cp.label; G.i = cp.i; G.stack = []; G.onEnd = null; return;
    }
    case 'totitle': showTitle(); return 'wait';
    case 'invest': startInvest(a[0]); return 'wait';
    case 'cross': G.checkpoint = { label: G.label, i: G.i - 1 }; startCross(a[0]); return 'wait';
    case 'choice': showChoice(c.opts); return 'wait';
    case 'present': {
      const ok = a[0].split(','), ng = a[1], here = { label: G.label, i: G.i - 1 };
      openRecord({ present: true, noBack: true, prompt: 'つきつける証拠を選ぼう', onPresent: id => {
        closeRecord();
        cutin('くらえ！').then(() => {
          if (ok.includes(id)) step();
          else { G.stack.push(here); G.label = ng; G.i = 0; step(); }
        });
      } });
      return 'wait';
    }
    case 'end': showEnd(); return 'wait';
    default: console.warn('未知の命令', c.op);
  }
}

// ---------- 調査パート ----------
function startInvest(id) {
  const d = INVEST[id];
  G.inv = { id, d }; G.invSeen[id] = G.invSeen[id] || {};
  G.bg = d.bg; if (d.ch) G.char = d.ch; G.expr = 'normal';
  G.mode = 'invest'; hover = null;
  clearTimeout(typeTimer); advanceFn = null; G.typing = false;
  $('#tbox').classList.add('hidden');
  setPanel('invest');
}
function invRun(key, label) {
  G.invSeen[G.inv.id][key] = true; hover = null;
  runLabel(label, afterInv);
}
function afterInv() {
  const d = G.inv.d, seen = G.invSeen[G.inv.id];
  if (!seen.__done && d.need.every(k => seen[k])) { seen.__done = true; runLabel(d.done, null); }
  else startInvest(G.inv.id);
}
function invClick(x, y) {
  const s = G.inv.d.spots.find(q => hitSpot(q, x, y));
  AUDIO.se('select');
  if (s) invRun(s.id, s.l);
  else runLabel('__nothing', () => startInvest(G.inv.id));
}

// ---------- 尋問パート ----------
function startCross(id) {
  const d = CROSS[id];
  G.cross = { id, d, idx: 0 };
  G.bg = 'court'; G.char = d.who; G.expr = 'normal';
  if (d.bgm) AUDIO.bgm(d.bgm);
  updHearts();
  const L = '__t_' + id;
  const cmds = [];
  if (!G.seenTesti[id]) {
    cmds.push({ k: 'op', op: 'banner', s: '～ 証言開始 ～|' + d.title, a: [] });
    d.st.forEach(s => cmds.push({ k: 'say', name: d.name, text: s.t, green: true }));
  }
  cmds.push({ k: 'op', op: 'banner', s: '～ 尋問開始 ～|' + d.title, a: [] });
  S[L] = cmds;
  G.seenTesti[id] = true;
  runLabel(L, () => showStatement(0));
}
function showStatement(idx) {
  const cr = G.cross; cr.idx = idx;
  G.mode = 'cross'; G.char = cr.d.who; G.expr = 'normal'; G.bg = 'court';
  const ct = $('#ctitle'); ct.textContent = `尋問：${cr.d.title}　${idx + 1}/${cr.d.st.length}`; ct.classList.add('on');
  setPanel('cross');
  showText(cr.d.name, cr.d.st[idx].t, { green: true, static: true });
}
function crossNav(dir) {
  const cr = G.cross, n = cr.d.st.length;
  AUDIO.se('select');
  if (dir < 0) { if (cr.idx > 0) showStatement(cr.idx - 1); return; }
  if (cr.idx < n - 1) showStatement(cr.idx + 1);
  else runLabel('__loop', () => showStatement(0));
}
function crossPress() {
  const cr = G.cross, st = cr.d.st[cr.idx], idx = cr.idx;
  setPanel('busy');
  cutin('待った！').then(() => runLabel(st.p, () => showStatement(idx)));
}
function crossPresent() {
  const cr = G.cross, st = cr.d.st[cr.idx], idx = cr.idx;
  openRecord({ present: true, prompt: '証言にムジュンする証拠は？', onPresent: id => {
    closeRecord(); setPanel('busy');
    cutin('異議あり！').then(() => {
      if (st.a && st.a.includes(id)) runLabel(cr.d.ok, null);
      else runLabel(cr.d.wrong, () => { if (G.dead) runLabel('gameover', null); else showStatement(idx); });
    });
  } });
}

// ---------- 法廷記録 ----------
let recOpts = null;
function openRecord(o) {
  recOpts = o; const el = $('#record'); el.classList.add('on');
  let sel = G.ev[0];
  const draw = () => {
    el.innerHTML = '';
    const h = document.createElement('div'); h.className = 'rh';
    h.innerHTML = `<span>${esc(o.prompt || '法廷記録')}</span>`;
    const bs = document.createElement('div'); bs.className = 'rbtns';
    if (o.present && sel) bs.appendChild(btn('つきつける！', 'red small', () => o.onPresent(sel)));
    if (!o.noBack) bs.appendChild(btn('もどる', 'gray small', () => { AUDIO.se('select'); closeRecord(); }));
    h.appendChild(bs);
    el.appendChild(h);
    const grid = document.createElement('div'); grid.className = 'evgrid';
    for (let i = 0; i < 6; i++) {
      const id = G.ev[i];
      const b = document.createElement('button'); b.className = 'evitem' + (id ? '' : ' empty') + (id && id === sel ? ' sel' : '');
      if (id) { b.appendChild(iconCanvas(EVID[id].icon)); b.onclick = () => { sel = id; AUDIO.se('select'); draw(); }; b.title = EVID[id].name; }
      grid.appendChild(b);
    }
    el.appendChild(grid);
    const det = document.createElement('div'); det.className = 'evdetail';
    if (sel) { const t = document.createElement('div'); t.innerHTML = `<b>${esc(EVID[sel].name)}</b>${markupHTML(evDesc(sel))}`; det.appendChild(t); }
    else det.textContent = 'まだ証拠はない。';
    el.appendChild(det);
  };
  draw();
}
function closeRecord() { $('#record').classList.remove('on'); recOpts = null; }

// ---------- 下画面パネル ----------
function btn(label, cls, fn) {
  const b = document.createElement('button'); b.className = 'btn ' + (cls || ''); b.textContent = label;
  b.onclick = e => { e.stopPropagation(); AUDIO.init(); fn(); };
  return b;
}
function row(...els) { const r = document.createElement('div'); r.className = 'row'; els.forEach(e => r.appendChild(e)); return r; }
function soundBtn() {
  return btn(AUDIO.isMuted() ? '♪ OFF' : '♪ ON', 'gray small', function () { AUDIO.toggle(); setPanel(G.mode === 'title' ? 'title' : panelMode); });
}
let panelMode = 'script';
function setPanel(mode, arg) {
  panelMode = mode;
  const p = $('#panel'); p.innerHTML = '';
  if (mode !== 'cross' && mode !== 'busy') $('#ctitle').classList.remove('on');
  if (mode === 'script' || mode === 'busy') {
    const n = document.createElement('div'); n.className = 'nexta'; n.textContent = mode === 'busy' ? '' : '▼ タップで進む';
    n.onclick = () => { AUDIO.init(); if (advanceFn) advanceFn(); };
    p.appendChild(n);
    const recB = btn('法廷記録', 'blue small', () => openRecord({}));
    p.appendChild(row(recB, soundBtn()));
  } else if (mode === 'invest') {
    const lookB = btn('調べる', invTab === 'look' ? 'sel' : '', () => { invTab = 'look'; setPanel('invest'); });
    const talkB = btn('話す', invTab === 'talk' ? 'sel' : '', () => { invTab = 'talk'; setPanel('invest'); });
    p.appendChild(row(lookB, talkB, btn('法廷記録', 'blue', () => openRecord({}))));
    const d = G.inv.d, seen = G.invSeen[G.inv.id];
    if (invTab === 'talk') {
      const list = document.createElement('div'); list.className = 'list grow';
      d.talks.forEach(t => { const b = btn(t.t, 'pink' + (seen[t.id] ? ' done' : ''), () => invRun(t.id, t.l)); list.appendChild(b); });
      p.appendChild(list);
    } else {
      const found = d.spots.filter(s => seen[s.id]).length;
      const info = document.createElement('div'); info.className = 'info grow';
      info.innerHTML = `<span style="color:#8ad4ff">${esc(d.hint)}</span><br>上の画面の、気になるところをタップしよう。<br>調べたところ：${found}／${d.spots.length}　<span style="color:#7cf08a">■</span>＝調べた場所`;
      p.appendChild(info);
    }
    p.appendChild(row(soundBtn()));
  } else if (mode === 'cross') {
    const r = document.createElement('div'); r.className = 'crossrow';
    const prev = btn('◀', 'gray arrow', () => crossNav(-1)); prev.disabled = G.cross.idx === 0;
    r.appendChild(prev);
    r.appendChild(btn('ゆさぶる', 'blue', crossPress));
    r.appendChild(btn('つきつける', 'red', crossPresent));
    r.appendChild(btn('▶', 'gray arrow', () => crossNav(1)));
    p.appendChild(r);
    const info = document.createElement('div'); info.className = 'info grow';
    info.innerHTML = '気になる証言は「ゆさぶる」。<br>証拠とムジュンする証言には「つきつける」。';
    p.appendChild(info);
    p.appendChild(row(btn('法廷記録', 'blue small', () => openRecord({})), soundBtn()));
  } else if (mode === 'choice') {
    const list = document.createElement('div'); list.className = 'list grow';
    arg.forEach(o => list.appendChild(btn(o.t, '', () => { G.label = o.l; G.i = 0; G.stack = []; G.mode = 'script'; setPanel('script'); step(); })));
    p.appendChild(list);
  } else if (mode === 'title') {
    const sv = loadSave();
    const list = document.createElement('div'); list.className = 'list grow';
    list.appendChild(btn('はじめから', '', newGame));
    if (sv.max != null) list.appendChild(btn('つづきから（章をえらぶ）', 'blue', () => setPanel('chapters')));
    list.appendChild(btn('あそびかた', 'gray', () => setPanel('help')));
    p.appendChild(list);
    const note = document.createElement('div'); note.className = 'info';
    note.style.fontSize = '2.8cqw';
    note.textContent = '音が出ます（♪で切りかえ）　プレイ時間：約1時間';
    p.appendChild(note);
    p.appendChild(row(soundBtn()));
  } else if (mode === 'chapters') {
    const sv = loadSave();
    const list = document.createElement('div'); list.className = 'list grow';
    CHAPTERS.forEach((c, i) => { if (i <= (sv.max || 0)) list.appendChild(btn(c.t + (sv.clear && i === 4 ? '' : ''), i === 0 ? '' : 'blue', () => startChapter(i))); });
    p.appendChild(list);
    p.appendChild(row(btn('もどる', 'gray small', () => setPanel('title'))));
  } else if (mode === 'help') {
    const h = document.createElement('div'); h.className = 'help grow';
    h.innerHTML = '<b>■ 目的</b><br>4人の男性の中から、既婚者ではない「本当の独身」を見つけ出そう。<br>' +
      '<b>■ 調査パート</b><br>「調べる」で画面をタップ、「話す」で話題を選んで手がかりを集める。手に入れた証拠は「法廷記録」に入る。<br>' +
      '<b>■ 脳内法廷（尋問）</b><br>相手の証言を◀▶で行き来しながら、気になる発言は「ゆさぶる」。証拠とムジュンする発言には、法廷記録から証拠を「つきつける」。<br>' +
      '間違えると右上の心のゲージ（♥）が減る。ゼロになると、その尋問をやり直し。<br>' +
      '<b>■ 操作</b><br>タップ／クリックで文章を進める。キーボードなら Enter・スペースで進む、←→で証言の移動。<br>' +
      '<b>■ セーブ</b><br>章のはじめで自動セーブ。「つづきから」で章を選べる。<br>' +
      '※この物語はフィクションです。実在の人物・団体とは関係ありません。';
    p.appendChild(h);
    p.appendChild(row(btn('もどる', 'gray small', () => setPanel('title'))));
  }
}
function showChoice(opts) { G.mode = 'choice'; setPanel('choice', opts); }

// ---------- タイトル・エンディング ----------
function resetOverlays() {
  ['#evpop', '#getev', '#banner', '#tcard', '#stamp', '#ending', '#cut'].forEach(s => $(s).classList.remove('on'));
  $('#cut').className = ''; closeRecord(); G.evPopup = 0;
}
function showTitle() {
  clearTimeout(typeTimer); advanceFn = null; resetOverlays();
  G.mode = 'title'; G.bg = 'title'; G.char = null; G.typing = false;
  $('#tbox').classList.add('hidden'); $('#logo').classList.add('on');
  AUDIO.bgm('title');
  setPanel('title');
}
function startChapter(i) {
  AUDIO.init(); $('#logo').classList.remove('on'); resetOverlays();
  G.hearts = G.maxHearts = 5; G.dead = false; updHearts();
  runLabel(CHAPTERS[i].l, null);
}
function newGame() { G.playStart = Date.now(); startChapter(0); }
function showEnd() {
  writeSave({ max: 4, clear: true });
  $('#tbox').classList.add('hidden');
  AUDIO.bgm('love');
  const el = $('#ending');
  let tm = '';
  if (G.playStart) { const m = Math.round((Date.now() - G.playStart) / 60000); tm = `<div class="tm">プレイ時間　約${m}分</div>`; }
  el.innerHTML = `<div class="s">逆転婚活　～その男、独身につき～</div><div class="t">おしまい</div>${tm}<div class="tm">ここまで遊んでくれて、ありがとう！</div>`;
  el.classList.add('on');
  G.mode = 'end';
  const p = $('#panel'); p.innerHTML = '';
  const list = document.createElement('div'); list.className = 'list grow';
  list.appendChild(btn('タイトルへ', '', showTitle));
  p.appendChild(list);
}

// ---------- 入力 ----------
function canvasXY(e) {
  const r = cv.getBoundingClientRect();
  return { x: (e.clientX - r.left) / r.width * ART.W, y: (e.clientY - r.top) / r.height * ART.H };
}
$('#screen').addEventListener('click', e => {
  AUDIO.init();
  if (G.mode === 'invest' && invTab === 'look' && !G.typing) { const { x, y } = canvasXY(e); invClick(x, y); return; }
  if (G.mode === 'invest' && invTab === 'look' && G.typing && advanceFn) { advanceFn(); return; }
  if (advanceFn) advanceFn();
});
$('#screen').addEventListener('pointermove', e => { if (G.mode === 'invest') hover = canvasXY(e); });
$('#screen').addEventListener('pointerleave', () => { hover = null; });
document.addEventListener('keydown', e => {
  if ($('#record').classList.contains('on')) { if (e.key === 'Escape' && recOpts && !recOpts.noBack) closeRecord(); return; }
  if (e.key === 'Enter' || e.key === ' ' || e.key === 'z') {
    e.preventDefault(); AUDIO.init();
    if (advanceFn) advanceFn();
  } else if (G.mode === 'cross' && e.key === 'ArrowLeft') crossNav(-1);
  else if (G.mode === 'cross' && e.key === 'ArrowRight') crossNav(1);
});

// ---------- 起動 ----------
updHearts();
showTitle();
requestAnimationFrame(frame);
