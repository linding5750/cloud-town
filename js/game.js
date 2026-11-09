/* 云朵小镇 · 游戏主体：场景渲染、人物与宠物行为、布置与地图编辑的交互 */
'use strict';
(function (CT) {
  const G = (CT.G = {});
  const clamp = CT.clamp, lerp = CT.lerp, rand = CT.rand, pick = CT.pick, chance = CT.chance;
  const A = CT.Audio, W = CT.World, RM = CT.RM, T = CT.TILE, FURN = CT.FURN, OBJ = CT.MAPOBJ;
  const CH_SCALE = 1.0, MAP_SCALE = 0.42;
  const UI = () => CT.UI;

  Object.assign(G, {
    s: null, scene: 'none', house: null, room: null, t: 0, W: 1280, H: 720, dpr: 1, ents: {}, parts: [], sel: null, drag: null, hover: null,
    cam: { x: 0, y: 0, z: 1 }, view: { s: 1, ox: 0, oy: 0 }, tool: 'walk', terrainId: 1, brush: 1, placeType: null, ghost: null,
    terrainCv: null, terrainDirty: true, block: null, env: Object.assign({}, CT.DAY_ENV), keys: {}, bottomInset: 0, fade: 0, fadeDir: 0, fadeCb: null, dirty: false, saveT: 0, photoMode: false, speed: 1,
  });

  // ---------- 天色 ----------
  const SKY = [
    [0, '#1c2352', '#3a3f7c', '#6a6ea8', 1], [5, '#1c2352', '#3a3f7c', '#6a6ea8', 1], [6.5, '#7fa9e0', '#ffc9b0', '#e8c8d0', 0.3], [8, '#8fd3f4', '#dff5f4', '#ffffff', 0],
    [16.5, '#8fd3f4', '#e6f5ee', '#ffffff', 0], [18, '#6f7fc8', '#ffae8a', '#ffc8a8', 0.3], [19.5, '#2a2f66', '#5a4f90', '#8080b8', 0.85], [21, '#1c2352', '#3a3f7c', '#6a6ea8', 1], [24, '#1c2352', '#3a3f7c', '#6a6ea8', 1],
  ];
  function computeEnv() {
    const h = G.s ? G.s.hour : 10, e = G.env;
    let i = 0;
    while (i < SKY.length - 2 && h >= SKY[i + 1][0]) i++;
    const a = SKY[i], b = SKY[i + 1], u = Math.round(((h - a[0]) / (b[0] - a[0])) * 40) / 40;
    e.hour = h; e.skyTop = CT.mix(a[1], b[1], u); e.skyBot = CT.mix(a[2], b[2], u); e.ambient = CT.mix(a[3], b[3], u); e.night = lerp(a[4], b[4], u);
    e.t = G.t; e.weather = G.s ? G.s.weather : 'sun';
    e.hasMail = !!(G.s && G.s.mail);
    e.mainLook = G.s && G.s.chars[G.s.mainId] ? G.s.chars[G.s.mainId].look : null;
    if (e.weather === 'rain') { e.skyTop = CT.mix(e.skyTop, '#7f8ca8', 0.5); e.skyBot = CT.mix(e.skyBot, '#b8c4d4', 0.5); if (e.ambient === '#ffffff') e.ambient = '#e4e8f2'; }
  }

  // ---------- 启动与画布 ----------
  G.init = function (canvas) {
    G.canvas = canvas; G.ctx = canvas.getContext('2d');
    G.lm = document.createElement('canvas'); G.lmc = G.lm.getContext('2d');
    G.hit = document.createElement('canvas'); G.hit.width = 7; G.hit.height = 7;
    G.hc = G.hit.getContext('2d', { willReadFrequently: true });
    window.addEventListener('resize', G.resize);
    G.resize();
    bindInput();
    let last = performance.now();
    const loop = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (G.scene !== 'none') { update(dt); render(G.ctx, false); if (UI()) UI().tick(dt); }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  };
  G.tick = function (dt, skipRender) { update(dt); if (!skipRender) render(G.ctx, false); if (UI()) UI().tick(dt); };
  G.resize = function () {
    const r = G.canvas.getBoundingClientRect();
    G.W = Math.max(320, r.width || window.innerWidth); G.H = Math.max(240, r.height || window.innerHeight);
    G.dpr = Math.min(2, window.devicePixelRatio || 1);
    G.canvas.width = Math.round(G.W * G.dpr); G.canvas.height = Math.round(G.H * G.dpr);
    G.lm.width = Math.ceil(G.W / 2); G.lm.height = Math.ceil(G.H / 2);
    G.shellKey = null;
    updateView();
    if (G.scene === 'map') clampCam();
  };
  function updateView() {
    const top = 60, bottom = 10 + (G.bottomInset || 0), availH = Math.max(160, G.H - top - bottom);
    const s = Math.min((G.W - 12) / RM.W, availH / (RM.H + 24));
    G.view.s = s; G.view.ox = (G.W - RM.W * s) / 2; G.view.oy = top + (availH - (RM.H + 12) * s) / 2;
  }
  G.setBottomInset = function (px) { G.bottomInset = px; updateView(); G.shellKey = null; };

  // 开始或继续一局
  G.start = function (save) {
    G.s = save;
    G.ents = {};
    Object.values(save.chars).forEach(addEnt);
    if (!save.wishes) rollWishes();
    G.block = W.buildBlock(save.map);
    G.terrainDirty = true;
    computeEnv();
    A.autoPlay(save.hour);
    A.setRain(save.weather === 'rain');
    const m = G.main();
    if (m.loc.k === 'room' && save.houses[m.loc.h]) {
      const h = save.houses[m.loc.h], idx = Math.max(0, h.rooms.findIndex((r) => r.id === m.loc.r));
      G.showRoom(h, idx);
    } else G.showMap();
    UI().sceneChanged();
  };
  function addEnt(c) {
    G.ents[c.id] = {
      id: c.id, c, t: rand(0, 10), seed: rand(0, 6), x: c.x || 640, y: c.y || 600, loc: c.loc || { k: 'map' }, pose: 'stand', face: 0, back: false, wp: 0, blink: 0, blinkT: rand(1, 4),
      expr: 'normal', exprT: 0, arm: null, hold: null, hop: 0, kick: false, bubble: null, path: null, onArrive: null, act: null, aiT: rand(1, 5), drag: false, partT: 0,
    };
  }
  G.addChar = function (c) { G.s.chars[c.id] = c; addEnt(c); G.markDirty(); };
  G.main = () => G.ents[G.s.mainId];
  const inScene = (e) => (G.scene === 'map' ? e.loc.k === 'map' : e.loc.k === 'room' && G.house && e.loc.h === G.house.id && e.loc.r === G.room.id);
  G.sceneEnts = () => Object.values(G.ents).filter(inScene);
  G.markDirty = function () { G.dirty = true; };

  // ---------- 存档 ----------
  G.save = function () {
    if (!G.s) return false;
    Object.values(G.ents).forEach((e) => { e.c.x = e.x; e.c.y = e.y; e.c.loc = e.loc; });
    if (G.room) syncPets();
    const json = W.serialize(G.s), ok = W.saveLocal(json);
    W.Cloud.save(json, Date.now());
    G.dirty = false;
    return ok;
  };
  function syncPets() { (G.room.pets || []).forEach((p) => { if (p._rt) { p.x = p._rt.x; p.y = p._rt.y; } }); }

  // ---------- 粒子 ----------
  function fx(k, x, y, o) {
    if (G.parts.length > 260) return;
    const life = (o && o.life) || 1.6;
    G.parts.push(Object.assign({ k, x, y, vx: rand(-14, 14), vy: rand(-46, -24), life, max: life, s: 8, r: rand(0, 6) }, o || {}));
  }
  G.fx = fx;
  function burst(k, x, y, n, o) { for (let i = 0; i < n; i++) fx(k, x + rand(-24, 24), y + rand(-24, 24), Object.assign({ vx: rand(-60, 60), vy: rand(-90, -20) }, o || {})); }
  G.burst = burst;
  const CONFETTI = ['#ff8fb1', '#ffd35c', '#8fd8ff', '#9fdc8e', '#c9b8f0', '#ffb07a'];
  function drawParts(ctx) {
    for (const p of G.parts) {
      const a = Math.min(1, p.life / (p.max * 0.45));
      ctx.globalAlpha = a;
      switch (p.k) {
        case 'heart': CT.heartPath(ctx, p.x, p.y, p.s); CT.fs(ctx, p.c || '#ff7a9a', '#fff', 1.5); break;
        case 'note':
          ctx.fillStyle = p.c || '#a38cf0'; ctx.font = (p.s * 2.4) + 'px sans-serif'; ctx.textAlign = 'center';
          ctx.fillText(p.t || '♪', p.x, p.y); break;
        case 'z':
          ctx.fillStyle = '#8f9ce8'; ctx.font = 'bold ' + (p.s * 2.2) + 'px ' + CT.FONT; ctx.textAlign = 'center'; ctx.fillText('Z', p.x, p.y); break;
        case 'spark': CT.sparkle(ctx, p.x, p.y, p.s * (0.6 + 0.4 * Math.sin(p.life * 12)), p.c || '#ffe07a'); break;
        case 'bubble': CT.ell(ctx, p.x, p.y, p.s, p.s); CT.fs(ctx, 'rgba(255,255,255,0.35)', 'rgba(150,205,230,0.9)', 1.3); break;
        case 'steam': CT.ell(ctx, p.x, p.y, p.s, p.s); CT.fs(ctx, 'rgba(255,255,255,0.45)'); break;
        case 'confetti': ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r + p.life * 6); ctx.fillStyle = p.c; ctx.fillRect(-4, -3, 8, 6); ctx.restore(); break;
        case 'petal': CT.ell(ctx, p.x, p.y, 4, 2.7, p.r + p.life); CT.fs(ctx, p.c || '#ffb7ce'); break;
        case 'drop': CT.ell(ctx, p.x, p.y, 2.2, 3.4); CT.fs(ctx, '#7fcfee'); break;
        default: break;
      }
    }
    ctx.globalAlpha = 1;
  }

  // ---------- 说话 ----------
  const LINES = {
    idle: ['今天的云好软呀', '好想吃点甜的', '这里真舒服', '嘻嘻', '要不要一起玩？', '风的味道真好闻', '我最喜欢这个家了', '慢慢来就好', '啦啦啦', '今天也辛苦啦'],
    night: ['有点困了', '星星出来了', '晚安，小镇', '再待一会儿吧'], rain: ['下雨啦，听听雨声', '雨天适合看书', '窗外湿漉漉的'], hello: ['你好呀！', '今天过得好吗？', '见到你真开心', '一起走走吧？'],
    pet: ['好乖好乖', '毛茸茸的！', '你也喜欢这里吗？'],
  };
  G.say = function (e, text, sec) { e.bubble = { text, t: sec || 3.2 }; };
  function chatter(e) {
    const r = Math.random();
    if (r < 0.28 && e.c.phrase) return e.c.phrase;
    if (G.env.night > 0.6 && r < 0.6) return pick(LINES.night);
    if (G.s.weather === 'rain' && r < 0.6) return pick(LINES.rain);
    return pick(LINES.idle);
  }
  G.chatter = chatter;
  function setExpr(e, x, sec) { e.expr = x; e.exprT = sec || 2.4; }
  G.setExpr = setExpr;

  // ---------- 心愿、日记、来信 ----------
  const WISHES = [
    ['sleep', '在床上美美睡一觉', 1], ['sit', '坐下来歇一会儿', 1], ['cook', '做一道好吃的', 1], ['water', '给植物浇浇水', 1], ['piano', '弹一段钢琴', 1], ['bath', '泡一个泡泡浴', 1],
    ['place', '摆放 3 件新东西', 3], ['dress', '在衣柜前换身衣服', 1], ['photo', '拍一张照片', 1], ['invite', '把朋友请到身边', 1], ['pet', '摸摸小宠物', 1], ['plant', '在小镇种一棵树', 1],
    ['wall', '换一种墙纸', 1], ['dance', '跳一支舞', 1], ['paint', '在画架上画画', 1], ['visit', '去邻居家串门', 1], ['letter', '读一封朋友的来信', 1],
  ];
  G.WISHES = WISHES;
  function rollWishes() {
    const pool = WISHES.slice().sort(() => Math.random() - 0.5).slice(0, 3);
    G.s.wishes = { day: G.s.day, list: pool.map((w) => ({ id: w[0], text: w[1], goal: w[2], n: 0, done: false })) };
    if (UI()) UI().refreshWishes();
  }
  const STICKERS = ['cake', 'cupcake', 'teddy', 'bunnyPlush', 'duck', 'pudding', 'mug', 'teapot', 'vase', 'giftBox', 'candle', 'cookies', 'fruitBowl', 'globe', 'cactus', 'miniPlant', 'bookStack', 'balloons', 'flowerPot', 'recordPlayer', 'telescope', 'easel'];
  G.STICKERS = STICKERS;
  G.emit = function (name, n) {
    const w = G.s && G.s.wishes;
    if (!w) return;
    let changed = false;
    for (const it of w.list) {
      if (it.id !== name || it.done) continue;
      it.n += n || 1; changed = true;
      if (it.n >= it.goal) {
        it.done = true;
        const left = STICKERS.filter((x) => G.s.stickers.indexOf(x) < 0), st = left.length ? pick(left) : null;
        if (st) G.s.stickers.push(st);
        A.sfx('chime');
        UI().toast('心愿完成：' + it.text + (st ? '，得到一张新贴纸' : ''));
        G.log('完成了心愿「' + it.text + '」');
        if (w.list.every((x) => x.done)) {
          G.celebrate();
          UI().toast('今天的小心愿全部完成，真棒！');
        }
      }
    }
    if (changed) { UI().refreshWishes(); G.markDirty(); }
  };
  G.celebrate = function () {
    const e = G.main(), s = G.scene === 'map' ? 1 : RM.scale(e.y);
    for (let i = 0; i < 40; i++) fx('confetti', e.x + rand(-160, 160), e.y - rand(100, 300) * s, { c: pick(CONFETTI), vx: rand(-50, 50), vy: rand(10, 80), life: 2.4 });
  };
  G.log = function (text, mine) {
    const s = G.s;
    s.diary.push({ d: s.day, h: Math.floor(s.hour * 60), t: text, m: mine ? 1 : 0 });
    if (s.diary.length > 180) s.diary.splice(0, s.diary.length - 180);
    G.markDirty();
  };
  const LETTERS = [
    ['p_tao', '今天烤多了一盘草莓曲奇，给你留了最大的一块，记得来甜品屋拿哦。'], ['p_yue', '昨晚看到一颗流星，我替你许了个愿：愿你今天也有好心情。'],
    ['p_you', '花店的向日葵开了！路过的时候记得来看看，它们都朝着你笑呢。'], ['p_mo', '雨后的空气很适合读诗。我把喜欢的一句抄给你：慢慢走，别错过今天的云。'],
    ['p_tang', '我画了一张你家的小房子，等颜料干了就送给你。'], ['p_li', '猫咪们又把毛线团滚到门外了。天冷记得加衣服哦。'], ['p_xing', '我写了一首新歌，名字叫《云朵上的早安》，下次唱给你听！'],
  ];
  function newDay() {
    const s = G.s;
    s.day++;
    rollWishes();
    const others = LETTERS.filter((l) => l[0] !== s.mainId), l = pick(others);
    s.mail = { from: l[0], text: l[1], gift: chance(0.5) };
    if (s.weatherAuto) {
      const r = Math.random();
      G.setWeather(r < 0.55 ? 'sun' : r < 0.75 ? 'rain' : r < 0.9 ? 'petal' : 'snow', true);
    }
    UI().toast('第 ' + s.day + ' 天，早安！今天有新的小心愿和来信');
    G.markDirty();
  }
  G.setWeather = function (w, auto) {
    G.s.weather = w;
    if (!auto) G.s.weatherAuto = false;
    A.setRain(w === 'rain');
  };
  G.readMail = function () {
    const m = G.s.mail;
    if (!m) return null;
    G.s.mail = null;
    G.emit('letter');
    if (m.gift) {
      const h = G.s.houses[G.s.homeId], r = h.rooms[0];
      r.items.push(W.mkItem('giftBox', rand(420, 860), rand(560, 660), { color: pick(FURN.giftBox.colors) }));
    }
    const c = G.s.chars[m.from];
    G.log('收到了' + (c ? c.name : '朋友') + '的来信');
    G.markDirty();
    return m;
  };

  // ---------- 更新 ----------
  function update(dt) {
    G.t += dt;
    const s = G.s, main = G.main();
    let rate = s.timeFlow ? 1 : 0;
    const sleepingAtNight = main.act && main.act.type === 'sleep' && main.act.t > 1.5 && (s.hour >= 20 || s.hour < 6.5);
    if (sleepingAtNight) rate = 14;
    if (rate) {
      s.hour += (dt * rate * 24) / (12 * 60);
      if (s.hour >= 24) { s.hour -= 24; newDay(); }
      if (sleepingAtNight && s.hour >= 6.5 && s.hour < 7) { G.stop(main); G.say(main, '早安！睡得好香'); setExpr(main, 'happy', 3); }
      if (Math.floor(G.t) % 8 === 0 && Math.floor(G.t) !== G._lastTrack) { G._lastTrack = Math.floor(G.t); A.autoPlay(s.hour); }
    }
    computeEnv();
    for (const e of Object.values(G.ents)) if (inScene(e)) updEnt(e, dt);
    if (G.scene === 'room') updPets(dt);
    keyMove(dt);
    for (let i = G.parts.length - 1; i >= 0; i--) {
      const p = G.parts[i];
      p.life -= dt; if (p.life <= 0) { G.parts.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.k === 'confetti' || p.k === 'drop') p.vy += 120 * dt;
      if (p.k === 'petal') { p.x += Math.sin(p.life * 3 + p.r) * 16 * dt; }
    }
    if (G.scene === 'map') updMapFx(dt);
    if (G.fadeDir) {
      G.fade = clamp(G.fade + G.fadeDir * dt * 3.6, 0, 1);
      if (G.fade >= 1 && G.fadeDir > 0) { const cb = G.fadeCb; G.fadeCb = null; G.fadeDir = -1; if (cb) cb(); }
      else if (G.fade <= 0) G.fadeDir = 0;
    }
    G.saveT += dt;
    if (G.dirty && G.saveT > 12 && !G.drag) { G.saveT = 0; G.save(); }
  }
  function updEnt(e, dt) {
    e.t += dt;
    e.blinkT -= dt;
    if (e.blinkT < 0) { e.blink = 0.13; e.blinkT = rand(2, 5.4); }
    if (e.blink > 0) e.blink -= dt;
    if (e.exprT > 0) { e.exprT -= dt; if (e.exprT <= 0) e.expr = 'normal'; }
    if (e.bubble) { e.bubble.t -= dt; if (e.bubble.t <= 0) e.bubble = null; }
    if (e.drag) { e.pose = 'held'; e.back = false; return; }
    if (e.path && e.path.length) {
      const p = e.path[0], dx = p[0] - e.x, dy = p[1] - e.y, d = Math.hypot(dx, dy);
      const sp = G.scene === 'room' ? 210 * RM.scale(e.y) : 104;
      if (d <= sp * dt + 0.6) {
        e.x = p[0]; e.y = p[1]; e.path.shift();
        if (!e.path.length) { e.path = null; e.pose = 'stand'; e.back = false; e.face = 0; const cb = e.onArrive; e.onArrive = null; if (cb) cb(); }
      } else {
        e.x += (dx / d) * sp * dt; e.y += (dy / d) * sp * dt;
        e.pose = 'walk'; e.wp += dt * 10.5;
        e.face = Math.abs(dx) > d * 0.3 ? Math.sign(dx) : 0;
        e.back = dy < -Math.abs(dx) * 0.9;
      }
    }
    if (e.act) updAct(e, dt);
    else if (!e.path && e.id !== G.s.mainId) aiTick(e, dt);
  }
  function seatWorld(it, p) {
    const s = RM.scale(it.y) * (it.scale || 1);
    return [it.x + p[0] * s * (it.flip ? -1 : 1), it.y + p[1] * s];
  }
  function freeSlot(it, slots, type) {
    for (let i = 0; i < slots.length; i++) {
      const used = G.sceneEnts().some((e) => e.act && e.act.it === it && e.act.type === type && e.act.idx === i);
      if (!used) return i;
    }
    return -1;
  }
  function beginAct(e, a) {
    a.t = 0; a.dur = a.dur || Infinity; e.act = a; e.path = null; e.face = 0; e.back = false; e.arm = null; e.hold = null; e.kick = false; e.hop = 0;
  }
  G.stop = function (e) {
    const a = e.act;
    if (a) {
      if (a.it) {
        a.it.busy = false;
        if (a.type === 'sit' || a.type === 'sleep' || a.type === 'bath') {
          const f = RM.clampFloor(e.x, a.it.y + 18); e.x = f[0]; e.y = f[1];
        }
      }
      e.act = null;
    }
    e.pose = 'stand'; e.arm = null; e.hold = null; e.kick = false; e.hop = 0; e.back = false; e.face = 0;
  };
  G.walkTo = function (e, x, y, cb) {
    G.stop(e);
    if (G.scene === 'room') { const f = RM.clampFloor(x, y); e.path = [f]; }
    else {
      const p = G.findPath(e.x, e.y, x, y);
      if (!p) { G.say(e, '过不去呀'); return; }
      e.path = p;
    }
    e.onArrive = cb || null;
  };
  // 让人物使用某件家具
  G.interact = function (e, it) {
    const d = FURN[it.type];
    const go = (x, y, fn) => { const f = RM.clampFloor(x, y); G.walkTo(e, f[0], f[1], fn); };
    if (d.seats) {
      const i = freeSlot(it, d.seats, 'sit');
      if (i < 0) { G.say(e, '这里坐满啦'); return; }
      const p = seatWorld(it, d.seats[i]);
      go(p[0], it.y + 16, () => beginAct(e, { type: 'sit', it, idx: i, dur: e.id === G.s.mainId ? Infinity : rand(10, 24) }));
    } else if (d.beds) {
      const i = freeSlot(it, d.beds, 'sleep');
      if (i < 0) { G.say(e, '床上有人啦'); return; }
      const p = seatWorld(it, d.beds[i]);
      go(p[0], it.y + 16, () => beginAct(e, { type: 'sleep', it, idx: i, dur: e.id === G.s.mainId ? Infinity : rand(16, 34) }));
    } else if (d.tub) {
      if (freeSlot(it, [d.tub], 'bath') < 0) { G.say(e, '有人在泡澡'); return; }
      go(it.x, it.y + 16, () => { A.sfx('splash'); beginAct(e, { type: 'bath', it, idx: 0, dur: e.id === G.s.mainId ? Infinity : 12 }); });
    } else if (d.toggle && (!d.use || d.use.act === 'tv' || d.use.act === 'music')) {
      G.toggle(it);
      if (d.use && d.use.act === 'music' && it.on) G.sceneEnts().forEach((x) => { if (!x.act) G.dance(x); });
    } else if (d.use) {
      const s = RM.scale(it.y) * (it.scale || 1), u = d.use;
      go(it.x + (u.dx || 0) * s * (it.flip ? -1 : 1), it.y + (u.dy || 20) * s, () => startUse(e, it, u));
    } else {
      G.say(e, chatter(e));
    }
  };
  function startUse(e, it, u) {
    const durs = { read: 9, piano: 7, cook: 5, wash: 3.4, dress: 1.8, mirror: 3.4, fridge: 3.6, water: 3.2, paint: 5.4, study: 7, hug: 2, gift: 1.6, look: 3.4, stars: 4.5 };
    beginAct(e, { type: 'use', use: u.act, it, dur: durs[u.act] || 3 });
    e.back = !!u.back; e.arm = u.arm || null; e.hold = u.hold || null;
    if (u.act === 'cook') { it.busy = true; A.sfx('sizzle'); }
    if (u.act === 'dress') { e.back = false; A.sfx('magic'); }
    if (u.act === 'hug') { e.arm = 'heart'; setExpr(e, 'happy', 2); A.sfx('squeak'); }
    if (u.act === 'look') { setExpr(e, 'love', 3); }
    if (u.act === 'mirror') { setExpr(e, 'shy', 3); }
    if (u.act === 'stars') { G.say(e, G.env.night > 0.5 ? '哇，好多星星！' : '白天看不到星星呢'); }
  }
  function endUse(e, a) {
    const it = a.it, s = G.room ? G.room : null, bx = it.x, by = it.y;
    switch (a.use) {
      case 'cook': {
        const type = pick(CT.FOOD_POOL), f = RM.clampFloor(e.x + rand(-70, 70), e.y + rand(16, 50));
        s.items.push(W.mkItem(type, f[0], f[1]));
        burst('heart', f[0], f[1] - 30, 5); A.sfx('sparkle');
        G.say(e, '做好啦！' + FURN[type].name); G.emit('cook'); G.markDirty();
        G.log('做了一份' + FURN[type].name);
        break;
      }
      case 'dress': {
        const O = CT.CHAR_OPTS, L = e.c.look;
        L.outfit = pick(O.outfit)[0]; L.c1 = pick(O.clothColors); L.c2 = pick(O.clothColors);
        burst('spark', e.x, e.y - 100, 16, { c: '#ffe07a' }); G.say(e, '新衣服真好看！'); setExpr(e, 'happy');
        G.emit('dress'); G.markDirty();
        break;
      }
      case 'paint': it.variant = ((it.variant || 0) + 1) % 4; it.seed = CT.randi(1, 9999); G.say(e, '画好了！'); G.emit('paint'); G.markDirty(); break;
      case 'water': it.grow = Math.min(5, (it.grow || 0) + 1); burst('spark', bx, by - 90 * RM.scale(by), 8, { c: '#b8f0a0' }); G.emit('water'); G.markDirty(); break;
      case 'gift': {
        const type = pick(CT.GIFT_POOL), f = RM.clampFloor(bx, by), d = FURN[type];
        s.items.splice(s.items.indexOf(it), 1);
        s.items.push(W.mkItem(type, f[0], f[1], d.colors ? { color: pick(d.colors) } : {}));
        for (let i = 0; i < 26; i++) fx('confetti', bx + rand(-40, 40), by - 40, { c: pick(CONFETTI), vx: rand(-120, 120), vy: rand(-220, -60), life: 1.7 });
        A.sfx('chime'); G.say(e, '哇！是' + d.name + '！'); setExpr(e, 'happy'); G.markDirty(); G.log('拆开礼物，得到了' + d.name);
        if (G.sel && G.sel.it === it) G.select(null);
        break;
      }
      case 'read': G.say(e, '这本书真有意思'); break;
      case 'piano': G.emit('piano'); break;
      case 'fridge': G.say(e, '真好吃！'); setExpr(e, 'happy'); break;
      default: break;
    }
  }
  function updAct(e, dt) {
    const a = e.act;
    a.t += dt;
    e.partT -= dt;
    const pulse = () => { if (e.partT <= 0) { e.partT = 1; return true; } return false; };
    const head = () => [e.x, e.y - 180 * RM.scale(e.y)];
    if (a.type === 'sit' || a.type === 'sleep' || a.type === 'bath') {
      const d = FURN[a.it.type];
      if (!G.room.items.includes(a.it)) { e.act = null; G.stop(e); return; }
      const pts = a.type === 'sit' ? d.seats : a.type === 'sleep' ? d.beds : [d.tub];
      const p = seatWorld(a.it, pts[a.idx]);
      e.x = p[0]; e.y = p[1];
      e.back = false; e.face = 0;
      if (a.type === 'sit') {
        e.pose = 'sit'; e.kick = true;
        if (a.t > 1.6 && !a.done) { a.done = true; G.emit('sit'); }
      } else if (a.type === 'sleep') {
        e.pose = 'sleep';
        if (pulse()) { e.partT = 1.5; fx('z', e.x + 22, e.y - 26, { vx: 12, vy: -24, s: 9, life: 2 }); }
        if (a.t > 3 && !a.done) { a.done = true; G.emit('sleep'); G.log(e.c.name + '美美地睡了一觉'); }
      } else {
        e.pose = 'bath';
        if (pulse()) { e.partT = 0.45; const s = RM.scale(a.it.y); fx('bubble', e.x + rand(-80, 80) * s, e.y - rand(30, 70) * s, { s: rand(3, 8), vx: rand(-8, 8), vy: rand(-34, -18), life: 2.4 }); }
        if (a.t > 4 && !a.done) { a.done = true; G.emit('bath'); }
      }
    } else if (a.type === 'dance') {
      e.pose = 'stand';
      const q = Math.sin(a.t * 7);
      e.hop = -Math.abs(q) * 12; e.arm = q > 0 ? 'up' : 'wave'; e.face = Math.sin(a.t * 3.5);
      if (pulse()) { e.partT = 0.5; const h = head(); fx('note', h[0] + rand(-40, 40), h[1], { c: pick(CONFETTI), s: 7, t: pick(['♪', '♫']) }); }
      if (a.t > 2 && !a.done) { a.done = true; G.emit('dance'); }
    } else if (a.type === 'wave') {
      e.arm = 'wave'; e.pose = 'stand';
    } else if (a.type === 'use') {
      const it = a.it, s = RM.scale(it.y);
      switch (a.use) {
        case 'piano':
          if (pulse()) { e.partT = 0.32; A.pianoNote(); fx('note', it.x + rand(-80, 80) * s, it.y - 170 * s, { s: 7, t: pick(['♪', '♫', '♩']) }); }
          break;
        case 'cook':
          if (pulse()) { e.partT = 0.3; fx('steam', it.x + 34 * s, it.y - 176 * s, { s: rand(5, 10), vx: rand(-6, 6), vy: -36, life: 1.3 }); }
          if (a.t > 2.4 && !a.s2) { a.s2 = true; A.sfx('sizzle'); }
          break;
        case 'wash':
          if (pulse()) { e.partT = 0.25; A.sfx(chance(0.3) ? 'water' : ''); fx('bubble', it.x + rand(-30, 30) * s, it.y - 120 * s, { s: rand(3, 6), life: 1.4 }); }
          break;
        case 'water':
          if (pulse()) { e.partT = 0.14; fx('drop', e.x - 28, e.y - 96 * s, { vx: rand(-44, -20), vy: rand(-10, 30), life: 0.8 }); if (chance(0.25)) A.sfx('water'); }
          break;
        case 'paint':
          if (pulse()) { e.partT = 0.8; A.sfx('brush'); fx('spark', it.x + rand(-30, 30) * s, it.y - 130 * s, { c: pick(CONFETTI), s: 7 }); }
          break;
        case 'read':
          if (a.t > 1 && e.back) { e.back = false; e.hold = 'book'; e.arm = 'hold'; }
          break;
        case 'fridge':
          if (a.t > 1.2 && e.back) { e.back = false; e.hold = 'snack'; e.arm = 'hold'; setExpr(e, 'happy', 2.2); fx('heart', e.x, e.y - 190 * s, { s: 7 }); }
          break;
        case 'dress':
          e.face = Math.sin(a.t * 14); if (pulse()) { e.partT = 0.08; fx('spark', e.x + rand(-44, 44) * s, e.y - rand(20, 200) * s, { c: pick(CONFETTI), s: 9, life: 0.9 }); }
          break;
        case 'mirror': case 'look': case 'hug':
          if (pulse()) { e.partT = 0.5; fx('heart', e.x + rand(-30, 30) * s, e.y - 190 * s, { s: 6 }); }
          break;
        case 'stars':
          if (pulse()) { e.partT = 0.35; if (G.env.night > 0.5) fx('spark', it.x + rand(-60, 60) * s, it.y - 170 * s, { s: 8 }); }
          break;
        case 'gift': e.hop = -Math.abs(Math.sin(a.t * 8)) * 10; break;
        default: break;
      }
    }
    if (a.t >= a.dur) {
      const was = e.act;
      if (was.type === 'use') endUse(e, was);
      G.stop(e);
    }
  }
  G.dance = function (e) { G.stop(e); beginAct(e, { type: 'dance', dur: 7 }); };
  G.wave = function (e) { G.stop(e); beginAct(e, { type: 'wave', dur: 2 }); setExpr(e, 'happy', 2); };
  G.toggle = function (it) {
    it.on = !it.on; A.sfx('switch'); G.markDirty();
    if (FURN[it.type].id === 'recordPlayer' && it.on) A.sfx('sparkle');
  };
  function aiTick(e, dt) {
    e.aiT -= dt;
    if (e.aiT > 0) return;
    e.aiT = rand(4, 10);
    const r = Math.random();
    if (G.scene === 'map') {
      const main = G.main();
      if (main && Math.hypot(main.x - e.x, main.y - e.y) < 110 && r < 0.45) { G.say(e, pick(LINES.hello)); G.wave(e); return; }
      if (r < 0.7) {
        for (let i = 0; i < 6; i++) {
          const x = clamp(e.x + rand(-220, 220), 30, G.s.map.w * T - 30), y = clamp(e.y + rand(-170, 170), 30, G.s.map.h * T - 30);
          const p = G.findPath(e.x, e.y, x, y, true);
          if (p) { G.stop(e); e.path = p; return; }
        }
      } else if (r < 0.88) G.say(e, chatter(e));
      else G.wave(e);
      return;
    }
    const items = G.room.items, night = G.env.night > 0.7;
    const usable = items.filter((it) => { const d = FURN[it.type]; return d.seats || (d.tub && chance(0.2)) || (d.use && ['read', 'piano', 'look', 'mirror', 'water', 'paint', 'study'].indexOf(d.use.act) >= 0); });
    const beds = items.filter((it) => FURN[it.type].beds);
    if (night && beds.length && r < 0.6) { G.interact(e, pick(beds)); return; }
    if (r < 0.34) { const x = rand(RM.xl(600) + 60, RM.xr(600) - 60), y = rand(RM.BY1 + 40, RM.FY1 - 20); G.walkTo(e, x, y); }
    else if (r < 0.7 && usable.length) G.interact(e, pick(usable));
    else if (r < 0.9) G.say(e, chatter(e));
    else G.wave(e);
  }
  // 宠物
  function petRt(p) {
    if (!p._rt) Object.defineProperty(p, '_rt', { value: { x: p.x, y: p.y, tx: p.x, ty: p.y, pose: 'sit', t: rand(0, 9), timer: rand(1, 4), dir: 1, ph: 0, happy: 0, drag: false }, enumerable: false, writable: true });
    return p._rt;
  }
  function updPets(dt) {
    for (const p of G.room.pets || []) {
      const r = petRt(p);
      r.t += dt;
      if (r.happy > 0) r.happy -= dt;
      if (r.drag) continue;
      if (r.pose === 'walk') {
        const dx = r.tx - r.x, dy = r.ty - r.y, d = Math.hypot(dx, dy), sp = 96;
        if (d < 3) { r.pose = 'sit'; r.timer = rand(2, 6); }
        else { r.x += (dx / d) * sp * dt; r.y += (dy / d) * sp * dt; r.ph += dt * 11; if (Math.abs(dx) > 2) r.dir = Math.sign(dx); }
      } else {
        r.timer -= dt;
        if (r.timer <= 0) {
          const nest = G.room.items.find((i) => i.type === 'catBed');
          const main = G.main(), x = Math.random();
          if (nest && x < 0.3) { r.tx = nest.x; r.ty = nest.y - 8; r.pose = 'walk'; r.goSleep = true; }
          else if (x < 0.5 && G.main().loc.k === 'room' && inScene(main)) { const f = RM.clampFloor(main.x + rand(-90, 90), main.y + rand(-30, 30)); r.tx = f[0]; r.ty = f[1]; r.pose = 'walk'; }
          else if (x < 0.72 || G.env.night > 0.8) { r.pose = 'sleep'; r.timer = rand(7, 16); }
          else { const y = rand(RM.BY1 + 30, RM.FY1 - 20), xx = rand(RM.xl(y) + 40, RM.xr(y) - 40); r.tx = xx; r.ty = y; r.pose = 'walk'; }
        }
      }
    }
  }
  G.petPet = function (p) {
    const r = petRt(p), s = RM.scale(r.y);
    r.happy = 1.4; if (r.pose !== 'walk') r.pose = 'sit'; r.timer = 3;
    A.sfx(CT.PETS[p.kind].cry);
    burst('heart', r.x, r.y - 80 * s, 4, { s: 7 });
    G.emit('pet');
    const m = G.main();
    if (chance(0.3) && inScene(m)) G.say(m, pick(LINES.pet));
  };

  function keyMove(dt) {
    const k = G.keys;
    let dx = (k.ArrowRight || k.d ? 1 : 0) - (k.ArrowLeft || k.a ? 1 : 0), dy = (k.ArrowDown || k.s ? 1 : 0) - (k.ArrowUp || k.w ? 1 : 0);
    if (!dx && !dy) { if (G._keyWalking) { G._keyWalking = false; const e = G.main(); if (!e.path) { e.pose = 'stand'; e.back = false; e.face = 0; } } return; }
    const e = G.main();
    if (!inScene(e) || e.drag) return;
    if (e.act) G.stop(e);
    e.path = null; e.onArrive = null;
    G._keyWalking = true;
    const n = Math.hypot(dx, dy); dx /= n; dy /= n;
    const sp = G.scene === 'room' ? 240 * RM.scale(e.y) : 140;
    let nx = e.x + dx * sp * dt, ny = e.y + dy * sp * dt;
    if (G.scene === 'room') { const f = RM.clampFloor(nx, ny); nx = f[0]; ny = f[1]; }
    else {
      if (tileBlocked(nx, e.y)) nx = e.x;
      if (tileBlocked(nx, ny)) ny = e.y;
    }
    e.x = nx; e.y = ny; e.pose = 'walk'; e.wp += dt * 11; e.face = dx ? Math.sign(dx) : 0; e.back = dy < -0.6;
    if (G.scene === 'map') followCam(e, dt, 6);
  }

  // ---------- 场景切换 ----------
  function transition(cb) { G.fadeDir = 1; G.fade = Math.max(G.fade, 0.01); G.fadeCb = cb; A.sfx('door'); }
  G.showRoom = function (house, idx) {
    if (G.room) syncPets();
    G.scene = 'room'; G.house = house; G.room = house.rooms[idx]; G.parts = []; G.select(null); G.shellKey = null;
    const e = G.main();
    if (e.loc.k !== 'room' || e.loc.h !== house.id || e.loc.r !== G.room.id) { G.stop(e); e.path = null; e.loc = { k: 'room', h: house.id, r: G.room.id }; e.x = 640; e.y = 650; }
  };
  G.showMap = function () {
    if (G.room) syncPets();
    G.scene = 'map'; G.parts = []; G.select(null); G.room = null; G.house = null;
    const e = G.main();
    G.cam.z = clamp(Math.max(G.W / (G.s.map.w * T), 0.86), 0.5, 1.2);
    G.cam.x = e.x; G.cam.y = e.y;
    clampCam();
    buildMapFx();
  };
  G.enterHouse = function (hid) {
    const h = G.s.houses[hid];
    if (!h) return;
    transition(() => {
      G.showRoom(h, 0);
      UI().sceneChanged();
      G.save();
      if (h.owner !== G.s.mainId) {
        const c = G.s.chars[h.owner];
        if (c) { G.emit('visit'); G.log('去' + h.name + '串门'); }
      }
    });
  };
  G.exitHouse = function () {
    const hid = G.house.id, e = G.main();
    transition(() => {
      const o = G.s.map.objs.find((b) => b.houseId === hid);
      G.stop(e); e.path = null;
      e.loc = { k: 'map' };
      if (o) { e.x = o.x; e.y = o.y + 26; } else { e.x = 200; e.y = 200; }
      G.showMap();
      UI().sceneChanged();
    });
  };
  G.switchRoom = function (idx) {
    if (!G.house || !G.house.rooms[idx]) return;
    transition(() => { const e = G.main(); G.stop(e); e.path = null; e.loc = { k: 'room', h: G.house.id, r: G.house.rooms[idx].id }; e.x = 640; e.y = 650; G.showRoom(G.house, idx); UI().sceneChanged(); });
  };
  G.addRoom = function () {
    if (G.house.rooms.length >= 6) { UI().toast('一座房子最多 6 个房间'); return; }
    const r = W.mkRoom('新房间 ' + G.house.rooms.length);
    G.house.rooms.push(r);
    G.switchRoom(G.house.rooms.length - 1); G.markDirty();
  };
  G.deleteRoom = function () {
    const h = G.house;
    if (h.rooms.length < 2) { UI().toast('至少要留一个房间'); return; }
    const i = h.rooms.indexOf(G.room);
    Object.values(G.ents).forEach((e) => { if (e.loc.k === 'room' && e.loc.r === G.room.id && e.id !== G.s.mainId) { e.loc = { k: 'room', h: h.id, r: h.rooms[i === 0 ? 1 : 0].id }; } });
    const r = G.room;
    G.switchRoom(i === 0 ? 1 : 0);
    setTimeout(() => { h.rooms.splice(h.rooms.indexOf(r), 1); UI().sceneChanged(); G.markDirty(); }, 400);
  };
  G.summon = function (id) {
    const e = G.ents[id], m = G.main();
    if (!e || id === m.id) return;
    G.stop(e); e.path = null;
    e.loc = Object.assign({}, m.loc);
    if (G.scene === 'room') { const f = RM.clampFloor(m.x + rand(-160, 160), m.y + rand(-50, 40)); e.x = f[0]; e.y = f[1]; }
    else { const p = nearFree(m.x, m.y); e.x = p[0]; e.y = p[1]; }
    burst('spark', e.x, e.y - 60, 8);
    A.sfx('sparkle');
    G.say(e, pick(LINES.hello));
    setExpr(e, 'happy');
    G.emit('invite');
    G.markDirty();
  };
  G.setMain = function (id) {
    if (!G.ents[id]) return;
    const prev = G.main();
    const e = G.ents[id];
    if (!inScene(e)) G.summon(id);
    G.s.mainId = id;
    G.stop(e); e.path = null;
    if (prev && prev !== e) prev.aiT = 2;
    G.say(e, '轮到我啦！'); setExpr(e, 'happy');
    UI().sceneChanged(); G.markDirty();
  };
  G.removeChar = function (id) {
    if (id === G.s.mainId) return false;
    const e = G.ents[id];
    if (!e) return false;
    if (G.sel && G.sel.e === e) G.select(null);
    delete G.ents[id]; delete G.s.chars[id];
    G.markDirty();
    return true;
  };

  // ---------- 房间外壳（纹理缓存） ----------
  function wallPattern(c, p, c1, c2, w, h) {
    c.fillStyle = c1; c.fillRect(0, 0, w, h);
    c.fillStyle = c2; c.strokeStyle = c2;
    if (p === 'stripe') { for (let x = 0; x < w; x += 76) c.fillRect(x, 0, 38, h); }
    else if (p === 'dots') { let row = 0; for (let y = 20; y < h; y += 46) { for (let x = row % 2 ? 26 : 0; x < w; x += 52) { c.beginPath(); c.arc(x, y, 8, 0, 7); c.fill(); } row++; } }
    else if (p === 'flower') {
      let row = 0;
      for (let y = 30; y < h; y += 66) { for (let x = row % 2 ? 36 : 0; x < w; x += 72) { for (let i = 0; i < 5; i++) { const a = (i * 6.283) / 5; c.beginPath(); c.arc(x + Math.cos(a) * 8, y + Math.sin(a) * 8, 6.4, 0, 7); c.fill(); } } row++; }
      c.fillStyle = '#fffdf8'; row = 0;
      for (let y = 30; y < h; y += 66) { for (let x = row % 2 ? 36 : 0; x < w; x += 72) { c.beginPath(); c.arc(x, y, 3.8, 0, 7); c.fill(); } row++; }
    } else if (p === 'heart') { let row = 0; for (let y = 34; y < h; y += 62) { for (let x = row % 2 ? 36 : 0; x < w; x += 72) { CT.heartPath(c, x, y, 11); c.fill(); } row++; } }
    else if (p === 'star') { let row = 0; for (let y = 34; y < h; y += 62) { for (let x = row % 2 ? 40 : 0; x < w; x += 80) { CT.starPath(c, x, y, 13, 6, 5, row * 0.3); c.fill(); } row++; } }
    else if (p === 'check') {
      c.globalAlpha = 0.65;
      for (let x = 0; x < w; x += 96) c.fillRect(x, 0, 48, h);
      for (let y = 0; y < h; y += 96) c.fillRect(0, y, w, 48);
      c.globalAlpha = 1;
    } else if (p === 'wood') { c.lineWidth = 3; for (let x = 0; x < w; x += 72) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } }
    else if (p === 'brick') {
      c.lineWidth = 3; let row = 0;
      for (let y = 0; y < h; y += 36) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); for (let x = row % 2 ? 44 : 0; x < w; x += 88) { c.moveTo(x, y); c.lineTo(x, y + 36); } c.stroke(); row++; }
    } else if (p === 'cloud') { let row = 0; for (let y = 60; y < h; y += 90) { for (let x = row % 2 ? 80 : 0; x < w; x += 160) { CT.cloudShape(c, x, y, 92, 30, 5); c.fill(); } row++; } }
  }
  G.drawWallSample = (c, wall, w, h) => wallPattern(c, wall.p, wall.c1, wall.c2, w, h);
  G.drawFloorSample = (c, floor, w, h) => floorPattern(c, floor.p, floor.c, w, h);
  function floorPattern(c, p, col, w, h) {
    const d = CT.shade(col, -0.13), l = CT.shade(col, 0.2);
    c.fillStyle = col; c.fillRect(0, 0, w, h);
    if (p === 'wood') {
      const pw = 80, ph = 120;
      for (let i = 0; i < w / pw; i++) {
        const off = (i % 3) * 44;
        for (let j = -1; j < h / ph + 1; j++) {
          c.fillStyle = CT.mix(CT.mix(col, d, CT.hash(i, j, 3)), l, CT.hash(i, j, 4) * 0.35);
          c.fillRect(i * pw, j * ph + off, pw, ph);
          c.fillStyle = CT.rgba(d, 0.8); c.fillRect(i * pw, j * ph + off, pw, 3);
        }
        c.fillStyle = CT.rgba(CT.shade(col, -0.28), 0.8); c.fillRect(i * pw, 0, 3, h);
      }
    } else if (p === 'parquet') {
      const s = 54;
      for (let y = -s; y < h + s; y += s) {
        for (let x = -s * 2; x < w + s * 2; x += s) {
          c.save(); c.translate(x + ((y / s) % 2 ? s / 2 : 0), y); c.rotate(((Math.floor(x / s) + Math.floor(y / s)) % 2 ? 1 : -1) * 0.785);
          c.fillStyle = CT.mix(col, d, CT.hash(x, y, 2)); c.fillRect(-s * 0.74, -s * 0.2, s * 1.48, s * 0.4);
          c.strokeStyle = CT.rgba(CT.shade(col, -0.3), 0.6); c.lineWidth = 1.6; c.strokeRect(-s * 0.74, -s * 0.2, s * 1.48, s * 0.4);
          c.restore();
        }
      }
    } else if (p === 'tile' || p === 'check') {
      const s = 100;
      for (let j = 0; j < h / s; j++) {
        for (let i = 0; i < w / s; i++) {
          const alt = (i + j) % 2;
          c.fillStyle = p === 'check' ? (alt ? col : CT.shade(col, 0.62)) : CT.mix(col, l, CT.hash(i, j, 3) * 0.5);
          c.fillRect(i * s, j * s, s, s);
          c.strokeStyle = p === 'check' ? 'rgba(255,255,255,0)' : CT.rgba(d, 0.9); c.lineWidth = 4; c.strokeRect(i * s, j * s, s, s);
        }
      }
    } else if (p === 'carpet') {
      for (let i = 0; i < 3800; i++) { c.fillStyle = CT.hash(i, 1, 2) < 0.5 ? CT.rgba(d, 0.2) : CT.rgba(l, 0.28); c.fillRect(CT.hash(i, 3, 2) * w, CT.hash(i, 4, 2) * h, 4, 2.4); }
    }
  }
  function makeShell(room) {
    const k = Math.min(2.4, G.view.s * G.dpr), key = JSON.stringify([room.id, room.wall, room.floor, room.dado, k]);
    if (G.shellKey === key) return;
    G.shellKey = key;
    const cv = G.shell || (G.shell = document.createElement('canvas'));
    cv.width = Math.ceil(RM.W * k); cv.height = Math.ceil(RM.H * k);
    const c = cv.getContext('2d');
    const TW = 1200, TH = 423, wt = document.createElement('canvas'), ft = document.createElement('canvas');
    const q = Math.min(1.6, k * 1.2);
    wt.width = TW * q; wt.height = TH * q; ft.width = TW * q; ft.height = 480 * q;
    const wc = wt.getContext('2d'), fc = ft.getContext('2d');
    wc.scale(q, q); fc.scale(q, q);
    wallPattern(wc, room.wall.p, room.wall.c1, room.wall.c2, TW, TH);
    if (room.dado) {
      const yy = TH - 130;
      wc.fillStyle = '#fffaf2'; wc.fillRect(0, yy, TW, 130);
      wc.strokeStyle = '#e6d8c8'; wc.lineWidth = 3;
      for (let x = 12; x < TW; x += 120) { wc.strokeRect(x, yy + 18, 96, 86); }
      wc.fillStyle = '#efe2d2'; wc.fillRect(0, yy - 7, TW, 10);
    }
    wc.fillStyle = lgSafe(wc, 0, 0, 0, TH, ['rgba(255,255,255,0.14)', 'rgba(255,255,255,0)', 'rgba(90,52,72,0.07)']); wc.fillRect(0, 0, TW, TH);
    wc.fillStyle = '#fffaf2'; wc.fillRect(0, TH - 24, TW, 24);
    wc.fillStyle = '#e9dccb'; wc.fillRect(0, TH - 26, TW, 3);
    floorPattern(fc, room.floor.p, room.floor.c, TW, 480);
    c.clearRect(0, 0, cv.width, cv.height);
    c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    // 地板：逐行投影出透视
    const zb = 1 / RM.scale(RM.BY1), rows = Math.ceil((RM.FY1 - RM.BY1) * k);
    for (let i = 0; i < rows; i++) {
      const y = RM.BY1 + i / k, s = RM.scale(y), z = 1 / s, s2 = RM.scale(y + 1 / k);
      const v = (zb - z) / (zb - 1), v2 = (zb - 1 / s2) / (zb - 1);
      const sy = v * ft.height, sh = Math.max(1, (v2 - v) * ft.height);
      const xl = RM.xl(y), xr = RM.xr(y);
      c.drawImage(ft, 0, sy, ft.width, sh, xl * k, y * k, (xr - xl) * k, 1.6);
    }
    // 后墙
    c.drawImage(wt, 0, 0, wt.width, wt.height, RM.BX0 * k, RM.BY0 * k, (RM.BX1 - RM.BX0) * k, (RM.BY1 - RM.BY0) * k);
    // 两侧墙：逐列投影
    const topAt = (x) => 70 + (200 - x) * 1.2955, botAt = (x) => 380 + (200 - x) * 2;
    const cols = Math.ceil(160 * k);
    for (let i = 0; i < cols; i++) {
      const x = 40 + i / k, z = 600 / (640 - x), z2 = 600 / (640 - (x + 1 / k));
      const d = ((zb - z) / (zb - 1)) * 480, d2 = ((zb - z2) / (zb - 1)) * 480;
      const sx = (Math.min(d, d2) / TW) * wt.width, sw = Math.max(1, (Math.abs(d - d2) / TW) * wt.width);
      const t = topAt(x), b = botAt(x);
      c.drawImage(wt, sx, 0, sw, wt.height, x * k, t * k, 1.6, (b - t) * k);
      c.drawImage(wt, sx, 0, sw, wt.height, (RM.W - x) * k - 1.6, t * k, 1.6, (b - t) * k);
    }
    c.setTransform(k, 0, 0, k, 0, 0);
    // 暗部
    const shade = (pts, stops, x0, x1) => { c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.closePath(); c.fillStyle = lgSafe(c, x0, 0, x1, 0, stops); c.fill(); };
    shade([40, 277.3, 200, 70, 200, 380, 40, 700], ['rgba(90,52,72,0.05)', 'rgba(90,52,72,0.17)'], 40, 200);
    shade([1240, 277.3, 1080, 70, 1080, 380, 1240, 700], ['rgba(90,52,72,0.05)', 'rgba(90,52,72,0.17)'], 1240, 1080);
    c.fillStyle = lgSafe(c, 0, 380, 0, 440, ['rgba(70,40,60,0.2)', 'rgba(70,40,60,0)']);
    c.beginPath(); c.moveTo(200, 380); c.lineTo(1080, 380); c.lineTo(1110, 440); c.lineTo(170, 440); c.closePath(); c.fill();
    c.fillStyle = lgSafe(c, 0, 620, 0, 700, ['rgba(255,255,255,0)', 'rgba(255,255,255,0.12)']);
    c.fillRect(40, 620, 1200, 80);
    // 墙的切面与地台
    c.lineJoin = 'round'; c.lineCap = 'round';
    c.beginPath(); c.moveTo(34, 700); c.lineTo(34, 275); c.lineTo(200, 62); c.lineTo(1080, 62); c.lineTo(1246, 275); c.lineTo(1246, 700);
    c.strokeStyle = '#c9b3b0'; c.lineWidth = 17; c.stroke();
    c.strokeStyle = '#fffaf2'; c.lineWidth = 13; c.stroke();
    c.beginPath(); c.moveTo(200, 70); c.lineTo(200, 380); c.lineTo(40, 700); c.moveTo(1080, 70); c.lineTo(1080, 380); c.lineTo(1240, 700);
    c.strokeStyle = 'rgba(120,80,90,0.28)'; c.lineWidth = 2; c.stroke();
    CT.rr(c, 24, 698, 1232, 20, 8); CT.fs(c, '#e8bf94', '#b98352', 2.4);
    c.setTransform(1, 0, 0, 1, 0, 0);
  }
  function lgSafe(c, x0, y0, x1, y1, stops) { return CT.lg(c, x0, y0, x1, y1, stops); }

  // ---------- 天空背景 ----------
  function drawSkyBg(ctx) {
    const e = G.env, W_ = G.W, H_ = G.H;
    ctx.setTransform(G.dpr, 0, 0, G.dpr, 0, 0);
    ctx.fillStyle = CT.lg(ctx, 0, 0, 0, H_, [e.skyTop, e.skyBot]);
    ctx.fillRect(0, 0, W_, H_);
    if (e.night > 0.3) {
      ctx.fillStyle = 'rgba(255,255,240,' + e.night * 0.9 + ')';
      for (let i = 0; i < 60; i++) {
        const r = 0.7 + Math.abs(Math.sin(G.t * 0.9 + i)) * 1.1;
        ctx.beginPath(); ctx.arc(CT.hash(i, 1, 7) * W_, CT.hash(i, 2, 7) * H_ * 0.9, r, 0, 7); ctx.fill();
      }
    }
    const a = 0.7 - e.night * 0.5;
    ctx.fillStyle = 'rgba(255,255,255,' + a + ')';
    for (let i = 0; i < 6; i++) {
      const w = 190 + i * 34, x = ((G.t * (5 + i * 1.5) + i * 300) % (W_ + 400)) - 200, y = H_ * (0.12 + i * 0.13);
      CT.cloudShape(ctx, x, y, w, w * 0.32, i + 2); ctx.fill();
    }
  }

  // ---------- 房间渲染 ----------
  function itemScale(it, d) { return (d.kind === 'wall' ? RM.BACK : RM.scale(it.y)) * (it.scale || 1); }
  function drawItemPart(ctx, it, d, pass) {
    const s = itemScale(it, d);
    ctx.save();
    ctx.translate(it.x, it.y - (it.elev || 0));
    if (d.kind === 'rug') ctx.scale(it.flip ? -s : s, s * 0.62); else ctx.scale(it.flip ? -s : s, s);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    d[pass](ctx, it, G.t, G.env);
    ctx.restore();
  }
  function entState(e) {
    return { t: e.t, pose: e.pose, walkPhase: e.wp, face: e.face, back: e.back, blink: e.blink > 0, expr: e.expr, arm: e.arm, hold: e.hold, hop: e.hop, kick: e.kick, seed: e.seed };
  }
  function drawEntRoom(ctx, e) {
    const sc = e.act && e.act.it ? RM.scale(e.act.it.y) : RM.scale(e.y);
    ctx.save(); ctx.translate(e.x, e.y); const s = sc * CH_SCALE; ctx.scale(s, s);
    CT.drawChar(ctx, e.c.look, entState(e));
    ctx.restore();
  }
  function drawPetRoom(ctx, p) {
    const r = petRt(p), s = RM.scale(r.y) * 0.92;
    ctx.save(); ctx.translate(r.x, r.y); ctx.scale(s, s);
    CT.drawPet(ctx, p.kind, p.color, { t: r.t, pose: r.pose, dir: r.dir, happy: r.happy > 0, phase: r.ph });
    ctx.restore();
  }
  function renderRoom(ctx, photo) {
    const room = G.room, v = G.view, env = G.env;
    drawSkyBg(ctx);
    const m = (t) => ctx.setTransform(v.s * G.dpr, 0, 0, v.s * G.dpr, v.ox * G.dpr, v.oy * G.dpr);
    m();
    // 地台下的云
    ctx.fillStyle = 'rgba(120,90,110,0.13)';
    ctx.beginPath(); ctx.ellipse(640, 742, 640, 34, 0, 0, 7); ctx.fill();
    for (let i = 0; i < 11; i++) {
      const x = 20 + i * 124, r = 44 + CT.hash(i, 1, 4) * 26, y = 742 + Math.sin(G.t * 0.5 + i) * 3;
      CT.ell(ctx, x, y, r * 1.5, r * 0.8); CT.fs(ctx, env.night > 0.5 ? '#c9cfee' : '#ffffff');
    }
    makeShell(room);
    ctx.drawImage(G.shell, 0, 0, RM.W, RM.H);
    const walls = [], rugs = [], list = [];
    for (const it of room.items) {
      const d = FURN[it.type];
      if (!d) continue;
      if (d.kind === 'wall') walls.push([it, d]); else if (d.kind === 'rug') rugs.push([it, d]);
      else list.push({ y: it.y, it, d });
    }
    ctx.save();
    ctx.beginPath(); ctx.rect(RM.BX0, RM.BY0, RM.BX1 - RM.BX0, RM.BY1 - RM.BY0); ctx.clip();
    for (const w of walls) drawItemPart(ctx, w[0], w[1], 'draw');
    ctx.restore();
    // 窗外光斑
    if (env.night < 0.6) {
      const a = (1 - env.night * 1.6) * (env.weather === 'rain' ? 0.4 : 1), off = (env.hour - 12) * -11;
      for (const w of walls) {
        if (!w[1].window) continue;
        const it = w[0], hw = (w[1].w * RM.BACK * (it.scale || 1)) / 2 - 8;
        ctx.beginPath(); ctx.moveTo(it.x - hw, 392); ctx.lineTo(it.x + hw, 392); ctx.lineTo(it.x + hw * 1.3 + off, 640); ctx.lineTo(it.x - hw * 1.3 + off, 640); ctx.closePath();
        ctx.fillStyle = CT.lg(ctx, 0, 392, 0, 640, ['rgba(255,240,190,' + 0.14 * a + ')', 'rgba(255,240,190,0)']);
        ctx.fill();
      }
    }
    for (const r of rugs) drawItemPart(ctx, r[0], r[1], 'draw');
    // 阴影
    ctx.fillStyle = 'rgba(70,40,60,0.13)';
    for (const o of list) {
      if (o.it.elev) continue;
      const s = RM.scale(o.it.y) * (o.it.scale || 1);
      ctx.beginPath(); ctx.ellipse(o.it.x, o.it.y - 2, o.d.w * 0.46 * s, Math.min(15, o.d.w * 0.09) * s, 0, 0, 7); ctx.fill();
    }
    const ents = G.sceneEnts();
    const occupants = new Map();
    for (const e of ents) {
      if (e.drag) continue;
      if (e.act && e.act.it && (e.act.type === 'sit' || e.act.type === 'sleep' || e.act.type === 'bath')) {
        if (!occupants.has(e.act.it)) occupants.set(e.act.it, []);
        occupants.get(e.act.it).push(e);
      } else {
        const s = RM.scale(e.y);
        list.push({ y: e.y, e });
        ctx.beginPath(); ctx.ellipse(e.x, e.y - 1, 36 * s, 10 * s, 0, 0, 7); ctx.fill();
      }
    }
    for (const p of room.pets || []) {
      const r = petRt(p), s = RM.scale(r.y);
      if (r.drag) continue;
      list.push({ y: r.y, p });
      ctx.beginPath(); ctx.ellipse(r.x, r.y - 1, 30 * s, 8 * s, 0, 0, 7); ctx.fill();
    }
    list.sort((a, b) => a.y - b.y);
    for (const o of list) {
      if (o.it) {
        const small = o.d.kind === 'small';
        drawItemPart(ctx, o.it, o.d, 'draw');
        const occ = occupants.get(o.it);
        if (occ) for (const e of occ) drawEntRoom(ctx, e);
        if (o.d.over) drawItemPart(ctx, o.it, o.d, 'over');
        if (!small && G.hover === o.it) outlineItem(ctx, o.it, o.d, '#ffb0c8');
      } else if (o.e) drawEntRoom(ctx, o.e);
      else drawPetRoom(ctx, o.p);
    }
    drawParts(ctx);
    // 灯光
    if (env.ambient !== '#ffffff') {
      const lights = [], toS = (x, y, r) => ({ x: v.ox + x * v.s, y: v.oy + y * v.s, r: r * v.s });
      for (const it of room.items) {
        const d = FURN[it.type];
        if (!d || !it.on) continue;
        const s = itemScale(it, d), arr = d.lights ? d.lights(it) : d.light ? [d.light] : null;
        if (!arr) continue;
        for (const l of arr) { const q = toS(it.x + l.x * s * (it.flip ? -1 : 1), it.y - (it.elev || 0) + l.y * s, l.r); q.c = l.c; q.i = l.i; lights.push(q); }
      }
      applyLight(ctx, CT.mix(env.ambient, '#ffffff', 0.22), lights);
      m();
    }
    if (!photo) {
      // 拖动中的人物总在最上层，不被灯光压暗
      for (const e of ents) if (e.drag) drawEntRoom(ctx, e);
      for (const p of room.pets || []) if (petRt(p).drag) drawPetRoom(ctx, p);
      if (G.ghost && G.ghost.inside) drawGhost(ctx);
      const sel = G.sel;
      if (sel && sel.k === 'item') outlineItem(ctx, sel.it, FURN[sel.it.type], '#ff7a9a');
      if (sel && sel.k === 'char') { const b = entBox(sel.e); stitch(ctx, b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0, '#7fb8ee'); }
      if (sel && sel.k === 'pet') { const r = petRt(sel.p), s = RM.scale(r.y); stitch(ctx, r.x - 44 * s, r.y - 96 * s, 88 * s, 100 * s, '#7fb8ee'); }
      const main = G.main();
      if (inScene(main)) drawMainMark(ctx, main.x, main.y - (main.pose === 'sit' ? 150 : main.pose === 'sleep' ? 70 : main.pose === 'bath' ? 160 : 232) * RM.scale(main.y), 1);
    }
    for (const e of ents) if (e.bubble) drawBubble(ctx, e.x, bubbleY(e), e.bubble.text, 1.15);
  }
  function bubbleY(e) {
    const s = G.scene === 'room' ? RM.scale(e.y) * CH_SCALE : MAP_SCALE;
    return e.y - (e.pose === 'sit' || e.pose === 'bath' ? 150 : e.pose === 'sleep' ? 70 : 214) * s;
  }
  function drawMainMark(ctx, x, y, k) {
    const b = Math.sin(G.t * 3) * 3 * k;
    CT.heartPath(ctx, x, y + b, 8 * k); CT.fs(ctx, '#ff7a9a', '#fff', 2 * k);
  }
  function drawGhost(ctx) {
    const g = G.ghost, d = FURN[g.type];
    ctx.save(); ctx.globalAlpha = 0.72;
    const it = { type: g.type, x: g.x, y: g.y, color: d.colors ? d.colors[0] : null, scale: 1, seed: 3, on: !!d.on };
    drawItemPart(ctx, it, d, 'draw');
    if (d.over) drawItemPart(ctx, it, d, 'over');
    ctx.restore();
  }
  function itemBox(it) {
    const d = FURN[it.type], s = itemScale(it, d), hw = (d.w / 2) * s;
    if (d.kind === 'wall') { const hh = (d.h / 2) * s; return { x0: it.x - hw, x1: it.x + hw, y0: it.y - hh, y1: it.y + hh }; }
    if (d.kind === 'rug') { const hh = (d.h / 2) * s * 0.62; return { x0: it.x - hw, x1: it.x + hw, y0: it.y - hh, y1: it.y + hh }; }
    const b = it.y - (it.elev || 0);
    return { x0: it.x - hw, x1: it.x + hw, y0: b - d.h * s, y1: b };
  }
  function entBox(e) {
    const s = (e.act && e.act.it ? RM.scale(e.act.it.y) : RM.scale(e.y)) * CH_SCALE;
    if (e.pose === 'sleep') return { x0: e.x - 46 * s, x1: e.x + 46 * s, y0: e.y - 54 * s, y1: e.y + 42 * s };
    if (e.pose === 'sit' || e.pose === 'bath') return { x0: e.x - 48 * s, x1: e.x + 48 * s, y0: e.y - 140 * s, y1: e.y + 38 * s };
    return { x0: e.x - 50 * s, x1: e.x + 50 * s, y0: e.y - 206 * s, y1: e.y + 4 };
  }
  function stitch(ctx, x, y, w, h, col) {
    ctx.save(); ctx.lineCap = 'round';
    CT.rr(ctx, x - 4, y - 4, w + 8, h + 8, 12);
    ctx.setLineDash([]); ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 5; ctx.stroke();
    ctx.setLineDash([9, 8]); ctx.lineDashOffset = -G.t * 18; ctx.strokeStyle = col; ctx.lineWidth = 2.6; ctx.stroke();
    ctx.restore();
  }
  function outlineItem(ctx, it, d, col) { const b = itemBox(it); stitch(ctx, b.x0, b.y0, b.x1 - b.x0, b.y1 - b.y0, col); }
  function wrapText(ctx, text, max) {
    const lines = []; let line = '';
    for (const ch of text) { if (ctx.measureText(line + ch).width > max && line) { lines.push(line); line = ch; } else line += ch; }
    if (line) lines.push(line);
    return lines;
  }
  function drawBubble(ctx, x, y, text, k) {
    ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
    ctx.font = '15px ' + CT.FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const lines = wrapText(ctx, text, 150), w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 24, h = lines.length * 20 + 14;
    CT.rr(ctx, -w / 2, -h - 12, w, h, 13); CT.fs(ctx, '#fffdf8', '#caa7b4', 1.6);
    ctx.beginPath(); ctx.moveTo(-7, -12.8); ctx.lineTo(0, -3); ctx.lineTo(7, -12.8); CT.fs(ctx, '#fffdf8');
    ctx.beginPath(); ctx.moveTo(-7, -12); ctx.lineTo(0, -3); ctx.lineTo(7, -12); ctx.strokeStyle = '#caa7b4'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.fillStyle = '#5a3448';
    lines.forEach((l, i) => ctx.fillText(l, 0, -h - 12 + 17 + i * 20));
    ctx.restore();
  }

  // ---------- 灯光：先画一张光照图，再整体正片叠底 ----------
  function applyLight(ctx, ambient, lights) {
    const l = G.lmc, w = G.lm.width, h = G.lm.height;
    l.globalCompositeOperation = 'source-over'; l.fillStyle = ambient; l.fillRect(0, 0, w, h);
    l.globalCompositeOperation = 'lighter';
    for (const q of lights) {
      const x = q.x / 2, y = q.y / 2, r = q.r / 2, c = q.c || '#ffdf9e', k = q.i || 1;
      const g = l.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, CT.rgba(c, 0.92 * k)); g.addColorStop(0.45, CT.rgba(c, 0.34 * k)); g.addColorStop(1, CT.rgba(c, 0));
      l.fillStyle = g; l.fillRect(x - r, y - r, r * 2, r * 2);
    }
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'multiply';
    ctx.drawImage(G.lm, 0, 0, G.canvas.width, G.canvas.height);
    ctx.restore();
  }

  // ---------- 地图 ----------
  function clampCam() {
    const m = G.s.map, c = G.cam, vw = G.W / c.z, vh = G.H / c.z, mw = m.w * T, mh = m.h * T, pad = 90;
    c.x = vw >= mw + pad * 2 ? mw / 2 : clamp(c.x, vw / 2 - pad, mw - vw / 2 + pad);
    c.y = vh >= mh + pad * 2 ? mh / 2 : clamp(c.y, vh / 2 - pad, mh - vh / 2 + pad);
  }
  function followCam(e, dt, k) {
    const c = G.cam;
    c.x = lerp(c.x, e.x, clamp(dt * k, 0, 1)); c.y = lerp(c.y, e.y, clamp(dt * k, 0, 1));
    clampCam();
  }
  G.centerOnMain = function () { const e = G.main(); if (G.scene === 'map') { G.cam.x = e.x; G.cam.y = e.y; clampCam(); } };
  G.zoom = function (f, sx, sy) {
    const c = G.cam, m = G.s.map;
    const minZ = Math.min(1, Math.max(0.42, Math.min(G.W / (m.w * T + 180), G.H / (m.h * T + 180))));
    const before = screenToWorld(sx === undefined ? G.W / 2 : sx, sy === undefined ? G.H / 2 : sy);
    c.z = clamp(c.z * f, minZ, 1.7);
    const after = screenToWorld(sx === undefined ? G.W / 2 : sx, sy === undefined ? G.H / 2 : sy);
    c.x += before[0] - after[0]; c.y += before[1] - after[1];
    clampCam();
  };
  const screenToWorld = (sx, sy) => [(sx - G.W / 2) / G.cam.z + G.cam.x, (sy - G.H / 2) / G.cam.z + G.cam.y];
  const worldToScreen = (x, y) => [(x - G.cam.x) * G.cam.z + G.W / 2, (y - G.cam.y) * G.cam.z + G.H / 2];
  G.fx_map = null;
  function buildMapFx() {
    const m = G.s.map, fl = [];
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (m.t[y * m.w + x] === 1 || m.t[y * m.w + x] === 7) fl.push([x, y]);
    const mw = m.w * T, mh = m.h * T;
    G.fx_map = {
      flies: Array.from({ length: 9 }, (_, i) => { const f = fl.length ? pick(fl) : [rand(0, m.w), rand(0, m.h)]; return { x: f[0] * T, y: f[1] * T, ph: rand(0, 9), c: pick(['#ffb7ce', '#ffe07a', '#fff', '#b8d8ff', '#ffb07a']), i }; }),
      fire: Array.from({ length: 34 }, () => ({ x: rand(0, mw), y: rand(0, mh), ph: rand(0, 9) })),
      shadows: Array.from({ length: 6 }, (_, i) => ({ x: rand(-300, mw), y: rand(0, mh), w: 240 + i * 50, h: 80 + i * 16, v: 9 + i * 2 })),
      sakura: m.objs.filter((o) => o.type === 'tree_sakura'),
      smoke: 0, petalT: 0,
    };
  }
  function updMapFx(dt) {
    const f = G.fx_map, m = G.s.map, mw = m.w * T, mh = m.h * T;
    if (!f) return;
    for (const s of f.shadows) { s.x += s.v * dt; if (s.x > mw + 400) { s.x = -500; s.y = rand(0, mh); } }
    f.petalT -= dt;
    if (f.petalT <= 0 && f.sakura.length) {
      f.petalT = 0.32;
      const o = pick(f.sakura);
      fx('petal', o.x + rand(-50, 50), o.y - rand(60, 120), { vx: rand(10, 30), vy: rand(16, 30), life: 3.4, c: '#ffc2d8' });
    }
    if (G.env.weather === 'petal' && G.parts.length < 200) {
      const a = screenToWorld(rand(0, G.W), rand(-30, G.H));
      fx('petal', a[0], a[1], { vx: rand(16, 40), vy: rand(20, 40), life: 3.2 });
    }
    f.smoke -= dt;
    if (f.smoke <= 0) {
      f.smoke = 0.8;
      for (const o of m.objs) if (o.type === 'h_cottage') fx('steam', o.x + 40, o.y - 166, { s: rand(5, 8), vx: rand(4, 12), vy: -22, life: 2.2 });
      for (const o of m.objs) if (o.type === 'campfire' && chance(0.6)) fx('spark', o.x + rand(-8, 8), o.y - 50, { s: 3.4, c: '#ffb84a', vy: -44, life: 1 });
    }
  }
  function drawRim(ctx, m) {
    const mw = m.w * T, mh = m.h * T, c = G.env.night > 0.5 ? '#c9cfee' : '#ffffff';
    ctx.fillStyle = c;
    ctx.beginPath();
    const puff = (x, y, r) => { ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, 7); };
    for (let x = -60; x <= mw + 60; x += 56) { const r = 52 + CT.hash(Math.round(x), 1, 3) * 34; puff(x, -30, r); puff(x, mh + 30, r); }
    for (let y = -60; y <= mh + 60; y += 56) { const r = 52 + CT.hash(Math.round(y), 2, 3) * 34; puff(-30, y, r); puff(mw + 30, y, r); }
    ctx.fill();
  }
  function objVisible(o, d, vx0, vy0, vx1, vy1) { return o.x + d.w > vx0 && o.x - d.w < vx1 && o.y > vy0 && o.y - d.h < vy1; }
  function drawObj(ctx, o, d) {
    ctx.save(); ctx.translate(o.x, o.y); if (o.flip) ctx.scale(-1, 1);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    d.draw(ctx, o, G.t, G.env);
    ctx.restore();
  }
  function renderMap(ctx, photo) {
    const m = G.s.map, c = G.cam, env = G.env;
    drawSkyBg(ctx);
    if (G.terrainDirty || !G.terrainCv) { G.terrainCv = CT.renderTerrain(m, Math.min(1.6, G.dpr * 1.1), G.terrainCv); G.terrainDirty = false; }
    const set = () => ctx.setTransform(G.dpr * c.z, 0, 0, G.dpr * c.z, G.dpr * (G.W / 2 - c.x * c.z), G.dpr * (G.H / 2 - c.y * c.z));
    set();
    const mw = m.w * T, mh = m.h * T;
    drawRim(ctx, m);
    ctx.drawImage(G.terrainCv, 0, 0, mw, mh);
    const v0 = screenToWorld(0, 0), v1 = screenToWorld(G.W, G.H);
    const tx0 = clamp(Math.floor(v0[0] / T), 0, m.w - 1), ty0 = clamp(Math.floor(v0[1] / T), 0, m.h - 1), tx1 = clamp(Math.ceil(v1[0] / T), 0, m.w - 1), ty1 = clamp(Math.ceil(v1[1] / T), 0, m.h - 1);
    CT.drawWaterFx(ctx, m, tx0, ty0, tx1, ty1, G.t);
    if (!photo && G.tool !== 'walk') {
      ctx.strokeStyle = 'rgba(90,52,72,0.09)'; ctx.lineWidth = 1; ctx.beginPath();
      for (let x = tx0; x <= tx1 + 1; x++) { ctx.moveTo(x * T, ty0 * T); ctx.lineTo(x * T, (ty1 + 1) * T); }
      for (let y = ty0; y <= ty1 + 1; y++) { ctx.moveTo(tx0 * T, y * T); ctx.lineTo((tx1 + 1) * T, y * T); }
      ctx.stroke();
    }
    const list = [];
    ctx.fillStyle = 'rgba(70,40,60,0.15)';
    for (const o of m.objs) {
      const d = OBJ[o.type];
      if (!d || !objVisible(o, d, v0[0], v0[1], v1[0], v1[1])) continue;
      if (d.flat) { drawObj(ctx, o, d); continue; }
      if (!d.water) { ctx.beginPath(); ctx.ellipse(o.x + 5, o.y - 2, d.w * 0.46, Math.min(15, d.w * 0.15), 0, 0, 7); ctx.fill(); }
      list.push({ y: o.y, o, d });
    }
    const ents = G.sceneEnts();
    for (const e of ents) {
      list.push({ y: e.y, e });
      ctx.beginPath(); ctx.ellipse(e.x, e.y - 1, 15, 4.6, 0, 0, 7); ctx.fill();
    }
    list.sort((a, b) => a.y - b.y);
    for (const q of list) {
      if (q.o) drawObj(ctx, q.o, q.d);
      else {
        const e = q.e;
        ctx.save(); ctx.translate(e.x, e.y); ctx.scale(MAP_SCALE, MAP_SCALE);
        CT.drawChar(ctx, e.c.look, entState(e));
        ctx.restore();
      }
    }
    const f = G.fx_map;
    if (f) {
      if (env.night < 0.6 && env.weather !== 'rain') {
        for (const b of f.flies) {
          const p = G.t * 0.9 + b.ph, x = b.x + Math.sin(p) * 44 + Math.cos(p * 0.6) * 30, y = b.y + Math.cos(p * 1.3) * 24, w = Math.abs(Math.sin(G.t * 14 + b.i)) * 5 + 1.2;
          for (const s of [-1, 1]) { CT.ell(ctx, x + s * w * 0.8, y, w, 3.8); CT.fs(ctx, b.c, 'rgba(90,52,72,0.4)', 0.7); }
        }
      }
      ctx.fillStyle = 'rgba(70,60,110,0.07)';
      for (const s of f.shadows) { ctx.beginPath(); ctx.ellipse(s.x, s.y, s.w, s.h, 0, 0, 7); ctx.fill(); }
    }
    drawParts(ctx);
    drawWeather(ctx, set);
    if (env.ambient !== '#ffffff') {
      const lights = [];
      const add = (x, y, r, col) => { const p = worldToScreen(x, y); lights.push({ x: p[0], y: p[1], r: r * c.z, c: col }); };
      for (const o of m.objs) {
        const d = OBJ[o.type];
        if (d && d.light) for (const l of d.light(o)) add(l.x, l.y, l.r, l.c);
      }
      const main = G.main(); if (inScene(main)) add(main.x, main.y - 40, 130, '#c8c8ff');
      applyLight(ctx, env.ambient, lights);
      if (f && env.night > 0.5) {
        ctx.save(); set();
        for (const b of f.fire) {
          const a = 0.5 + 0.5 * Math.sin(G.t * 2.4 + b.ph), x = b.x + Math.sin(G.t * 0.6 + b.ph) * 26, y = b.y + Math.cos(G.t * 0.5 + b.ph) * 20;
          const g = ctx.createRadialGradient(x, y, 0, x, y, 9); g.addColorStop(0, 'rgba(230,255,150,' + a + ')'); g.addColorStop(1, 'rgba(230,255,150,0)');
          ctx.fillStyle = g; ctx.fillRect(x - 9, y - 9, 18, 18);
        }
        ctx.restore();
      }
      set();
    }
    if (!photo) {
      if (G.tool === 'terrain' && G.hoverTile) {
        const b = G.brush, p = G.hoverTile;
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.4; ctx.setLineDash([7, 6]);
        ctx.strokeRect((p[0] - b + 1) * T, (p[1] - b + 1) * T, (b * 2 - 1) * T, (b * 2 - 1) * T); ctx.setLineDash([]);
      }
      if (G.mapGhost) {
        const d = OBJ[G.mapGhost.type];
        ctx.save(); ctx.globalAlpha = 0.65;
        drawObj(ctx, { x: G.mapGhost.x, y: G.mapGhost.y, color: d.colors ? d.colors[0] : null, seed: 1, text: '' }, d);
        ctx.restore();
      }
      if (G.sel && G.sel.k === 'obj') { const o = G.sel.o, d = OBJ[o.type]; stitch(ctx, o.x - d.w / 2, o.y - d.h, d.w, d.h + 6, '#ff7a9a'); }
      if (G.sel && G.sel.k === 'char') { const e = G.sel.e; stitch(ctx, e.x - 24, e.y - 90, 48, 94, '#7fb8ee'); }
      const main = G.main();
      if (inScene(main)) drawMainMark(ctx, main.x, main.y - 100, 0.8);
      ctx.font = '12px ' + CT.FONT; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.fillStyle = '#5a3448';
      for (const e of ents) { ctx.strokeText(e.c.name, e.x, e.y + 16); ctx.fillText(e.c.name, e.x, e.y + 16); }
      for (const o of m.objs) {
        if (!o.houseId) continue;
        const h = G.s.houses[o.houseId], d = OBJ[o.type];
        if (h && objVisible(o, d, v0[0], v0[1], v1[0], v1[1])) { ctx.strokeText(h.name, o.x, o.y + 16); ctx.fillText(h.name, o.x, o.y + 16); }
      }
    }
    for (const e of ents) if (e.bubble) drawBubble(ctx, e.x, e.y - 96, e.bubble.text, 0.9);
  }
  function drawWeather(ctx, set) {
    const w = G.env.weather;
    if (w !== 'rain' && w !== 'snow') return;
    ctx.save(); ctx.setTransform(G.dpr, 0, 0, G.dpr, 0, 0);
    if (w === 'rain') {
      ctx.strokeStyle = 'rgba(205,225,255,0.55)'; ctx.lineWidth = 1.5; ctx.beginPath();
      for (let i = 0; i < 120; i++) {
        const x = (CT.hash(i, 1, 5) * (G.W + 80) - G.t * 60) % (G.W + 80), y = (CT.hash(i, 2, 5) * (G.H + 40) + G.t * (520 + i * 3)) % (G.H + 40);
        const px = x < 0 ? x + G.W + 80 : x;
        ctx.moveTo(px, y); ctx.lineTo(px - 4, y + 15);
      }
      ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      for (let i = 0; i < 90; i++) {
        const x = (CT.hash(i, 1, 6) * G.W + Math.sin(G.t * 0.7 + i) * 26 + G.W) % G.W, y = (CT.hash(i, 2, 6) * G.H + G.t * (34 + (i % 5) * 9)) % G.H;
        ctx.beginPath(); ctx.arc(x, y, 1.6 + (i % 3) * 0.7, 0, 7); ctx.fill();
      }
    }
    ctx.restore();
  }

  // ---------- 寻路 ----------
  const tileBlocked = (x, y) => {
    const m = G.s.map, tx = Math.floor(x / T), ty = Math.floor(y / T);
    if (tx < 0 || ty < 0 || tx >= m.w || ty >= m.h) return true;
    return !!G.block[ty * m.w + tx];
  };
  function nearFree(x, y) {
    for (let r = 0; r < 5; r++) for (let i = 0; i < 12; i++) {
      const a = (i * 6.283) / 12, px = x + Math.cos(a) * (40 + r * 36), py = y + Math.sin(a) * (40 + r * 36);
      if (!tileBlocked(px, py)) return [px, py];
    }
    return [x, y];
  }
  G.findPath = function (sx, sy, gx, gy, quick) {
    const m = G.s.map, w = m.w, h = m.h, b = G.block;
    let s = [Math.floor(sx / T), Math.floor(sy / T)], g = [Math.floor(gx / T), Math.floor(gy / T)];
    s = [clamp(s[0], 0, w - 1), clamp(s[1], 0, h - 1)]; g = [clamp(g[0], 0, w - 1), clamp(g[1], 0, h - 1)];
    const idx = (x, y) => y * w + x;
    if (b[idx(g[0], g[1])]) {
      if (quick) return null;
      let best = null, bd = 1e9;
      for (let y = Math.max(0, g[1] - 3); y <= Math.min(h - 1, g[1] + 3); y++) for (let x = Math.max(0, g[0] - 3); x <= Math.min(w - 1, g[0] + 3); x++) {
        if (b[idx(x, y)]) continue;
        const d = Math.hypot(x - g[0], y - g[1]);
        if (d < bd) { bd = d; best = [x, y]; }
      }
      if (!best) return null;
      g = best; gx = (g[0] + 0.5) * T; gy = (g[1] + 0.5) * T;
    }
    const start = idx(s[0], s[1]), goal = idx(g[0], g[1]);
    const gs = new Float32Array(w * h).fill(1e9), from = new Int32Array(w * h).fill(-1), done = new Uint8Array(w * h);
    gs[start] = 0;
    const open = [start];
    const heur = (i) => Math.hypot((i % w) - g[0], Math.floor(i / w) - g[1]);
    const dirs = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.41], [1, -1, 1.41], [-1, 1, 1.41], [-1, -1, 1.41]];
    let found = false, guard = 0;
    while (open.length && guard++ < 1400) {
      let bi = 0, bf = 1e9;
      for (let i = 0; i < open.length; i++) { const f = gs[open[i]] + heur(open[i]); if (f < bf) { bf = f; bi = i; } }
      const cur = open[bi]; open.splice(bi, 1);
      if (cur === goal) { found = true; break; }
      done[cur] = 1;
      const cx = cur % w, cy = Math.floor(cur / w);
      for (const d of dirs) {
        const nx = cx + d[0], ny = cy + d[1];
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const ni = idx(nx, ny);
        if (b[ni] || done[ni]) continue;
        if (d[0] && d[1] && (b[idx(cx + d[0], cy)] || b[idx(cx, cy + d[1])])) continue;
        const ng = gs[cur] + d[2];
        if (ng < gs[ni]) { gs[ni] = ng; from[ni] = cur; if (open.indexOf(ni) < 0) open.push(ni); }
      }
    }
    if (!found) return null;
    const pts = [];
    for (let i = goal; i !== -1 && i !== start; i = from[i]) pts.unshift([(i % w + 0.5) * T, (Math.floor(i / w) + 0.5) * T]);
    pts.push([gx, gy]);
    const clear = (a, b2) => {
      const d = Math.hypot(b2[0] - a[0], b2[1] - a[1]), n = Math.ceil(d / 14);
      for (let i = 1; i < n; i++) if (tileBlocked(a[0] + ((b2[0] - a[0]) * i) / n, a[1] + ((b2[1] - a[1]) * i) / n)) return false;
      return true;
    };
    const out = []; let cur = [sx, sy], i = 0;
    while (i < pts.length) {
      let j = pts.length - 1;
      while (j > i && !clear(cur, pts[j])) j--;
      out.push(pts[j]); cur = pts[j]; i = j + 1;
    }
    return out;
  };

  // ---------- 总渲染 ----------
  function render(ctx, photo) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    if (G.scene === 'room') renderRoom(ctx, photo); else if (G.scene === 'map') renderMap(ctx, photo);
    if (G.fade > 0 && !photo) {
      ctx.setTransform(G.dpr, 0, 0, G.dpr, 0, 0);
      ctx.fillStyle = 'rgba(255,253,248,' + G.fade + ')'; ctx.fillRect(0, 0, G.W, G.H);
    }
  }
  G.snapshot = function () {
    render(G.ctx, true);
    const src = G.canvas, pad = 26, foot = 76, pw = 1000, ph = Math.round((pw * src.height) / src.width);
    const cv = document.createElement('canvas');
    cv.width = pw + pad * 2; cv.height = ph + pad + foot;
    const c = cv.getContext('2d');
    c.fillStyle = '#fffdf8'; c.fillRect(0, 0, cv.width, cv.height);
    c.drawImage(src, pad, pad, pw, ph);
    c.fillStyle = '#5a3448'; c.font = '28px ' + CT.FONT; c.textAlign = 'center'; c.textBaseline = 'middle';
    const place = G.scene === 'map' ? G.s.townName : G.house.name + ' · ' + G.room.name;
    c.fillText(place + '　第 ' + G.s.day + ' 天', cv.width / 2, ph + pad + foot / 2);
    A.sfx('shutter');
    G.emit('photo');
    render(G.ctx, false);
    return cv;
  };

  // ---------- 选择 ----------
  G.select = function (sel) {
    G.sel = sel;
    if (UI()) UI().onSelect(sel);
  };
  // 选中物体在屏幕上的顶部中点（给浮动工具条定位）
  G.selAnchor = function () {
    const s = G.sel;
    if (!s) return null;
    if (G.scene === 'room') {
      let b = null;
      if (s.k === 'item') b = itemBox(s.it);
      else if (s.k === 'char') b = entBox(s.e);
      else if (s.k === 'pet') { const r = petRt(s.p); b = { x0: r.x - 30, x1: r.x + 30, y0: r.y - 100 * RM.scale(r.y), y1: r.y }; }
      if (!b) return null;
      const v = G.view;
      return { x: v.ox + ((b.x0 + b.x1) / 2) * v.s, y: v.oy + b.y0 * v.s, bottom: v.oy + b.y1 * v.s };
    }
    if (s.k === 'obj') { const d = OBJ[s.o.type], p = worldToScreen(s.o.x, s.o.y - d.h), q = worldToScreen(s.o.x, s.o.y); return { x: p[0], y: p[1], bottom: q[1] }; }
    if (s.k === 'char') { const p = worldToScreen(s.e.x, s.e.y - 90), q = worldToScreen(s.e.x, s.e.y); return { x: p[0], y: p[1], bottom: q[1] }; }
    return null;
  };

  // ---------- 房间内操作 ----------
  G.addItem = function (type, x, y) {
    const d = FURN[type], room = G.room;
    let px = x, py = y;
    if (px === undefined) {
      if (d.kind === 'wall') { px = rand(320, 960); py = rand(150, 250); } else { px = rand(440, 840); py = d.kind === 'rug' ? rand(520, 620) : rand(500, 640); }
    }
    const it = W.mkItem(type, px, py);
    if (d.kind === 'wall') { const c = clampWall(it, px, py); it.x = c[0]; it.y = c[1]; } else { const f = RM.clampFloor(px, py); it.x = f[0]; it.y = f[1]; }
    room.items.push(it);
    if (d.kind === 'small') snapSurface(it);
    A.sfx('pop');
    burst('spark', it.x, it.y - 40, 5, { s: 6 });
    G.emit('place'); G.markDirty(); G.select({ k: 'item', it });
    return it;
  };
  function clampWall(it, x, y) {
    const d = FURN[it.type], s = RM.BACK * (it.scale || 1), hw = (d.w / 2) * s, hh = (d.h / 2) * s;
    const x0 = RM.BX0 + Math.min(hw, 60), x1 = RM.BX1 - Math.min(hw, 60), y0 = RM.BY0 + Math.min(hh, 40), y1 = RM.BY1 - Math.min(hh, 30);
    return [clamp(x, x0, x1), clamp(y, y0, y1)];
  }
  function moveItem(it, x, y) {
    const d = FURN[it.type];
    const ox = it.x, oy = it.y;
    if (d.kind === 'wall') { const c = clampWall(it, x, y); it.x = c[0]; it.y = c[1]; }
    else { const f = RM.clampFloor(x, y); it.x = f[0]; it.y = f[1]; }
    if (d.surface) for (const c of G.room.items) if (c.pid === it.id) { c.x += it.x - ox; c.y += it.y - oy; c.elev = -d.surface.y * RM.scale(it.y) * (it.scale || 1); }
  }
  function snapSurface(it, py) {
    it.elev = 0; it.pid = null;
    let best = null;
    for (const t of G.room.items) {
      const d = FURN[t.type];
      if (!d.surface || t === it) continue;
      const s = RM.scale(t.y) * (t.scale || 1), cx = t.x + (d.surface.x || 0) * s * (t.flip ? -1 : 1), top = t.y + d.surface.y * s;
      const ry = py === undefined ? it.y : py;
      if (Math.abs(it.x - cx) <= (d.surface.w / 2) * s + 8 && ry > top - 46 * s && ry < t.y + 8 && (!best || t.y > best.y)) best = t;
    }
    if (best) {
      const d = FURN[best.type], s = RM.scale(best.y) * (best.scale || 1), cx = best.x + (d.surface.x || 0) * s * (best.flip ? -1 : 1);
      it.x = clamp(it.x, cx - (d.surface.w / 2) * s, cx + (d.surface.w / 2) * s);
      it.y = best.y + 1; it.elev = -d.surface.y * s; it.pid = best.id;
    }
  }
  G.deleteItem = function (it) {
    const r = G.room, i = r.items.indexOf(it);
    if (i < 0) return;
    r.items.splice(i, 1);
    for (const c of r.items) if (c.pid === it.id) { c.pid = null; c.elev = 0; c.y = RM.clampFloor(c.x, it.y + 24)[1]; }
    A.sfx('del'); G.select(null); G.markDirty();
  };
  G.copyItem = function (it) {
    const c = JSON.parse(JSON.stringify(it));
    c.id = CT.uid(); c.seed = CT.randi(1, 9999); c.x += 46; c.pid = null; c.elev = 0;
    const d = FURN[it.type];
    if (d.kind === 'wall') { const q = clampWall(c, c.x, c.y + 10); c.x = q[0]; c.y = q[1]; } else { const f = RM.clampFloor(c.x, c.y + 16); c.x = f[0]; c.y = f[1]; }
    G.room.items.push(c);
    A.sfx('pop'); G.emit('place'); G.select({ k: 'item', it: c }); G.markDirty();
  };
  G.layerItem = function (it, dir) {
    const a = G.room.items, i = a.indexOf(it);
    a.splice(i, 1);
    if (dir > 0) a.push(it); else a.unshift(it);
    A.sfx('click'); G.markDirty();
  };
  G.addPet = function (kind) {
    const f = RM.clampFloor(rand(440, 840), rand(540, 660));
    const p = W.mkPet(kind, f[0], f[1]);
    (G.room.pets = G.room.pets || []).push(p);
    A.sfx(CT.PETS[kind].cry); burst('heart', f[0], f[1] - 60, 4, { s: 7 });
    G.emit('place'); G.markDirty(); G.select({ k: 'pet', p });
  };
  G.removePet = function (p) { const a = G.room.pets, i = a.indexOf(p); if (i >= 0) a.splice(i, 1); A.sfx('del'); G.select(null); G.markDirty(); };

  // ---------- 地图操作 ----------
  function paint(tx, ty, id) {
    const m = G.s.map, b = G.brush - 1;
    let changed = false;
    for (let y = ty - b; y <= ty + b; y++) for (let x = tx - b; x <= tx + b; x++) {
      if (x < 0 || y < 0 || x >= m.w || y >= m.h) continue;
      if (m.t[y * m.w + x] !== id) { m.t[y * m.w + x] = id; changed = true; }
    }
    if (changed) { G.terrainDirty = true; G.block = W.buildBlock(m); G.markDirty(); }
  }
  G.placeObj = function (type, x, y) {
    const m = G.s.map, d = OBJ[type];
    const tx = Math.floor(x / T), ty = Math.floor(y / T);
    if (tx < 0 || ty < 0 || tx >= m.w || ty >= m.h) return null;
    const water = m.t[ty * m.w + tx] === 5;
    if (d.water && !water) { UI().toast(d.name + '要放在水面上'); return null; }
    if (!d.water && water) { UI().toast('水面上放不下，先换成别的地形吧'); return null; }
    const o = W.mkObj(type, Math.round(x / 8) * 8, Math.round(y / 8) * 8);
    if (d.house) {
      const h = W.mkHouse(type, d.name, null);
      G.s.houses[h.id] = h; o.houseId = h.id;
      G.log('在小镇盖了一座' + d.name);
    }
    if (d.text) o.text = '欢迎来玩';
    m.objs.push(o);
    G.block = W.buildBlock(m);
    if (type.indexOf('tree') === 0) { G.emit('plant'); if (G.fx_map && type === 'tree_sakura') G.fx_map.sakura.push(o); }
    A.sfx('pop');
    G.markDirty();
    return o;
  };
  G.deleteObj = function (o) {
    const m = G.s.map, i = m.objs.indexOf(o);
    if (i < 0) return;
    if (o.houseId) {
      if (o.houseId === G.s.homeId) { UI().toast('这是你的家，不能拆掉哦'); return; }
      const hid = o.houseId;
      Object.values(G.ents).forEach((e) => { if (e.loc.k === 'room' && e.loc.h === hid) { e.loc = { k: 'map' }; e.x = o.x; e.y = o.y + 30; } });
      delete G.s.houses[hid];
    }
    m.objs.splice(i, 1);
    G.block = W.buildBlock(m);
    A.sfx('del'); G.select(null); G.markDirty();
  };
  G.regenTown = function (kind) {
    const s = G.s, m = s.map, homeObj = m.objs.find((o) => o.houseId === s.homeId);
    if (kind === 'clear') {
      m.t = new Array(m.w * m.h).fill(0);
      m.objs = m.objs.filter((o) => o.houseId);
    } else {
      const hs = Object.values(s.houses).map((h) => { const old = m.objs.find((o) => o.houseId === h.id); return { id: h.id, style: h.style, color: old ? old.color : null }; });
      hs.sort((a, b) => (a.id === s.homeId ? -1 : b.id === s.homeId ? 1 : 0));
      const n = W.genTown(CT.randi(1, 1e8), m.w, m.h, hs);
      m.t = n.t; m.objs = n.objs;
    }
    G.block = W.buildBlock(m); G.terrainDirty = true;
    Object.values(G.ents).forEach((e) => { if (e.loc.k === 'map' && tileBlocked(e.x, e.y)) { const p = nearFree(e.x, e.y); e.x = p[0]; e.y = p[1]; e.path = null; } });
    if (tileBlocked(G.main().x, G.main().y)) { const o = homeObj || m.objs[0]; if (o) { G.main().x = o.x; G.main().y = o.y + 30; } }
    buildMapFx(); G.select(null); A.sfx('magic'); G.markDirty();
    UI().toast(kind === 'clear' ? '地图清空了，可以从头画' : '一座新的小镇长出来了');
  };

  // ---------- 输入 ----------
  function evPos(ev) { const r = G.canvas.getBoundingClientRect(); return [ev.clientX - r.left, ev.clientY - r.top]; }
  const toRoom = (sx, sy) => [(sx - G.view.ox) / G.view.s, (sy - G.view.oy) / G.view.s];
  function pixelHit(px, py, x, y, sx, sy, draw) {
    const c = G.hc;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, 7, 7);
    const k = 1;
    c.setTransform(sx * k, 0, 0, sy * k, (x - px) * k + 3, (y - py) * k + 3);
    try { draw(c); } catch (e) { return true; }
    const d = c.getImageData(0, 0, 7, 7).data;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 12) return true;
    return false;
  }
  function pickRoom(px, py) {
    const room = G.room;
    const ents = G.sceneEnts().slice().sort((a, b) => b.y - a.y);
    for (const e of ents) {
      const b = entBox(e);
      if (px >= b.x0 + 10 && px <= b.x1 - 10 && py >= b.y0 && py <= b.y1) return { k: 'char', e };
    }
    for (const p of room.pets || []) {
      const r = petRt(p), s = RM.scale(r.y);
      if (Math.abs(px - r.x) < 42 * s && py > r.y - 90 * s && py < r.y + 6) return { k: 'pet', p };
    }
    const floor = room.items.filter((i) => { const d = FURN[i.type]; return d && (d.kind === 'floor' || d.kind === 'small'); }).sort((a, b) => b.y + (b.elev ? 1 : 0) - (a.y + (a.elev ? 1 : 0)));
    for (const it of floor) {
      const d = FURN[it.type], b = itemBox(it);
      if (px < b.x0 || px > b.x1 || py < b.y0 || py > b.y1) continue;
      const s = itemScale(it, d);
      const hit = pixelHit(px, py, it.x, it.y - (it.elev || 0), it.flip ? -s : s, s, (c) => { d.draw(c, it, G.t, G.env); if (d.over) d.over(c, it, G.t, G.env); });
      if (hit) return { k: 'item', it };
    }
    if (px > RM.BX0 && px < RM.BX1 && py > RM.BY0 && py < RM.BY1) {
      const walls = room.items.filter((i) => FURN[i.type] && FURN[i.type].kind === 'wall').reverse();
      for (const it of walls) { const b = itemBox(it); if (px >= b.x0 && px <= b.x1 && py >= b.y0 && py <= b.y1) return { k: 'item', it }; }
    }
    const rugs = room.items.filter((i) => FURN[i.type] && FURN[i.type].kind === 'rug').reverse();
    for (const it of rugs) { const b = itemBox(it); if (px >= b.x0 && px <= b.x1 && py >= b.y0 && py <= b.y1) return { k: 'item', it }; }
    return null;
  }
  function roomDown(ev, sx, sy) {
    const [px, py] = toRoom(sx, sy), hit = pickRoom(px, py);
    G.drag = { kind: hit ? hit.k : 'none', hit, sx, sy, px, py, moved: false, t: performance.now() };
    if (hit && hit.k === 'item') { G.drag.dx = hit.it.x - px; G.drag.dy = hit.it.y - (hit.it.elev || 0) - py; }
  }
  function roomMove(sx, sy) {
    const dr = G.drag;
    if (!dr) return;
    if (!dr.moved && Math.hypot(sx - dr.sx, sy - dr.sy) < 7) return;
    const [px, py] = toRoom(sx, sy);
    if (!dr.moved) {
      dr.moved = true;
      if (dr.kind === 'item') {
        A.sfx('pick');
        if (dr.hit.it.pid) { dr.hit.it.pid = null; dr.hit.it.elev = 0; }
        G.select({ k: 'item', it: dr.hit.it });
      } else if (dr.kind === 'char') { const e = dr.hit.e; G.stop(e); e.path = null; e.drag = true; A.sfx('pick'); setExpr(e, 'surprise', 60); if (UI()) UI().onSelect(null); G.sel = null; }
      else if (dr.kind === 'pet') { const r = petRt(dr.hit.p); r.drag = true; r.pose = 'sit'; A.sfx('pick'); }
    }
    if (dr.kind === 'item') {
      moveItem(dr.hit.it, px + dr.dx, py + dr.dy);
    } else if (dr.kind === 'char') {
      const e = dr.hit.e; e.x = px; e.y = py + 110 * RM.scale(Math.max(py, RM.BY1));
      const it = dropTarget(e.x, e.y);
      G.hover = it;
    } else if (dr.kind === 'pet') { const r = petRt(dr.hit.p); r.x = px; r.y = py + 30; }
  }
  function dropTarget(x, y) {
    let best = null;
    for (const it of G.room.items) {
      const d = FURN[it.type];
      if (!d || !(d.seats || d.beds || d.tub)) continue;
      const b = itemBox(it);
      if (x > b.x0 && x < b.x1 && y - 60 > b.y0 && y - 60 < b.y1 && (!best || it.y > best.y)) best = it;
    }
    return best;
  }
  function roomUp(sx, sy, ev) {
    const dr = G.drag;
    G.drag = null;
    if (!dr) return;
    const [px, py] = toRoom(sx, sy);
    if (dr.moved) {
      if (dr.kind === 'item') {
        const it = dr.hit.it;
        if (FURN[it.type].kind === 'small') snapSurface(it);
        A.sfx('pop'); G.markDirty();
      } else if (dr.kind === 'char') {
        const e = dr.hit.e; e.drag = false; e.expr = 'normal'; e.exprT = 0;
        const it = G.hover; G.hover = null;
        const f = RM.clampFloor(e.x, e.y); e.x = f[0]; e.y = f[1]; e.pose = 'stand'; A.sfx('pop');
        if (it) {
          const d = FURN[it.type];
          const type = d.seats ? 'sit' : d.beds ? 'sleep' : 'bath', slots = d.seats || d.beds || [d.tub], i = freeSlot(it, slots, type);
          if (i >= 0) { beginAct(e, { type, it, idx: i, dur: e.id === G.s.mainId ? Infinity : rand(10, 24) }); if (type === 'bath') A.sfx('splash'); }
        }
        G.markDirty();
      } else if (dr.kind === 'pet') {
        const r = petRt(dr.hit.p); r.drag = false; const f = RM.clampFloor(r.x, r.y); r.x = f[0]; r.y = f[1]; r.tx = r.x; r.ty = r.y; A.sfx('pop'); G.markDirty();
      }
      return;
    }
    const now = performance.now();
    const dbl = G._lastTap && now - G._lastTap.t < 340 && G._lastTap.hit === (dr.hit ? dr.hit.it || dr.hit.e || dr.hit.p : null);
    G._lastTap = { t: now, hit: dr.hit ? dr.hit.it || dr.hit.e || dr.hit.p : null };
    if (dr.kind === 'item') {
      const it = dr.hit.it, d = FURN[it.type];
      if (dbl && (d.seats || d.beds || d.tub || d.use || d.toggle)) { G.interact(G.main(), it); G.select(null); return; }
      G.select({ k: 'item', it }); A.sfx('click');
    } else if (dr.kind === 'char') { G.select({ k: 'char', e: dr.hit.e }); A.sfx('click'); }
    else if (dr.kind === 'pet') { G.select({ k: 'pet', p: dr.hit.p }); G.petPet(dr.hit.p); }
    else {
      if (G.sel) { G.select(null); }
      else if (py > RM.BY1) { const m = G.main(); if (inScene(m)) G.walkTo(m, px, py); }
    }
  }
  function pickMap(wx, wy) {
    for (const e of G.sceneEnts().sort((a, b) => b.y - a.y)) if (Math.abs(wx - e.x) < 26 && wy > e.y - 92 && wy < e.y + 8) return { k: 'char', e };
    const list = G.s.map.objs.slice().sort((a, b) => b.y - a.y);
    for (const o of list) {
      const d = OBJ[o.type];
      if (!d || wx < o.x - d.w / 2 || wx > o.x + d.w / 2 || wy < o.y - d.h || wy > o.y + 4) continue;
      const hit = pixelHit(wx, wy, o.x, o.y, o.flip ? -1 : 1, 1, (c) => d.draw(c, o, G.t, G.env));
      if (hit) return { k: 'obj', o };
    }
    return null;
  }
  function mapDown(ev, sx, sy) {
    const [wx, wy] = screenToWorld(sx, sy), hit = pickMap(wx, wy);
    const dr = (G.drag = { kind: 'none', hit, sx, sy, cx: G.cam.x, cy: G.cam.y, moved: false });
    if (ev.button === 2 || ev.button === 1 || G.keys[' ']) { dr.kind = 'pan'; return; }
    if (G.tool === 'terrain') { dr.kind = 'paint'; const tx = Math.floor(wx / T), ty = Math.floor(wy / T); paint(tx, ty, G.terrainId); A.sfx('click'); }
    else if (G.tool === 'erase') { dr.kind = 'erase'; if (hit && hit.k === 'obj') { if (hit.o.houseId) UI().confirmDeleteHouse(hit.o); else G.deleteObj(hit.o); dr.kind = 'none'; } else paint(Math.floor(wx / T), Math.floor(wy / T), 0); }
    else if (G.tool === 'object') {
      if (hit && hit.k === 'obj') { dr.kind = 'obj'; dr.ox = hit.o.x - wx; dr.oy = hit.o.y - wy; }
      else dr.kind = 'place';
    } else dr.kind = hit && hit.k === 'obj' ? 'tapobj' : 'pan';
  }
  function mapMove(sx, sy) {
    const dr = G.drag;
    const [wx, wy] = screenToWorld(sx, sy);
    if (G.tool === 'terrain') G.hoverTile = [Math.floor(wx / T), Math.floor(wy / T)];
    if (G.tool === 'object' && G.placeType && !dr) G.mapGhost = { type: G.placeType, x: Math.round(wx / 8) * 8, y: Math.round(wy / 8) * 8 }; else G.mapGhost = null;
    if (!dr) return;
    if (!dr.moved && Math.hypot(sx - dr.sx, sy - dr.sy) < 7) return;
    dr.moved = true;
    if (dr.kind === 'pan' || dr.kind === 'tapobj' || dr.kind === 'none') {
      G.cam.x = dr.cx - (sx - dr.sx) / G.cam.z; G.cam.y = dr.cy - (sy - dr.sy) / G.cam.z; clampCam();
    } else if (dr.kind === 'paint') paint(Math.floor(wx / T), Math.floor(wy / T), G.terrainId);
    else if (dr.kind === 'erase') paint(Math.floor(wx / T), Math.floor(wy / T), 0);
    else if (dr.kind === 'obj') {
      const o = dr.hit.o, mw = G.s.map.w * T, mh = G.s.map.h * T;
      o.x = clamp(Math.round((wx + dr.ox) / 8) * 8, 8, mw - 8); o.y = clamp(Math.round((wy + dr.oy) / 8) * 8, 8, mh - 2);
      G.select({ k: 'obj', o });
    }
  }
  function mapUp(sx, sy) {
    const dr = G.drag;
    G.drag = null;
    if (!dr) return;
    const [wx, wy] = screenToWorld(sx, sy);
    if (dr.kind === 'obj' && dr.moved) { G.block = W.buildBlock(G.s.map); A.sfx('pop'); G.markDirty(); return; }
    if (dr.moved) return;
    if (G.tool === 'object') {
      if (dr.kind === 'obj') { G.select({ k: 'obj', o: dr.hit.o }); A.sfx('click'); }
      else if (G.placeType) { const o = G.placeObj(G.placeType, wx, wy); if (o) G.select({ k: 'obj', o }); }
      else G.select(null);
      return;
    }
    if (G.tool !== 'walk') return;
    const hit = dr.hit, e = G.main();
    if (G.sel) G.select(null);
    if (hit && hit.k === 'char') { if (hit.e.id !== e.id) { G.say(hit.e, pick(LINES.hello)); setExpr(hit.e, 'happy'); } G.select({ k: 'char', e: hit.e }); A.sfx('click'); return; }
    if (hit && hit.k === 'obj') {
      const o = hit.o, d = OBJ[o.type];
      if (o.houseId) { G.walkTo(e, o.x, o.y + 22, () => G.enterHouse(o.houseId)); return; }
      if (d.letter) { G.walkTo(e, o.x, o.y + 24, () => UI().openMail()); return; }
      if (d.wish) { G.walkTo(e, o.x, o.y + 24, () => { A.sfx('sparkle'); burst('spark', o.x, o.y - 40, 8); G.say(e, pick(['希望明天也有好天气', '愿大家都开开心心', '想吃好多好多蛋糕', '愿小镇一直这么温柔'])); }); return; }
      if (d.text) { UI().openSign(o); return; }
    }
    G.walkTo(e, wx, wy);
  }
  function bindInput() {
    const cv = G.canvas, ptrs = new Map();
    let pinch = null;
    cv.addEventListener('contextmenu', (ev) => ev.preventDefault());
    cv.addEventListener('pointerdown', (ev) => {
      if (G.scene === 'none') return;
      A.init();
      try { cv.setPointerCapture(ev.pointerId); } catch (e) { /* 忽略 */ }
      ptrs.set(ev.pointerId, evPos(ev));
      if (ptrs.size === 2 && G.scene === 'map') {
        G.drag = null;
        const a = [...ptrs.values()];
        pinch = { d: Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]), z: G.cam.z, mx: (a[0][0] + a[1][0]) / 2, my: (a[0][1] + a[1][1]) / 2 };
        return;
      }
      const [sx, sy] = evPos(ev);
      if (G.scene === 'room') roomDown(ev, sx, sy); else mapDown(ev, sx, sy);
    });
    cv.addEventListener('pointermove', (ev) => {
      if (G.scene === 'none') return;
      if (ptrs.has(ev.pointerId)) ptrs.set(ev.pointerId, evPos(ev));
      if (pinch && ptrs.size === 2) {
        const a = [...ptrs.values()], d = Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]);
        G.zoom((pinch.z * (d / pinch.d)) / G.cam.z, pinch.mx, pinch.my);
        return;
      }
      const [sx, sy] = evPos(ev);
      if (G.scene === 'room') roomMove(sx, sy); else mapMove(sx, sy);
    });
    const up = (ev) => {
      ptrs.delete(ev.pointerId);
      if (pinch) { if (ptrs.size < 2) pinch = null; return; }
      if (G.scene === 'none') return;
      const [sx, sy] = evPos(ev);
      if (G.scene === 'room') roomUp(sx, sy, ev); else mapUp(sx, sy);
    };
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);
    cv.addEventListener('pointerleave', () => { G.hoverTile = null; G.mapGhost = null; });
    cv.addEventListener('wheel', (ev) => {
      if (G.scene !== 'map') return;
      ev.preventDefault();
      const [sx, sy] = evPos(ev);
      G.zoom(ev.deltaY < 0 ? 1.1 : 0.91, sx, sy);
    }, { passive: false });
    const typing = () => { const a = document.activeElement; return a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT'); };
    window.addEventListener('keydown', (ev) => {
      if (typing() || G.scene === 'none') return;
      const k = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].indexOf(k) >= 0) ev.preventDefault();
      G.keys[k] = true;
      if (k === 'Escape') G.select(null);
      const sel = G.sel;
      if ((k === 'Delete' || k === 'Backspace') && sel) { if (sel.k === 'item') G.deleteItem(sel.it); else if (sel.k === 'pet') G.removePet(sel.p); else if (sel.k === 'obj') UI().deleteObjSafe(sel.o); }
      if (k === 'r' && sel && (sel.k === 'item' || sel.k === 'obj')) { (sel.it || sel.o).flip = !(sel.it || sel.o).flip; G.markDirty(); }
    });
    window.addEventListener('keyup', (ev) => { const k = ev.key.length === 1 ? ev.key.toLowerCase() : ev.key; G.keys[k] = false; });
    window.addEventListener('blur', () => { G.keys = {}; });
    window.addEventListener('pagehide', () => { if (G.s && G.dirty) G.save(); });
    document.addEventListener('visibilitychange', () => { if (document.hidden && G.s && G.dirty) G.save(); });
  }
  // 目录拖入：从 UI 卡片拖到画布上
  G.ghostAt = function (type, cx, cy) {
    const r = G.canvas.getBoundingClientRect(), sx = cx - r.left, sy = cy - r.top;
    const [px, py] = toRoom(sx, sy), d = FURN[type];
    const inside = px > 0 && px < RM.W && py > 0 && py < RM.H;
    let x = px, y = py + (d.kind === 'floor' || d.kind === 'small' ? (d.h * 0.4) : 0);
    if (d.kind === 'wall') { const c = clampWall({ type, scale: 1 }, x, y); x = c[0]; y = c[1]; }
    else { const f = RM.clampFloor(x, y); x = f[0]; y = f[1]; }
    G.ghost = { type, x, y, inside };
  };
  G.ghostDrop = function () {
    const g = G.ghost;
    G.ghost = null;
    if (g && g.inside) { G.addItem(g.type, g.x, g.y); return true; }
    return false;
  };
  G.editCharDone = function (e) { G.markDirty(); burst('spark', e.x, e.y - 100, 12); };
  G.applyRoomStyle = function () { G.shellKey = null; G.markDirty(); };
  G.tileAtScreen = screenToWorld;
})(window.CT);
