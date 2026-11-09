/* 云朵小镇 · 界面：标题、选角、捏人、工具栏、目录抽屉、各种小窗口 */
'use strict';
(function (CT) {
  const UI = (CT.UI = {});
  const G = CT.G, A = CT.Audio, W = CT.World, O = CT.CHAR_OPTS, FURN = CT.FURN, OBJ = CT.MAPOBJ;
  const $ = (id) => document.getElementById(id);
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const k in attrs || {}) {
      const v = attrs[k];
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (v !== null && v !== undefined && v !== false) el.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat(Infinity)) if (kid !== null && kid !== undefined && kid !== false) el.append(kid);
    return el;
  }
  const ICON = {
    home: 'M3 11.5 12 4l9 7.5M5.5 10v10h13V10M10 20v-6h4v6',
    map: 'M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20zM9 4v13.5M15 6.5V20',
    sofa: 'M5 11V9a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v2M2.5 13a2 2 0 0 1 4 0v2h11v-2a2 2 0 0 1 4 0v5h-19zM5.5 18v2M18.5 18v2',
    palette: 'M12 3.5a8.5 8.5 0 1 0 0 17c1.6 0 2.2-1 1.9-2-.4-1.3.3-2.6 1.8-2.6H18c2 0 3.5-1.5 3.5-3.6 0-5.2-4.4-8.8-9.5-8.8zM8 11.2h.01M11 7.8h.01M15.3 8.5h.01',
    girl: 'M12 3.5a6.5 6.5 0 0 0-6.5 6.5c0 3.5-1 6-2 8h17c-1-2-2-4.500-2-8A6.500 6.500 0 0 0 12 3.500zM8 11.500c2 0 3.500-.8 4.500-2.500 1 1.700 2 2.500 3.500 2.500M8.500 14.500a3.700 3.700 0 0 0 7 0M9 20.500h6',
    paw: 'M7 10.500h.01M12 7.500h.01M17 10.500h.01M12 12c-3 0-5 2.500-5 4.800 0 1.600 1.300 2.200 2.500 2.200 1 0 1.500-.5 2.500-.5s1.500.5 2.500.5c1.200 0 2.500-.6 2.500-2.200C17 14.500 15 12 12 12z',
    star: 'M12 3.500l2.600 5.400 5.900.9-4.300 4.100 1 5.900L12 16.800l-5.200 2.800 1-5.900L3.500 9.800l5.900-.9z',
    book: 'M12 6.500C10.500 5 8 4.500 4 4.500v14c4 0 6.500.5 8 2 1.500-1.500 4-2 8-2v-14c-4 0-6.500.5-8 2zM12 6.500v14',
    camera: 'M4 8.500h3.500l2-3h5l2 3H20v11H4zM12 11a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
    music: 'M9 18V6l11-2.500v12M9 18a2.500 2.500 0 1 1-5 0 2.500 2.500 0 0 1 5 0zM20 15.500a2.500 2.500 0 1 1-5 0 2.500 2.500 0 0 1 5 0z',
    gear: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 3v3M12 18v3M3 12h3M18 12h3M5.600 5.600l2.100 2.100M16.300 16.300l2.100 2.100M18.400 5.600l-2.100 2.100M7.700 16.300l-2.100 2.100',
    plus: 'M12 5v14M5 12h14', x: 'M6 6l12 12M18 6L6 18', check: 'M5 12.500l4.500 4.500L19 7.500',
    trash: 'M5 7h14M9.500 7V4.500h5V7M7 7l1 13h8l1-13M10.500 11v5.500M13.500 11v5.500',
    flip: 'M12 3.500v17M9 7.500 3.500 16.500H9zM15 7.500l5.500 9H15z',
    copy: 'M9 9h10.500v10.500H9zM5 15H4.500V4.500H15V5',
    drop: 'M12 3.500c4 4.800 6 8 6 10.800a6 6 0 0 1-12 0c0-2.800 2-6 6-10.800z',
    up: 'M12 19.500v-15M6 10.500l6-6 6 6', down: 'M12 4.500v15M6 13.500l6 6 6-6',
    spark: 'M12 3.500l2.200 6.300 6.300 2.200-6.300 2.200L12 20.500l-2.200-6.300L3.500 12l6.300-2.200z',
    chat: 'M4 5h16v11H10l-5 4v-4H4z', pencil: 'M4.500 19.500l1-4.500L16.500 4l3.500 3.500L9 18.500zM14 6.500l3.500 3.500',
    door: 'M6.500 20.500V4h11v16.500M4 20.500h16M14 12.500h.01', tree: 'M12 20.500V13M12 3.500a5.800 5.800 0 0 1 5.300 8.200 4 4 0 0 1-1.800 6H8.500a4 4 0 0 1-1.800-6A5.800 5.800 0 0 1 12 3.500z',
    brush: 'M14.500 4 20 9.500 10.500 19l-6.500 1 1-6.500z', eraser: 'M8.500 20 3.500 15 13.500 5l7 7-8 8zM8.500 10l6 6',
    dice: 'M5 5h14v14H5zM9 9h.01M15 9h.01M12 12h.01M9 15h.01M15 15h.01', zoomin: 'M11 11m-7 0a7 7 0 1 0 14 0 7 7 0 1 0-14 0M11 8v6M8 11h6M16 16l4.500 4.500', zoomout: 'M11 11m-7 0a7 7 0 1 0 14 0 7 7 0 1 0-14 0M8 11h6M16 16l4.500 4.500',
    target: 'M12 12m-7 0a7 7 0 1 0 14 0 7 7 0 1 0-14 0M12 3v4M12 17v4M3 12h4M17 12h4', boot: 'M8 4h6v8l4.500 2.500c1 .6 1.500 1.500 1.500 2.500v2H8z M8 16h12',
    smile: 'M12 12m-8 0a8 8 0 1 0 16 0 8 8 0 1 0-16 0M8.500 10.500h.01M15.500 10.500h.01M8.500 14.500c1.800 2 5.200 2 7 0', swap: 'M4.500 8.500H19l-3.500-3.500M19.500 15.500H5l3.500 3.500',
    bigger: 'M4 10V4h6M20 14v6h-6M4 4l6.500 6.500M20 20l-6.500-6.500', smaller: 'M10 4v6H4M14 20v-6h6M10 10 3.500 3.500M14 14l6.500 6.500',
    sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2.500v2.500M12 19v2.500M2.500 12H5M19 12h2.500M5.300 5.300 7 7M17 17l1.700 1.700M18.700 5.300 17 7M7 17l-1.700 1.700',
    moon: 'M19.500 14.500A8 8 0 0 1 9.500 4.500a8 8 0 1 0 10 10z', rain: 'M7 15a4 4 0 0 1 0-8 5.500 5.500 0 0 1 10.300-1.300A4.500 4.500 0 0 1 17.500 15zM8.500 18l-1 2.500M12.500 18l-1 2.500M16.500 18l-1 2.500',
    snow: 'M7 14a4 4 0 0 1 0-8 5.500 5.500 0 0 1 10.300-1.300A4.500 4.500 0 0 1 17.500 14zM8 17.500h.01M12 19.500h.01M16 17.500h.01', petal: 'M12 12c-1-4 0-7 0-8 2 1 4 4 0 8zM12 12c4-1 7 0 8 0-1 2-4 4-8 0zM12 12c1 4 0 7 0 8-2-1-4-4 0-8zM12 12c-4 1-7 0-8 0 1-2 4-4 8 0z',
    mail: 'M3.500 6h17v12.500h-17zM3.500 6.500 12 13l8.500-6.500', mirror: 'M12 3.500a5.500 7 0 1 0 0 14 5.500 7 0 1 0 0-14zM12 17.500V21M8.500 21h7', help: 'M12 12m-8.500 0a8.500 8.500 0 1 0 17 0 8.500 8.500 0 1 0-17 0M9.500 9.500a2.500 2.500 0 1 1 3.700 2.200c-.8.4-1.200 1-1.200 1.800M12 16.800h.01',
  };
  const ic = (name) => {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24'); s.setAttribute('class', 'ic'); s.setAttribute('aria-hidden', 'true');
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', ICON[name] || ICON.star);
    s.append(p);
    return s;
  };
  const dprCanvas = (w, h2, cls) => {
    const k = Math.min(2, window.devicePixelRatio || 1);
    const c = h('canvas', { width: Math.round(w * k), height: Math.round(h2 * k), class: cls || null });
    c.style.width = w + 'px'; c.style.height = h2 + 'px';
    return c;
  };
  const click = (fn) => (ev) => { A.init(); A.sfx('click'); fn(ev); };

  // ---------- 提示 ----------
  UI.toast = function (text) {
    const t = h('div', { class: 'toast' }, text);
    $('toasts').append(t);
    while ($('toasts').children.length > 3) $('toasts').firstChild.remove();
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 400); }, 3200);
  };
  let closeCurrent = null;
  function openModal(o) {
    if (closeCurrent) closeCurrent();
    const wrap = h('div', { class: 'modal-wrap' });
    const close = () => { wrap.remove(); if (closeCurrent === close) closeCurrent = null; if (o.onClose) o.onClose(); };
    const box = h('section', { class: 'modal panel' + (o.wide ? ' wide' : ''), role: 'dialog', 'aria-label': o.title },
      h('header', { class: 'modal-head' }, h('h2', {}, o.title), h('button', { class: 'iconbtn', 'aria-label': '关闭', onclick: click(close) }, ic('x'))),
      h('div', { class: 'modal-body' }, o.body),
      o.foot ? h('footer', { class: 'modal-foot' }, o.foot) : null);
    wrap.addEventListener('pointerdown', (ev) => { if (ev.target === wrap) close(); });
    wrap.append(box);
    $('modals').append(wrap);
    closeCurrent = close;
    return close;
  }
  function confirmBox(title, text, okLabel, ok) {
    let close = null;
    close = openModal({
      title, body: h('p', { class: 'lead' }, text),
      foot: [h('button', { class: 'felt', onclick: click(() => close()) }, '再想想'), h('button', { class: 'felt primary', onclick: click(() => { close(); ok(); }) }, okLabel)],
    });
  }
  async function saveFile(name, data) {
    try {
      if (window.claude && window.claude.use) {
        const d = await window.claude.use('downloads');
        if (d) { await d.save({ filename: name, data }); UI.toast('已保存：' + name); return true; }
      }
    } catch (e) { if (e && e.code === 'declined') return false; }
    try {
      const blob = data instanceof Blob ? data : new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob), a = h('a', { href: url, download: name });
      document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      UI.toast('已保存：' + name);
      return true;
    } catch (e) { UI.toast('这里不能直接保存文件，请复制内容或右键图片保存'); return false; }
  }

  // ---------- 标题画面 ----------
  let titleOn = false;
  function titleLoop() {
    const cv = $('titleCv');
    if (!titleOn) return;
    const r = cv.getBoundingClientRect(), k = Math.min(2, window.devicePixelRatio || 1), Wd = r.width, Hd = r.height;
    if (cv.width !== Math.round(Wd * k)) { cv.width = Math.round(Wd * k); cv.height = Math.round(Hd * k); }
    const c = cv.getContext('2d'), t = performance.now() / 1000;
    c.setTransform(k, 0, 0, k, 0, 0);
    c.fillStyle = CT.lg(c, 0, 0, 0, Hd, ['#9fdcf0', '#d8f3f2', '#fff1e4']); c.fillRect(0, 0, Wd, Hd);
    const layer = (n, y, sp, sz, col) => {
      c.fillStyle = col;
      for (let i = 0; i < n; i++) {
        const w = sz * (0.8 + CT.hash(i, n, 3) * 0.6), x = ((t * sp + (i * (Wd + 400)) / n) % (Wd + 400)) - 200, yy = Hd * y + CT.hash(i, 2, n) * Hd * 0.12;
        CT.cloudShape(c, x, yy, w, w * 0.34, i + n); c.fill();
      }
    };
    layer(4, 0.16, 4, 240, 'rgba(255,255,255,0.65)');
    layer(4, 0.34, 7, 320, 'rgba(255,255,255,0.8)');
    // 花瓣
    c.fillStyle = '#ffc2d8';
    for (let i = 0; i < 22; i++) {
      const x = ((CT.hash(i, 1, 5) * Wd + t * 22 + Math.sin(t + i) * 22) % Wd), y = ((CT.hash(i, 2, 5) * Hd + t * (26 + (i % 4) * 8)) % Hd);
      CT.ell(c, x, y, 4.4, 2.8, t + i); c.fill();
    }
    // 云朵舞台
    const gy = Hd - Math.min(120, Hd * 0.16);
    c.fillStyle = '#ffffff';
    for (let i = 0; i < 12; i++) { const x = (i / 11) * Wd, rr = 70 + CT.hash(i, 1, 8) * 54; c.beginPath(); c.ellipse(x, Hd + 6, rr * 1.5, Hd - gy + rr * 0.3, 0, 0, 7); c.fill(); }
    const n = CT.PRESETS.length, sc = CT.clamp(Wd / (n * 150), 0.5, 1.25), gap = Math.min(150 * sc, (Wd - 40) / n);
    CT.PRESETS.forEach((p, i) => {
      const x = Wd / 2 + (i - (n - 1) / 2) * gap, q = t * 1.1 + i * 0.9, wave = (Math.floor(t / 2.4) % n) === i;
      c.fillStyle = 'rgba(120,90,110,0.13)'; c.beginPath(); c.ellipse(x, gy + 26 * sc, 34 * sc, 8 * sc, 0, 0, 7); c.fill();
      c.save(); c.translate(x, gy + 24 * sc + Math.sin(q) * 1.6); c.scale(sc, sc);
      CT.drawChar(c, p.look, { t: t + i, seed: i, arm: wave ? 'wave' : null, expr: wave ? 'happy' : 'normal', blink: Math.sin(t * 0.7 + i * 2) > 0.985 });
      c.restore();
    });
    requestAnimationFrame(titleLoop);
  }
  function showScreen(id) {
    ['title', 'select', 'creator'].forEach((s) => { $(s).hidden = s !== id; });
    const was = titleOn;
    titleOn = id === 'title';
    if (titleOn && !was) requestAnimationFrame(titleLoop);
  }
  UI.showTitle = function () {
    $('hud').hidden = true;
    G.scene = 'none';
    showScreen('title');
    const local = W.loadLocal();
    pendingSave = local;
    $('btnContinue').hidden = !local;
    if (cloudSave && (!local || (cloudSave.ts > (local.ts || 0)))) { try { pendingSave = W.deserialize(cloudSave.data); $('btnContinue').hidden = false; } catch (e) { /* 云端存档损坏就忽略 */ } }
  };
  let pendingSave = null, cloudSave = null;

  // ---------- 选角 ----------
  let customs = [], chosen = 'p_tao', selTimer = 0;
  function cardFor(c) {
    const cv = dprCanvas(118, 176);
    const card = h('button', { class: 'girl-card', 'data-id': c.id, onclick: click(() => { chosen = c.id; markChosen(); }) },
      h('span', { class: 'portrait' }, cv), h('strong', {}, c.name), h('em', {}, c.title || '小镇新朋友'), h('span', { class: 'bio' }, c.bio || ''), c.likes ? h('span', { class: 'likes' }, c.likes) : null);
    card._cv = cv; card._c = c;
    return card;
  }
  function markChosen() {
    document.querySelectorAll('.girl-card').forEach((n) => n.classList.toggle('on', n.dataset.id === chosen));
    const c = CT.PRESETS.concat(customs).find((x) => x.id === chosen);
    $('btnStart').textContent = '和' + (c ? c.name : '她') + '一起搬进小镇';
  }
  function renderSelect() {
    const g = $('girlGrid');
    g.textContent = '';
    CT.PRESETS.concat(customs).forEach((c) => g.append(cardFor(c)));
    g.append(h('button', { class: 'girl-card add', onclick: click(() => UI.openCreator(null, (ch) => { customs.push(ch); chosen = ch.id; showScreen('select'); renderSelect(); })) },
      h('span', { class: 'portrait' }, ic('plus')), h('strong', {}, '捏一个我的角色'), h('span', { class: 'bio' }, '发型、眼睛、衣服都由你来决定')));
    markChosen();
  }
  function selectLoop() {
    if ($('select').hidden) { selTimer = 0; return; }
    const t = performance.now() / 1000;
    document.querySelectorAll('.girl-card[data-id]').forEach((n, i) => {
      const on = n.classList.contains('on');
      CT.charThumb(n._cv, n._c.look, { st: { t: t + i, seed: i, arm: on ? 'wave' : null, expr: on ? 'happy' : 'normal', blink: Math.sin(t * 0.8 + i * 2) > 0.98 } });
    });
    selTimer = requestAnimationFrame(selectLoop);
  }
  UI.openSelect = function () { showScreen('select'); renderSelect(); if (!selTimer) selTimer = requestAnimationFrame(selectLoop); };

  // ---------- 捏人 ----------
  let draft = null, onDone = null, creatorTab = 'hair', exprPreview = 'normal', creating = false, thumbs = [];
  function swatches(list, get, set, custom) {
    const row = h('div', { class: 'swatches' });
    const paint = () => row.querySelectorAll('.sw').forEach((b) => b.classList.toggle('on', b.dataset.c === get()));
    list.forEach((c) => { const b = h('button', { class: 'sw', 'data-c': c, 'aria-label': '颜色 ' + c, onclick: () => { set(c); A.sfx('click'); paint(); refreshThumbs(); } }); b.style.background = c; row.append(b); });
    if (custom !== false) {
      const inp = h('input', { type: 'color', class: 'sw-custom', 'aria-label': '自选颜色', value: /^#[0-9a-f]{6}$/i.test(get()) ? get() : '#ffffff', oninput: (ev) => { set(ev.target.value); paint(); refreshThumbs(); } });
      row.append(h('label', { class: 'sw-wrap', title: '自选颜色' }, inp));
    }
    paint();
    return row;
  }
  function optButtons(key, list, mode) {
    const row = h('div', { class: 'opts' });
    const paint = () => row.querySelectorAll('.opt').forEach((b) => b.classList.toggle('on', b.dataset.v === draft.look[key]));
    list.forEach(([v, label]) => {
      const cv = dprCanvas(72, mode === 'full' ? 104 : 72);
      const b = h('button', { class: 'opt', 'data-v': v, onclick: () => { draft.look[key] = v; A.sfx('click'); paint(); refreshThumbs(); } }, cv, h('span', {}, label));
      thumbs.push({ cv, key, v, mode });
      row.append(b);
    });
    paint();
    return row;
  }
  function refreshThumbs() {
    for (const th of thumbs) {
      const L = Object.assign({}, draft.look, { [th.key]: th.v });
      CT.charThumb(th.cv, L, { mode: th.mode === 'full' ? 'full' : 'head', st: { t: 0.5 } });
    }
  }
  const field = (label, ...kids) => h('div', { class: 'field' }, h('h3', {}, label), ...kids);
  function renderCreatorTab() {
    const body = $('creatorBody'), L = draft.look;
    body.textContent = ''; thumbs = [];
    document.querySelectorAll('#creatorTabs button').forEach((b) => b.classList.toggle('on', b.dataset.t === creatorTab));
    if (creatorTab === 'hair') {
      body.append(field('后面的头发', optButtons('back', O.back)), field('刘海', optButtons('bangs', O.bangs)), field('发色', swatches(O.hairColors, () => L.hair, (c) => { L.hair = c; })));
    } else if (creatorTab === 'face') {
      body.append(field('眼睛', optButtons('eyes', O.eyes)), field('瞳色', swatches(O.eyeColors, () => L.eye, (c) => { L.eye = c; })), field('嘴巴', optButtons('mouth', O.mouth)),
        field('肤色', swatches(O.skin, () => L.skin, (c) => { L.skin = c; })),
        field('小细节', h('label', { class: 'check' }, h('input', { type: 'checkbox', id: 'optBlush', checked: L.blush, onchange: (ev) => { L.blush = ev.target.checked; refreshThumbs(); } }), '腮红'), h('label', { class: 'check' }, h('input', { type: 'checkbox', id: 'optGlasses', checked: L.glasses, onchange: (ev) => { L.glasses = ev.target.checked; refreshThumbs(); } }), '圆框眼镜')));
    } else if (creatorTab === 'cloth') {
      body.append(field('款式', optButtons('outfit', O.outfit, 'full')), field('主色', swatches(O.clothColors, () => L.c1, (c) => { L.c1 = c; })), field('配色', swatches(O.clothColors, () => L.c2, (c) => { L.c2 = c; })),
        field('袜子', optButtons('sock', O.sock, 'full')), field('袜子颜色', swatches(['#fffdf8', '#ffc8d8', '#a8d8ea', '#3e3a48', '#ffe9a8'], () => L.sockC, (c) => { L.sockC = c; })),
        field('鞋子颜色', swatches(['#a8606a', '#7a4a3a', '#4a3a3a', '#5a8ad0', '#e0884a', '#c0606e', '#fffdf8'], () => L.shoe, (c) => { L.shoe = c; })));
    } else if (creatorTab === 'acc') {
      body.append(field('头饰', optButtons('acc', O.acc)), field('头饰颜色', swatches(O.accColors, () => L.accC, (c) => { L.accC = c; })));
    } else {
      body.append(
        field('名字', h('input', { type: 'text', id: 'charName', maxlength: 8, value: draft.name, placeholder: '给她起个名字', oninput: (ev) => { draft.name = ev.target.value; } })),
        field('身份', h('input', { type: 'text', id: 'charTitle', maxlength: 10, value: draft.title, placeholder: '比如：小小发明家', oninput: (ev) => { draft.title = ev.target.value; } })),
        field('口头禅', h('input', { type: 'text', id: 'charPhrase', maxlength: 24, value: draft.phrase, placeholder: '她在小镇里常说的话', oninput: (ev) => { draft.phrase = ev.target.value; } })),
        field('关于她', h('textarea', { id: 'charBio', rows: 3, maxlength: 60, placeholder: '喜欢什么，有什么小梦想', oninput: (ev) => { draft.bio = ev.target.value; } }, draft.bio)));
    }
    refreshThumbs();
  }
  function creatorLoop() {
    if (!creating) return;
    const t = performance.now() / 1000, cv = $('creatorCv'), r = cv.getBoundingClientRect(), k = Math.min(2, window.devicePixelRatio || 1);
    if (r.width > 0 && cv.width !== Math.round(r.width * k)) { cv.width = Math.round(r.width * k); cv.height = Math.round(r.height * k); }
    CT.charThumb(cv, draft.look, { st: { t, expr: exprPreview, blink: Math.sin(t * 0.9) > 0.985, arm: exprPreview === 'happy' ? 'wave' : null } });
    requestAnimationFrame(creatorLoop);
  }
  UI.openCreator = function (c, done) {
    const fromGame = G.scene !== 'none';
    draft = c ? JSON.parse(JSON.stringify({ id: c.id, name: c.name, title: c.title || '', phrase: c.phrase || '', bio: c.bio || '', look: c.look }))
      : { id: 'c_' + CT.uid(), name: '', title: '', phrase: '', bio: '', look: CT.defaultLook() };
    onDone = (res) => { creating = false; $('creator').hidden = true; if (fromGame) { $('hud').hidden = false; } done(res); };
    creating = true; creatorTab = 'hair'; exprPreview = 'normal';
    $('creatorTitle').textContent = c ? '修改 ' + c.name : '捏一个新朋友';
    if (fromGame) { $('hud').hidden = true; $('creator').hidden = false; } else showScreen('creator');
    renderCreatorTab();
    requestAnimationFrame(creatorLoop);
  };
  function bindCreator() {
    document.querySelectorAll('#creatorTabs button').forEach((b) => b.addEventListener('click', click(() => { creatorTab = b.dataset.t; renderCreatorTab(); })));
    $('btnRandom').addEventListener('click', click(() => { draft.look = CT.randomLook(); A.sfx('sparkle'); renderCreatorTab(); }));
    $('btnExpr').addEventListener('click', click(() => { const a = ['normal', 'happy', 'shy', 'surprise', 'love', 'sleep']; exprPreview = a[(a.indexOf(exprPreview) + 1) % a.length]; }));
    $('btnCreatorCancel').addEventListener('click', click(() => {
      creating = false; $('creator').hidden = true;
      if (G.scene !== 'none') $('hud').hidden = false; else UI.openSelect();
    }));
    $('btnCreatorOk').addEventListener('click', click(() => {
      if (!draft.name.trim()) { creatorTab = 'name'; renderCreatorTab(); UI.toast('先给她起个名字吧'); const n = $('charName'); if (n) n.focus(); return; }
      A.sfx('sparkle');
      onDone({ id: draft.id, name: draft.name.trim(), title: draft.title.trim() || '小镇新朋友', phrase: draft.phrase.trim(), bio: draft.bio.trim(), look: draft.look });
    }));
  }

  // ---------- HUD ----------
  let drawerKind = null, furnCat = 'living', objCat = 'tree';
  function toolBtn(icon, label, on, fn, active) {
    return h('button', { class: 'tool' + (active ? ' on' : ''), title: label, onclick: click(fn) }, ic(icon), h('span', {}, label));
  }
  function setTools() {
    const box = $('tools');
    box.textContent = '';
    if (G.scene === 'room') {
      box.append(toolBtn('sofa', '家具', 0, () => toggleDrawer('furn'), drawerKind === 'furn'), toolBtn('palette', '墙和地', 0, () => toggleDrawer('style'), drawerKind === 'style'), toolBtn('girl', '人物', 0, () => toggleDrawer('people'), drawerKind === 'people'));
    } else if (G.scene === 'map') {
      const t = (k, icon, label, drawer) => toolBtn(icon, label, 0, () => { G.tool = k; G.mapGhost = null; G.select(null); if (drawer) openDrawer(drawer); else closeDrawer(); setTools(); }, G.tool === k);
      box.append(t('walk', 'boot', '漫步'), t('terrain', 'brush', '画地形', 'terrain'), t('object', 'tree', '摆放', 'objects'), t('erase', 'eraser', '橡皮'),
        toolBtn('girl', '人物', 0, () => toggleDrawer('people'), drawerKind === 'people'), toolBtn('dice', '小镇', 0, openTownMenu),
        toolBtn('zoomin', '放大', 0, () => G.zoom(1.2)), toolBtn('zoomout', '缩小', 0, () => G.zoom(0.83)), toolBtn('target', '找到我', 0, () => G.centerOnMain()));
    }
  }
  function toggleDrawer(k) { if (drawerKind === k) closeDrawer(); else openDrawer(k); }
  function closeDrawer() {
    drawerKind = null; $('drawer').hidden = true; G.setBottomInset(0); setTools();
  }
  function openDrawer(k) {
    drawerKind = k;
    const d = $('drawer'); d.hidden = false; d.textContent = '';
    if (k === 'furn') renderFurn();
    else if (k === 'style') renderStyle();
    else if (k === 'people') renderPeople();
    else if (k === 'terrain') renderTerrain();
    else if (k === 'objects') renderObjects();
    d.append(h('button', { class: 'iconbtn drawer-close', 'aria-label': '收起', onclick: click(() => { if (G.scene === 'map' && (k === 'terrain' || k === 'objects')) G.tool = 'walk'; closeDrawer(); }) }, ic('down')));
    if (G.scene === 'room') G.setBottomInset(d.getBoundingClientRect().height + 8); else G.setBottomInset(0);
    setTools();
  }
  function renderFurn() {
    const d = $('drawer');
    const tabs = h('div', { class: 'cat-tabs', role: 'tablist' });
    CT.FURN_CATS.forEach(([id, label]) => tabs.append(h('button', { class: furnCat === id ? 'on' : '', role: 'tab', onclick: click(() => { furnCat = id; openDrawer('furn'); }) }, label)));
    const grid = h('div', { class: 'item-grid' });
    if (furnCat === 'pet') {
      Object.keys(CT.PETS).forEach((k) => {
        const cv = dprCanvas(78, 62);
        CT.petThumb(cv, k);
        grid.append(h('button', { class: 'item-card', onclick: click(() => G.addPet(k)) }, cv, h('span', {}, CT.PETS[k].name)));
      });
    } else {
      Object.values(FURN).filter((f) => f.cat === furnCat).forEach((f) => {
        const cv = dprCanvas(78, 62);
        CT.furnThumb(cv, f.id);
        const b = h('button', { class: 'item-card' }, cv, h('span', {}, f.name));
        bindCardDrag(b, f.id);
        grid.append(b);
      });
    }
    d.append(tabs, grid);
  }
  function bindCardDrag(b, id) {
    let st = null;
    b.addEventListener('pointerdown', (ev) => { st = { x: ev.clientX, y: ev.clientY, drag: false, id: ev.pointerId }; });
    b.addEventListener('pointermove', (ev) => {
      if (!st) return;
      if (!st.drag && st.y - ev.clientY > 14) { st.drag = true; try { b.setPointerCapture(ev.pointerId); } catch (e) { /* 忽略 */ } A.sfx('pick'); }
      if (st.drag) { G.ghostAt(id, ev.clientX, ev.clientY); ev.preventDefault(); }
    });
    b.addEventListener('pointerup', () => {
      if (!st) return;
      const dragged = st.drag; st = null;
      if (dragged) G.ghostDrop(); else { A.init(); G.addItem(id); }
    });
    b.addEventListener('pointercancel', () => { st = null; G.ghost = null; });
  }
  function paintWallThumb(cv, wall) {
    const c = cv.getContext('2d'), s = cv.width / 170;
    c.setTransform(s, 0, 0, s, 0, 0);
    G.drawWallSample(c, wall, 170, 170 * (cv.height / cv.width));
    c.setTransform(1, 0, 0, 1, 0, 0);
  }
  function paintFloorThumb(cv, floor) {
    const c = cv.getContext('2d'), s = cv.width / 240;
    c.setTransform(s, 0, 0, s, 0, 0);
    G.drawFloorSample(c, floor, 240, 240 * (cv.height / cv.width));
    c.setTransform(1, 0, 0, 1, 0, 0);
  }
  function renderStyle() {
    const d = $('drawer'), r = G.room;
    const apply = () => { G.applyRoomStyle(); A.sfx('pop'); openDrawer('style'); };
    const wallRow = h('div', { class: 'item-grid tight' });
    W.WALLS.forEach(([p, label]) => {
      const cv = dprCanvas(58, 44);
      paintWallThumb(cv, { p, c1: r.wall.c1, c2: r.wall.c2 });
      wallRow.append(h('button', { class: 'item-card small' + (r.wall.p === p ? ' on' : ''), onclick: () => { r.wall.p = p; G.emit('wall'); apply(); } }, cv, h('span', {}, label)));
    });
    const wc = h('div', { class: 'swatches' });
    W.WALL_COLORS.forEach((pair) => {
      const b = h('button', { class: 'sw duo' + (r.wall.c1 === pair[0] ? ' on' : ''), 'aria-label': '墙纸配色', onclick: () => { r.wall.c1 = pair[0]; r.wall.c2 = pair[1]; G.emit('wall'); apply(); } });
      b.style.background = 'linear-gradient(135deg,' + pair[0] + ' 50%,' + pair[1] + ' 50%)';
      wc.append(b);
    });
    wc.append(h('label', { class: 'sw-wrap', title: '墙纸主色' }, h('input', { type: 'color', class: 'sw-custom', 'aria-label': '墙纸主色', value: r.wall.c1, onchange: (ev) => { r.wall.c1 = ev.target.value; r.wall.c2 = CT.shade(ev.target.value, -0.1); apply(); } })));
    const floorRow = h('div', { class: 'item-grid tight' });
    W.FLOORS.forEach(([p, label]) => {
      const cv = dprCanvas(58, 44);
      paintFloorThumb(cv, { p, c: r.floor.c });
      floorRow.append(h('button', { class: 'item-card small' + (r.floor.p === p ? ' on' : ''), onclick: () => { r.floor.p = p; apply(); } }, cv, h('span', {}, label)));
    });
    const fc = h('div', { class: 'swatches' });
    W.FLOOR_COLORS.forEach((c) => {
      const b = h('button', { class: 'sw' + (r.floor.c === c ? ' on' : ''), 'aria-label': '地板颜色', onclick: () => { r.floor.c = c; apply(); } });
      b.style.background = c; fc.append(b);
    });
    fc.append(h('label', { class: 'sw-wrap', title: '地板颜色' }, h('input', { type: 'color', class: 'sw-custom', 'aria-label': '地板颜色', value: r.floor.c, onchange: (ev) => { r.floor.c = ev.target.value; apply(); } })));
    d.append(h('div', { class: 'style-cols' },
      h('div', {}, h('h3', {}, '墙纸'), wallRow, wc),
      h('div', {}, h('h3', {}, '地板'), floorRow, fc,
        h('div', { class: 'row' },
          h('label', { class: 'check' }, h('input', { type: 'checkbox', id: 'optDado', checked: r.dado, onchange: (ev) => { r.dado = ev.target.checked; apply(); } }), '白色护墙板'),
          h('button', { class: 'felt small', onclick: click(() => { const pair = CT.pick(W.WALL_COLORS); r.wall = { p: CT.pick(W.WALLS)[0], c1: pair[0], c2: pair[1] }; r.floor = { p: CT.pick(W.FLOORS)[0], c: CT.pick(W.FLOOR_COLORS) }; G.emit('wall'); apply(); }) }, ic('dice'), '随机搭配')))));
  }
  function whereText(e) {
    if (e.loc.k === 'map') return '在小镇里散步';
    const hs = G.s.houses[e.loc.h];
    return hs ? '在' + hs.name : '在小镇里';
  }
  function renderPeople() {
    const d = $('drawer'), grid = h('div', { class: 'item-grid people' });
    grid.append(h('button', { class: 'item-card add', onclick: click(() => UI.openCreator(null, (c) => {
      const m = G.main();
      c.loc = Object.assign({}, m.loc); c.x = m.x + 70; c.y = m.y;
      G.addChar(c); G.log('小镇来了新朋友：' + c.name); UI.toast(c.name + '住进了小镇'); G.summon(c.id); if (drawerKind === 'people') openDrawer('people');
    })) }, ic('plus'), h('span', {}, '捏新朋友')));
    Object.values(G.ents).forEach((e) => {
      const cv = dprCanvas(62, 62);
      CT.charThumb(cv, e.c.look, { mode: 'head', st: { t: 0.5 } });
      const isMain = e.id === G.s.mainId;
      const here = (G.scene === 'map' ? e.loc.k === 'map' : e.loc.k === 'room' && e.loc.r === (G.room && G.room.id));
      grid.append(h('button', { class: 'item-card person' + (isMain ? ' on' : ''), title: whereText(e), onclick: click(() => {
        if (isMain) { UI.toast('这就是你呀'); return; }
        if (here) { G.select({ k: 'char', e }); return; }
        G.summon(e.id); openDrawer('people');
      }) }, cv, h('span', {}, e.c.name), h('small', {}, isMain ? '正在操控' : here ? '在身边' : '叫她过来')));
    });
    d.append(h('h3', { class: 'drawer-title' }, '小镇居民'), grid);
  }
  function renderTerrain() {
    const d = $('drawer'), grid = h('div', { class: 'item-grid' });
    CT.TERRAIN.forEach((t) => {
      const cv = dprCanvas(62, 50);
      CT.terrainThumb(cv, t.id);
      grid.append(h('button', { class: 'item-card' + (G.terrainId === t.id ? ' on' : ''), onclick: click(() => { G.terrainId = t.id; openDrawer('terrain'); }) }, cv, h('span', {}, t.name)));
    });
    const sizes = h('div', { class: 'row brush' }, h('h3', {}, '笔刷大小'));
    [[1, '小'], [2, '中'], [3, '大']].forEach(([n, l]) => sizes.append(h('button', { class: 'felt small' + (G.brush === n ? ' primary' : ''), onclick: click(() => { G.brush = n; openDrawer('terrain'); }) }, l)));
    d.append(sizes, grid);
  }
  function renderObjects() {
    const d = $('drawer');
    const tabs = h('div', { class: 'cat-tabs' });
    CT.MAP_CATS.forEach(([id, label]) => tabs.append(h('button', { class: objCat === id ? 'on' : '', onclick: click(() => { objCat = id; openDrawer('objects'); }) }, label)));
    const grid = h('div', { class: 'item-grid' });
    Object.values(OBJ).filter((o) => o.cat === objCat).forEach((o) => {
      const cv = dprCanvas(78, 62);
      CT.mapObjThumb(cv, o.id);
      grid.append(h('button', { class: 'item-card' + (G.placeType === o.id ? ' on' : ''), onclick: click(() => { G.placeType = o.id; openDrawer('objects'); UI.toast('点地图放下' + o.name + '，拖动可以挪位置'); }) }, cv, h('span', {}, o.name)));
    });
    d.append(tabs, grid);
  }
  function openTownMenu() {
    const close = openModal({
      title: G.s.townName,
      body: h('div', { class: 'stack' },
        field('小镇名字', h('input', { type: 'text', id: 'townName', maxlength: 10, value: G.s.townName, onchange: (ev) => { G.s.townName = ev.target.value.trim() || '云朵小镇'; G.markDirty(); UI.sceneChanged(); } })),
        h('button', { class: 'felt', onclick: click(() => { close(); confirmBox('重新生成小镇', '地形和树木会重新生成，所有房子和屋里的布置都会保留。', '生成新小镇', () => G.regenTown('random')); }) }, ic('dice'), '随机生成一座新小镇'),
        h('button', { class: 'felt', onclick: click(() => { close(); confirmBox('清空地图', '地形和装饰都会清空，只留下房子，方便你从头设计。', '清空', () => G.regenTown('clear')); }) }, ic('eraser'), '清空地图，自己从头画')),
    });
  }
  UI.confirmDeleteHouse = function (o) {
    const hs = G.s.houses[o.houseId];
    if (o.houseId === G.s.homeId) { UI.toast('这是你的家，不能拆掉哦'); return; }
    confirmBox('拆掉这座房子？', '「' + (hs ? hs.name : '房子') + '」和里面的布置都会消失，住在里面的人会搬到街上。', '拆掉', () => G.deleteObj(o));
  };
  UI.deleteObjSafe = function (o) { if (o.houseId) UI.confirmDeleteHouse(o); else G.deleteObj(o); };

  UI.sceneChanged = function () {
    drawerKind = null; $('drawer').hidden = true; G.setBottomInset(0);
    $('hud').hidden = false;
    const inRoom = G.scene === 'room', tabs = $('roomTabs');
    $('locName').textContent = inRoom ? G.house.name : G.s.townName;
    const btn = $('btnExit'); btn.textContent = '';
    btn.append(ic(inRoom ? 'door' : 'home'), h('span', {}, inRoom ? '出门' : '回家'));
    tabs.textContent = ''; tabs.hidden = !inRoom;
    if (inRoom) {
      G.house.rooms.forEach((r, i) => tabs.append(h('button', { class: r === G.room ? 'on' : '', onclick: click(() => { if (r !== G.room) G.switchRoom(i); else openRoomMenu(); }) }, r.name)));
      if (G.house.rooms.length < 6) tabs.append(h('button', { class: 'add', 'aria-label': '加一个房间', onclick: click(() => G.addRoom()) }, ic('plus')));
    }
    G.tool = 'walk';
    setTools();
    UI.refreshWishes();
  };
  function openRoomMenu() {
    let close = null;
    close = openModal({
      title: '这个房间',
      body: h('div', { class: 'stack' },
        field('房间名字', h('input', { type: 'text', id: 'roomName', maxlength: 6, value: G.room.name, onchange: (ev) => { G.room.name = ev.target.value.trim() || '房间'; G.markDirty(); UI.sceneChanged(); } })),
        field('这座房子的名字', h('input', { type: 'text', id: 'houseName', maxlength: 10, value: G.house.name, onchange: (ev) => { G.house.name = ev.target.value.trim() || '小屋'; G.markDirty(); UI.sceneChanged(); } })),
        G.house.rooms.length > 1 ? h('button', { class: 'felt', onclick: click(() => { close(); confirmBox('删除房间', '「' + G.room.name + '」里的家具会一起消失。', '删除房间', () => G.deleteRoom()); }) }, ic('trash'), '删除这个房间') : null),
    });
  }

  // ---------- 浮动工具条 ----------
  function ctxBtn(icon, label, fn, cls) {
    return h('button', { class: 'ctx' + (cls ? ' ' + cls : ''), title: label, 'aria-label': label, onclick: click(fn) }, ic(icon), h('span', {}, label));
  }
  function useLabel(d, it) {
    if (d.seats) return '坐下';
    if (d.beds) return '睡觉';
    if (d.tub) return '泡澡';
    if (d.toggle) return it.on ? '关掉' : '打开';
    return ({ read: '看书', piano: '弹琴', cook: '做饭', wash: '洗洗', dress: '换衣服', mirror: '照镜子', fridge: '吃点心', water: '浇水', paint: '画画', study: '学习', hug: '抱抱', gift: '拆开', look: '看看', stars: '看星星' })[d.use.act] || '使用';
  }
  function colorPop(colors, get, set) {
    const old = $('ctxPop');
    if (old) { old.remove(); return; }
    const pop = h('div', { id: 'ctxPop', class: 'panel pop' }, swatches(colors, get, (c) => { set(c); G.markDirty(); }));
    $('ctxbar').append(pop);
  }
  UI.onSelect = function (sel) {
    const bar = $('ctxbar');
    bar.textContent = '';
    if (!sel) { bar.hidden = true; return; }
    bar.hidden = false;
    const row = h('div', { class: 'ctx-row panel' });
    const add = (...b) => row.append(...b);
    if (sel.k === 'item') {
      const it = sel.it, d = FURN[it.type];
      add(h('strong', { class: 'ctx-name' }, d.name));
      if (d.seats || d.beds || d.tub || d.use || d.toggle) add(ctxBtn('spark', useLabel(d, it), () => { G.interact(G.main(), it); UI.onSelect(G.sel); }, 'go'));
      if (d.colors) add(ctxBtn('drop', '颜色', () => colorPop(d.colors, () => it.color, (c) => { it.color = c; })));
      if (d.variants) add(ctxBtn('swap', '换图案', () => { it.variant = ((it.variant || 0) + 1) % d.variants; G.markDirty(); }));
      add(ctxBtn('flip', '翻转', () => { it.flip = !it.flip; G.markDirty(); }));
      if (d.kind !== 'small') {
        add(ctxBtn('bigger', '放大', () => { it.scale = Math.min(1.5, (it.scale || 1) + 0.1); G.markDirty(); }), ctxBtn('smaller', '缩小', () => { it.scale = Math.max(0.6, (it.scale || 1) - 0.1); G.markDirty(); }));
      }
      if (d.kind === 'wall' || d.kind === 'rug') add(ctxBtn('up', '置顶', () => G.layerItem(it, 1)), ctxBtn('down', '置底', () => G.layerItem(it, -1)));
      add(ctxBtn('copy', '复制', () => G.copyItem(it)), ctxBtn('trash', '收起', () => G.deleteItem(it), 'danger'));
    } else if (sel.k === 'char') {
      const e = sel.e, isMain = e.id === G.s.mainId;
      add(h('strong', { class: 'ctx-name' }, e.c.name));
      if (!isMain) add(ctxBtn('swap', '换她操控', () => { G.setMain(e.id); UI.onSelect(G.sel); }, 'go'));
      add(ctxBtn('chat', '说说话', () => { G.say(e, G.chatter(e)); G.setExpr(e, 'happy'); }), ctxBtn('music', '跳舞', () => G.dance(e)), ctxBtn('smile', '挥挥手', () => G.wave(e)),
        ctxBtn('mirror', '改造型', () => UI.openCreator(e.c, (r) => { Object.assign(e.c, r); G.editCharDone(e); })));
      if (!e.c.preset && !isMain) add(ctxBtn('trash', '告别', () => confirmBox('和' + e.c.name + '告别？', '她会离开小镇，这个角色会被删除。', '告别', () => { G.removeChar(e.id); UI.toast(e.c.name + '离开了小镇'); }), 'danger'));
    } else if (sel.k === 'pet') {
      const p = sel.p;
      add(h('strong', { class: 'ctx-name' }, CT.PETS[p.kind].name));
      add(ctxBtn('paw', '摸摸', () => G.petPet(p), 'go'), ctxBtn('drop', '毛色', () => colorPop(CT.PETS[p.kind].colors, () => p.color, (c) => { p.color = c; })), ctxBtn('trash', '送走', () => G.removePet(p), 'danger'));
    } else if (sel.k === 'obj') {
      const o = sel.o, d = OBJ[o.type], hs = o.houseId ? G.s.houses[o.houseId] : null;
      add(h('strong', { class: 'ctx-name' }, hs ? hs.name : d.name));
      if (hs) add(ctxBtn('door', '进去看看', () => { const e = G.main(); G.select(null); G.tool = 'walk'; G.walkTo(e, o.x, o.y + 22, () => G.enterHouse(o.houseId)); setTools(); }, 'go'));
      if (hs) add(ctxBtn('pencil', '改名', () => openHouseName(hs)));
      if (d.text) add(ctxBtn('pencil', '写字', () => UI.openSign(o)));
      if (d.colors) add(ctxBtn('drop', '颜色', () => colorPop(d.colors, () => o.color, (c) => { o.color = c; })));
      add(ctxBtn('flip', '翻转', () => { o.flip = !o.flip; G.markDirty(); }), ctxBtn('trash', '移除', () => UI.deleteObjSafe(o), 'danger'));
    }
    bar.append(row);
  };
  function openHouseName(hs) {
    let close = null;
    close = openModal({ title: '给房子起名', body: field('名字', h('input', { type: 'text', id: 'hName', maxlength: 10, value: hs.name })), foot: [h('button', { class: 'felt primary', onclick: click(() => { hs.name = $('hName').value.trim() || hs.name; G.markDirty(); close(); }) }, '好了')] });
  }
  UI.openSign = function (o) {
    let close = null;
    close = openModal({ title: '小木牌', body: field('写点什么（最多 7 个字）', h('input', { type: 'text', id: 'signText', maxlength: 7, value: o.text || '' })), foot: [h('button', { class: 'felt primary', onclick: click(() => { o.text = $('signText').value; G.markDirty(); close(); }) }, '写好了')] });
  };
  UI.openMail = function () {
    const m = G.readMail();
    if (!m) { G.say(G.main(), '信箱空空的，明天再来看看'); return; }
    const c = G.s.chars[m.from];
    const cv = dprCanvas(84, 84);
    if (c) CT.charThumb(cv, c.look, { mode: 'head', st: { t: 0.5, expr: 'happy' } });
    A.sfx('sparkle');
    openModal({ title: '一封来信', body: h('div', { class: 'letter' }, cv, h('div', {}, h('p', {}, m.text), h('p', { class: 'sign' }, '—— ' + (c ? c.name : '朋友')), m.gift ? h('p', { class: 'note' }, '信里附了一份礼物，已经放到你家客厅啦。') : null)) });
  };

  // ---------- 小窗口 ----------
  UI.refreshWishes = function () {
    const n = $('wishCount');
    if (!n || !G.s || !G.s.wishes) return;
    const left = G.s.wishes.list.filter((w) => !w.done).length;
    n.textContent = left ? String(left) : '';
    n.hidden = !left;
  };
  function openWishes() {
    const list = h('ul', { class: 'wish-list' });
    G.s.wishes.list.forEach((w) => list.append(h('li', { class: w.done ? 'done' : '' }, ic(w.done ? 'check' : 'star'), h('span', {}, w.text), w.goal > 1 ? h('small', {}, Math.min(w.n, w.goal) + ' / ' + w.goal) : null)));
    const book = h('div', { class: 'sticker-book' });
    G.STICKERS.forEach((id) => {
      const got = G.s.stickers.indexOf(id) >= 0, cv = dprCanvas(54, 54);
      if (got) CT.furnThumb(cv, id);
      book.append(h('span', { class: 'sticker' + (got ? ' got' : ''), title: got ? FURN[id].name : '还没得到' }, cv));
    });
    openModal({ title: '今日小心愿', wide: false, body: [list, h('h3', {}, '贴纸册 ' + G.s.stickers.length + ' / ' + G.STICKERS.length), book] });
  }
  const fmtHour = (m) => { const hh = Math.floor(m / 60) % 24, mm = m % 60; return (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm; };
  function openDiary() {
    const box = h('div', { class: 'diary' });
    const days = {};
    G.s.diary.forEach((d) => { (days[d.d] = days[d.d] || []).push(d); });
    const keys = Object.keys(days).map(Number).sort((a, b) => b - a);
    if (!keys.length) box.append(h('p', { class: 'lead' }, '日记本还是空的。去拆礼物、串门、完成小心愿，这里会慢慢写满。'));
    keys.forEach((k) => {
      box.append(h('h3', {}, '第 ' + k + ' 天'));
      const ul = h('ul', {});
      days[k].slice().reverse().forEach((d) => ul.append(h('li', { class: d.m ? 'mine' : '' }, h('time', {}, fmtHour(d.h)), h('span', {}, d.t))));
      box.append(ul);
    });
    const ta = h('textarea', { id: 'diaryNote', rows: 2, maxlength: 120, placeholder: '写下今天的心情' });
    let close = null;
    close = openModal({ title: '小镇日记', body: [ta, h('div', { class: 'row end' }, h('button', { class: 'felt primary small', onclick: click(() => { const t = ta.value.trim(); if (!t) return; G.log(t, true); close(); openDiary(); }) }, '写进日记')), box] });
  }
  function openPhoto() {
    const cv = G.snapshot();
    const img = h('img', { src: cv.toDataURL('image/png'), alt: '刚拍下的照片' });
    let close = null;
    close = openModal({
      title: '咔嚓！', wide: true, body: [h('div', { class: 'photo' }, img)],
      foot: [h('button', { class: 'felt primary', onclick: click(() => cv.toBlob((b) => saveFile('云朵小镇-第' + G.s.day + '天.png', b), 'image/png')) }, ic('down'), '保存照片')],
    });
    G.log('拍下了一张照片');
  }
  function slider(id, label, min, max, step, val, fn) {
    return h('label', { class: 'slider', for: id }, h('span', {}, label), h('input', { type: 'range', id, min, max, step, value: val, oninput: (ev) => fn(parseFloat(ev.target.value)) }));
  }
  function openMusic() {
    const S = A.settings, tr = h('div', { class: 'seg' });
    [['auto', '随时间变化']].concat(Object.keys(A.TRACKS).map((k) => [k, A.TRACKS[k].name])).forEach(([k, l]) => tr.append(h('button', { class: S.track === k ? 'on' : '', onclick: click(() => { S.track = k; saveCfg(); A.autoPlay(G.s.hour); openMusic(); }) }, l)));
    openModal({
      title: '背景音乐', body: h('div', { class: 'stack' },
        h('p', { class: 'lead' }, '现在播放：' + (A.curName() || '准备中')),
        field('曲目', tr),
        h('label', { class: 'check' }, h('input', { type: 'checkbox', id: 'cfgMusic', checked: S.music, onchange: (ev) => { A.setMusic(ev.target.checked); saveCfg(); } }), '播放音乐'),
        slider('cfgVol', '音乐音量', 0, 1, 0.01, S.vol, (v) => { A.setVol(v); saveCfg(); }),
        h('label', { class: 'check' }, h('input', { type: 'checkbox', id: 'cfgSfx', checked: S.sfx, onchange: (ev) => { A.setSfx(ev.target.checked); saveCfg(); } }), '播放音效'),
        slider('cfgSfxVol', '音效音量', 0, 1, 0.01, S.sfxVol, (v) => { A.setSfxVol(v); saveCfg(); })),
    });
  }
  function openTime() {
    const s = G.s, wr = h('div', { class: 'seg' });
    [['auto', '自动', 'star'], ['sun', '晴天', 'sun'], ['rain', '下雨', 'rain'], ['snow', '下雪', 'snow'], ['petal', '花瓣雨', 'petal']].forEach(([k, l, i]) => {
      const on = k === 'auto' ? s.weatherAuto : !s.weatherAuto && s.weather === k;
      wr.append(h('button', { class: on ? 'on' : '', onclick: click(() => { if (k === 'auto') s.weatherAuto = true; else G.setWeather(k); G.markDirty(); openTime(); }) }, ic(i), l));
    });
    const hourLabel = h('strong', {}, fmtHour(Math.floor(s.hour * 60)));
    openModal({
      title: '时间和天气', body: h('div', { class: 'stack' },
        field('天气', wr),
        h('div', { class: 'field' }, h('h3', {}, '现在几点 ', hourLabel), h('input', { type: 'range', id: 'cfgHour', min: 0, max: 23.9, step: 0.1, value: s.hour, 'aria-label': '调整时间', oninput: (ev) => { s.hour = parseFloat(ev.target.value); hourLabel.textContent = fmtHour(Math.floor(s.hour * 60)); A.autoPlay(s.hour); } })),
        h('label', { class: 'check' }, h('input', { type: 'checkbox', id: 'cfgFlow', checked: s.timeFlow, onchange: (ev) => { s.timeFlow = ev.target.checked; G.markDirty(); } }), '时间自己走（12 分钟一天）')),
    });
  }
  function openSettings() {
    openModal({
      title: '设置和存档', body: h('div', { class: 'stack' },
        h('button', { class: 'felt', onclick: click(() => { UI.toast(G.save() ? '存好了' : '这个浏览器不能本地保存，请用下面的存档码'); }) }, ic('check'), '立即保存'),
        h('button', { class: 'felt', onclick: click(openExport) }, ic('copy'), '导出存档码'),
        h('button', { class: 'felt', onclick: click(openImport) }, ic('down'), '导入存档码'),
        h('button', { class: 'felt', onclick: click(openHelp) }, ic('help'), '怎么玩'),
        h('button', { class: 'felt', onclick: click(() => { G.save(); UI.showTitle(); closeCurrent && closeCurrent(); }) }, ic('home'), '回到标题画面'),
        h('button', { class: 'felt danger', onclick: click(() => confirmBox('重新开始', '现在的小镇和所有布置都会被清除，建议先导出存档码。', '清除并重新开始', () => { W.clearLocal(); W.Cloud.clear(); cloudSave = null; G.dirty = false; G.s = null; G.scene = 'none'; UI.showTitle(); })) }, ic('trash'), '清除存档重新开始')),
    });
  }
  function openExport() {
    G.save();
    const json = W.serialize(G.s), ta = h('textarea', { id: 'exportBox', rows: 8, readonly: true }, json);
    openModal({
      title: '导出存档码', body: [h('p', { class: 'lead' }, '把这段文字保存好，换浏览器或换电脑时粘贴回来就能继续玩。'), ta],
      foot: [
        h('button', { class: 'felt', onclick: click(() => saveFile('cloud-town-save.json', json)) }, ic('down'), '存成文件'),
        h('button', { class: 'felt primary', onclick: click(async () => { try { await navigator.clipboard.writeText(json); UI.toast('已复制'); } catch (e) { ta.focus(); ta.select(); UI.toast('请按 Ctrl+C 复制选中的文字'); } }) }, ic('copy'), '复制'),
      ],
    });
  }
  function openImport() {
    const ta = h('textarea', { id: 'importBox', rows: 8, placeholder: '把存档码粘贴到这里' });
    const file = h('input', { type: 'file', id: 'importFile', accept: '.json,application/json,text/plain', onchange: (ev) => { const f = ev.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { ta.value = String(r.result); }; r.readAsText(f); } });
    let close = null;
    close = openModal({
      title: '导入存档码', body: [ta, h('label', { class: 'field' }, h('h3', {}, '或者选择存档文件'), file)],
      foot: [h('button', { class: 'felt primary', onclick: click(() => {
        try { const s = W.deserialize(ta.value); close(); hideScreens(); G.start(s); G.save(); UI.toast('存档读取成功'); } catch (e) { UI.toast('这段存档码读不出来，请检查是否粘贴完整'); }
      }) }, '读取存档')],
    });
  }
  function openHelp() {
    const rows = [
      ['走路', '点地板或地面，也可以用方向键、WASD'],
      ['布置', '点左边的「家具」，点一下摆到房间里，也可以往上拖进房间。拖动家具换位置，点中后可以换颜色、翻转、缩放'],
      ['小摆件', '蛋糕、花瓶这些小物拖到桌子上就会放在桌面，挪桌子时会跟着走'],
      ['过家家', '双击家具，主角会走过去用它；把女孩直接拖到沙发、床、浴缸上也行。点中女孩可以让她跳舞、说话、改造型'],
      ['小镇', '点「出门」到地图。用「画地形」「摆放」「橡皮」改造地图，点房子就能走进去；「摆放」里还能盖新房子'],
      ['每一天', '12 分钟是一天。夜里灯会亮起来，主角睡觉时时间会快进到天亮。每天有新的小心愿和来信'],
    ];
    openModal({ title: '怎么玩', body: h('dl', { class: 'help' }, rows.map((r) => [h('dt', {}, r[0]), h('dd', {}, r[1])])) });
  }
  function hideScreens() { ['title', 'select', 'creator'].forEach((s) => { $(s).hidden = true; }); titleOn = false; }

  // ---------- 每帧 ----------
  let clockT = 0;
  UI.tick = function (dt) {
    clockT -= dt;
    if (clockT <= 0) {
      clockT = 0.5;
      const s = G.s, hh = s.hour;
      const part = hh < 5 ? '深夜' : hh < 9 ? '早晨' : hh < 12 ? '上午' : hh < 14 ? '中午' : hh < 18 ? '下午' : hh < 20 ? '傍晚' : '夜晚';
      $('clockText').textContent = '第 ' + s.day + ' 天 ' + part + ' ' + fmtHour(Math.floor(hh * 60));
      const name = s.weather === 'rain' ? 'rain' : s.weather === 'snow' ? 'snow' : s.weather === 'petal' ? 'petal' : hh >= 19 || hh < 6 ? 'moon' : 'sun';
      if (UI._clockIc !== name) { UI._clockIc = name; const b = $('clockIc'); b.textContent = ''; b.append(ic(name)); }
      $('mailDot').hidden = !s.mail;
    }
    const bar = $('ctxbar');
    if (!bar.hidden) {
      const a = G.selAnchor();
      if (!a) { bar.hidden = true; return; }
      const rw = bar.offsetWidth, rh = bar.offsetHeight, top = a.y - rh - 12 < 58 ? a.bottom + 12 : a.y - rh - 12;
      const x = CT.clamp(a.x - rw / 2, 8, G.W - rw - 8), y = CT.clamp(top, 58, G.H - rh - 8);
      bar.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(y) + 'px)';
    }
  };

  // ---------- 启动 ----------
  function bindHud() {
    document.querySelectorAll('[data-ic]').forEach((el) => el.prepend(ic(el.dataset.ic)));
    $('btnNew').addEventListener('click', () => {
      A.init(); A.play('afternoon'); A.sfx('click');
      if (W.loadLocal() || cloudSave) confirmBox('开始新的生活？', '开始后，旧存档会在你第一次保存时被覆盖。想保留的话，先点「继续」进入游戏导出存档码。', '开始', UI.openSelect);
      else UI.openSelect();
    });
    $('btnContinue').addEventListener('click', click(() => {
      if (!pendingSave) return;
      A.play('afternoon'); hideScreens();
      try { G.start(pendingSave); } catch (e) { UI.toast('存档读取失败：' + e.message); UI.showTitle(); }
    }));
    $('btnBack').addEventListener('click', click(UI.showTitle));
    $('btnStart').addEventListener('click', click(() => {
      const s = W.newGame(chosen, customs, $('townInput').value.trim() || '云朵小镇');
      hideScreens();
      G.start(s);
      G.log('搬进了' + s.townName + '，新生活开始啦');
      G.save();
      if (!CT.store.get('cloudtown_tips')) { CT.store.set('cloudtown_tips', 1); setTimeout(openHelp, 600); }
    }));
    $('btnExit').addEventListener('click', click(() => {
      if (G.scene === 'room') G.exitHouse();
      else {
        const o = G.s.map.objs.find((b) => b.houseId === G.s.homeId);
        if (o) { G.tool = 'walk'; setTools(); G.walkTo(G.main(), o.x, o.y + 22, () => G.enterHouse(o.houseId)); G.centerOnMain(); }
      }
    }));
    $('btnClock').addEventListener('click', click(openTime));
    $('btnWish').addEventListener('click', click(openWishes));
    $('btnDiary').addEventListener('click', click(openDiary));
    $('btnPhoto').addEventListener('click', click(openPhoto));
    $('btnMusic').addEventListener('click', click(openMusic));
    $('btnSettings').addEventListener('click', click(openSettings));
    $('btnMail').addEventListener('click', click(() => UI.openMail()));
    bindCreator();
  }
  function saveCfg() { CT.store.set('cloudtown_cfg', A.settings); }
  function loadFont() {
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&display=swap';
    document.head.append(l);
  }
  UI.boot = function () {
    loadFont();
    const cfg = CT.store.get('cloudtown_cfg');
    if (cfg) Object.assign(A.settings, cfg);
    bindHud();
    G.init($('game'));
    UI.showTitle();
    W.Cloud.init().then((c) => { if (c) { cloudSave = c; if (G.scene === 'none' && !$('title').hidden) UI.showTitle(); } });
  };
  window.addEventListener('DOMContentLoaded', UI.boot);
})(window.CT);
