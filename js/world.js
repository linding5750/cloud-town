/* 云朵小镇 · 世界数据：新游戏、默认小镇、房间模板、存档 */
'use strict';
(function (CT) {
  const W = (CT.World = {});
  const T = CT.TILE;
  W.SAVE_KEY = 'cloudtown_save_v1';

  // ---------- 房间几何（1280×720 逻辑坐标） ----------
  const RM = (CT.RM = { W: 1280, H: 720, BX0: 200, BX1: 1080, BY0: 70, BY1: 380, FX0: 40, FX1: 1240, FY1: 700, VY: -500 });
  RM.scale = (y) => (y - RM.VY) / (RM.FY1 - RM.VY);
  RM.xl = (y) => RM.BX0 - (y - RM.BY1) * 0.5;
  RM.xr = (y) => RM.BX1 + (y - RM.BY1) * 0.5;
  RM.BACK = RM.scale(RM.BY1);
  RM.clampFloor = function (x, y, m) {
    y = CT.clamp(y, RM.BY1 + 12, RM.FY1 - 6);
    x = CT.clamp(x, RM.xl(y) + (m || 14), RM.xr(y) - (m || 14));
    return [x, y];
  };

  W.WALLS = [['plain', '纯色'], ['stripe', '条纹'], ['dots', '波点'], ['flower', '小花'], ['heart', '爱心'], ['star', '星星'], ['check', '格纹'], ['wood', '木板'], ['brick', '白砖'], ['cloud', '云朵']];
  W.FLOORS = [['wood', '木地板'], ['tile', '瓷砖'], ['check', '棋盘格'], ['carpet', '绒地毯'], ['parquet', '人字拼']];
  W.WALL_COLORS = [['#fff1e6', '#ffd9c7'], ['#ffe3ea', '#ffc3d2'], ['#e3f4f8', '#bfe4ee'], ['#eef7df', '#d0e8b8'], ['#fff6cf', '#ffe59a'], ['#efe7fb', '#d5c6f2'], ['#fdf7ef', '#efe3d2'], ['#31406e', '#46588f']];
  W.FLOOR_COLORS = ['#dcae7c', '#b98352', '#f0d9b5', '#8a5a44', '#f4ece0', '#c9e4ec', '#f7cfd8', '#cfe6c4', '#d8cdec'];

  // ---------- 物品 ----------
  W.mkItem = function (type, x, y, o) {
    const d = CT.FURN[type];
    const it = { id: CT.uid(), type, x, y, color: d && d.colors ? d.colors[0] : null, flip: false, scale: 1, seed: CT.randi(1, 9999) };
    if (d && d.toggle) it.on = !!d.on;
    return Object.assign(it, o || {});
  };
  const I = W.mkItem;
  const room = (name, wallP, wc, floorP, fc, items, extra) => Object.assign({
    id: CT.uid(), name, wall: { p: wallP, c1: wc[0], c2: wc[1] }, floor: { p: floorP, c: fc }, dado: false, items, pets: [],
  }, extra || {});
  W.mkRoom = (name) => room(name || '新房间', 'plain', W.WALL_COLORS[0], 'wood', '#dcae7c', [I('windowA', 640, 196)]);
  function onTop(items, parent, type, ox, o) {
    const p = items.find((i) => i.type === parent), d = CT.FURN[parent], s = RM.scale(p.y) * (p.scale || 1);
    const it = I(type, p.x + (ox || 0) * s, p.y + 1, Object.assign({ elev: -d.surface.y * s, pid: p.id }, o || {}));
    items.push(it);
    return it;
  }
  const T_ROOMS = {
    living() {
      const it = [
        I('windowA', 640, 192, { color: '#ffb8c8' }), I('painting', 330, 196, { variant: 0 }), I('clock', 905, 150), I('stringLights', 640, 96, { color: '#ffe07a' }),
        I('rugRect', 640, 580, { color: '#ffc8d8' }), I('sofa', 640, 468), I('coffeeTable', 640, 612), I('floorLamp', 880, 462), I('monstera', 1010, 520),
        I('tv', 292, 500), I('bookshelf', 1000, 412, { scale: 0.9 }),
      ];
      onTop(it, 'coffeeTable', 'teapot', -36); onTop(it, 'coffeeTable', 'cupcake', 34);
      return room('客厅', 'stripe', ['#fff1e6', '#ffe3d2'], 'wood', '#dcae7c', it, { pets: [W.mkPet('cat', 480, 640)] });
    },
    bedroom() {
      const it = [
        I('windowArch', 870, 200, { color: '#fff4e6' }), I('photoFrame', 620, 180), I('garland', 400, 96, { color: '#ff8fb1' }),
        I('rugRound', 800, 590, { color: '#d9c8f4' }), I('bedSingle', 400, 660), I('nightstand', 600, 446), I('wardrobe', 1006, 440), I('vanity', 800, 430, { color: '#f4c2cc' }),
        I('teddy', 620, 640, { color: '#d9a877' }), I('flowerPot', 212, 420),
      ];
      return room('卧室', 'flower', ['#efe7fb', '#d5c6f2'], 'wood', '#f0d9b5', it);
    },
    kitchen() {
      const it = [
        I('windowA', 560, 190, { color: '#b9dba4' }), I('wallShelf', 880, 170), I('clock', 330, 150, { color: '#ffd59e' }),
        I('rugRect', 860, 592, { color: '#a8d8ea' }), I('fridge', 268, 440), I('stove', 416, 436), I('counter', 586, 436),
        I('chair', 780, 520, { color: '#d9a877' }), I('chair', 940, 520, { color: '#d9a877' }), I('diningTable', 860, 612, { color: '#ffd3df' }),
      ];
      onTop(it, 'diningTable', 'cake', 0); onTop(it, 'diningTable', 'vase', -74); onTop(it, 'counter', 'fruitBowl', 0);
      return room('厨房', 'check', ['#fdf7ef', '#e6f2ec'], 'tile', '#f4ece0', it);
    },
    bath() {
      const it = [
        I('windowRound', 330, 180, { color: '#fff4e6' }), I('towelRack', 640, 212), I('wallPlant', 960, 172),
        I('bathtub', 470, 610), I('sinkMirror', 860, 440, { color: '#bfe6e0' }), I('rugCloud', 860, 600, { color: '#dff1fb' }), I('duck', 820, 650), I('cactus', 1000, 450, { color: '#a8d8ea' }),
      ];
      return room('浴室', 'wood', ['#e3f4f8', '#cfeaf2'], 'check', '#c9e4ec', it);
    },
    bakery() {
      const it = [
        I('windowArch', 340, 200, { color: '#fff4e6' }), I('windowArch', 940, 200, { color: '#fff4e6' }), I('garland', 640, 92, { color: '#ff8fb1' }), I('corkBoard', 640, 200),
        I('rugHeart', 640, 610, { color: '#ffc8d8' }), I('counter', 260, 440, { color: '#f7c3cf' }), I('stove', 420, 436, { color: '#f7c3cf' }), I('cabinet', 860, 450, { color: '#f4c2cc' }),
        I('chair', 560, 530, { color: '#f4c2cc' }), I('chair', 720, 530, { color: '#f4c2cc' }), I('diningTable', 640, 624, { color: '#ffe9b8' }),
      ];
      onTop(it, 'diningTable', 'cake', -40, { color: '#ffd3df' }); onTop(it, 'diningTable', 'cupcake', 32); onTop(it, 'cabinet', 'pudding', -44); onTop(it, 'cabinet', 'cookies', 26);
      return room('店面', 'stripe', ['#ffe3ea', '#fff4f6'], 'check', '#f7cfd8', it);
    },
    flower() {
      const it = [
        I('windowA', 640, 192, { color: '#b9dba4' }), I('wallPlant', 300, 170), I('wallPlant', 980, 170, { color: '#fffdf8' }),
        I('counter', 640, 450, { color: '#d9a877' }), I('monstera', 232, 470), I('monstera', 1060, 500, { color: '#a8d8ea' }),
      ];
      [[300, 620, 0], [410, 650, 1], [520, 660, 2], [760, 660, 3], [870, 650, 4], [980, 620, 5], [340, 500, 2], [940, 500, 3]].forEach((p) => it.push(I('flowerPot', p[0], p[1], { color: CT.FURN.flowerPot.colors[p[2]] })));
      onTop(it, 'counter', 'vase', -10);
      return room('花房', 'flower', ['#eef7df', '#d0e8b8'], 'tile', '#cfe6c4', it);
    },
    cafe() {
      const it = [
        I('windowA', 400, 190, { color: '#ffe29a' }), I('painting', 760, 196, { variant: 3, color: '#8a5a44' }), I('pendant', 640, 120, { color: '#ffe29a' }), I('stringLights', 960, 96, { color: '#ffe07a' }),
        I('rugRound', 640, 600, { color: '#ffe9a8' }), I('piano', 980, 450, { color: '#4a3a44' }), I('recordPlayer', 240, 470, { color: '#b98352' }), I('bookshelf', 1094, 430, { color: '#8a5a44', scale: 0.8 }),
        I('armchair', 440, 540, { color: '#c9b8f0' }), I('coffeeTable', 640, 620, { color: '#b98352' }), I('armchair', 840, 540, { color: '#c9b8f0' }),
      ];
      onTop(it, 'coffeeTable', 'mug', -30); onTop(it, 'coffeeTable', 'bookStack', 40);
      return room('大厅', 'brick', ['#f4e6dc', '#e4cfc0'], 'parquet', '#b98352', it);
    },
    cozy() {
      const it = [
        I('windowRound', 900, 190, { color: '#d9a877' }), I('painting', 360, 190, { variant: 2 }), I('wallLamp', 640, 200, { color: '#ffe29a' }),
        I('rugCloud', 760, 590, { color: '#fffdf8' }), I('bedSingle', 380, 660, { color: '#a8d8ea' }), I('beanbag', 800, 520, { color: '#ffd59e' }), I('bookshelf', 1020, 430), I('desk', 640, 446), I('teddy', 960, 640, { color: '#f7c3cf' }),
      ];
      return room('小屋', 'dots', ['#fff6cf', '#ffe59a'], 'wood', '#dcae7c', it);
    },
    star() {
      const it = [
        I('windowRound', 640, 190, { color: '#fff4e6' }), I('windowRound', 400, 220, { color: '#fff4e6', scale: 0.7 }), I('windowRound', 880, 220, { color: '#fff4e6', scale: 0.7 }), I('stringLights', 640, 92, { color: '#ffe07a' }),
        I('rugRound', 640, 590, { color: '#d9c8f4' }), I('telescope', 640, 480), I('bedSingle', 300, 660, { color: '#c9b8f0' }), I('globe', 900, 460), I('bookshelf', 1020, 430, { color: '#8a5a44' }), I('beanbag', 900, 610, { color: '#c9b8f0' }),
      ];
      return room('观星室', 'star', ['#31406e', '#46588f'], 'carpet', '#d8cdec', it);
    },
  };
  W.mkPet = (kind, x, y, color) => ({ id: CT.uid(), kind, x, y, color: color || CT.PETS[kind].colors[0] });
  const HOUSE_ROOMS = {
    h_cottage: ['living', 'bedroom', 'kitchen', 'bath'], h_mushroom: ['cozy', 'kitchen'], h_candy: ['cozy', 'kitchen'], h_bakery: ['bakery', 'bedroom'],
    h_flower: ['flower', 'cozy'], h_cafe: ['cafe', 'kitchen'], h_tower: ['star', 'bedroom'],
  };
  W.mkHouse = function (style, name, owner) {
    return { id: 'h' + CT.uid(), style, name, owner: owner || null, rooms: (HOUSE_ROOMS[style] || ['cozy']).map((k) => T_ROOMS[k]()) };
  };

  // ---------- 小镇 ----------
  function setT(m, x, y, id) { if (x >= 0 && y >= 0 && x < m.w && y < m.h) m.t[y * m.w + x] = id; }
  const getT = (m, x, y) => (x >= 0 && y >= 0 && x < m.w && y < m.h ? m.t[y * m.w + x] : -1);
  function blob(m, cx, cy, rx, ry, id, rnd, only) {
    for (let y = Math.floor(cy - ry - 2); y <= cy + ry + 2; y++) {
      for (let x = Math.floor(cx - rx - 2); x <= cx + rx + 2; x++) {
        const nx = (x - cx) / rx, ny = (y - cy) / ry, d = nx * nx + ny * ny + (CT.hash(x, y, Math.floor(rnd() * 3) + id) - 0.5) * 0.28;
        if (d < 1 && (only === undefined || getT(m, x, y) === only)) setT(m, x, y, id);
      }
    }
  }
  function pathLine(m, x0, y0, x1, y1, id) {
    let x = x0, y = y0;
    const put = () => { const c = getT(m, x, y); if (c === 5) setT(m, x, y, 6); else if (c !== 3 && c !== 6) setT(m, x, y, id); };
    while (x !== x1) { put(); x += Math.sign(x1 - x); }
    while (y !== y1) { put(); y += Math.sign(y1 - y); }
    put();
  }
  function mkObj(type, x, y, o) {
    const d = CT.MAPOBJ[type];
    return Object.assign({ id: CT.uid(), type, x, y, color: d.colors ? d.colors[0] : null, flip: false, seed: CT.randi(1, 9999) }, o || {});
  }
  W.mkObj = mkObj;
  W.tileCenter = (tx, ty) => [tx * T + T / 2, ty * T + T - 6];
  W.footTiles = function (o) {
    const d = CT.MAPOBJ[o.type], bw = d.blockW || 1, bh = d.blockH || 1;
    const tx = Math.floor(o.x / T), ty = Math.floor((o.y - 1) / T), out = [];
    const x0 = tx - Math.floor((bw - 1) / 2) - (bw % 2 === 0 ? 0 : 0);
    for (let j = 0; j < bh; j++) for (let i = 0; i < bw; i++) out.push([x0 + i, ty - j]);
    return out;
  };
  W.buildBlock = function (m) {
    const b = new Uint8Array(m.w * m.h);
    for (let i = 0; i < b.length; i++) if (m.t[i] === 5) b[i] = 1;
    for (const o of m.objs) {
      const d = CT.MAPOBJ[o.type];
      if (!d || d.flat || d.noBlock || d.water) continue;
      for (const f of W.footTiles(o)) if (f[0] >= 0 && f[1] >= 0 && f[0] < m.w && f[1] < m.h) b[f[1] * m.w + f[0]] = 1;
    }
    return b;
  };
  W.genTown = function (seed, w, h, houseList) {
    const rnd = CT.seeded(seed), m = { w, h, t: new Array(w * h).fill(0), objs: [] };
    const occupied = new Set();
    const hold = (x, y) => occupied.add(x + ',' + y);
    const free = (x, y) => !occupied.has(x + ',' + y);
    // 湖与沙滩
    const lx = Math.floor(w * 0.76), ly = Math.floor(h * 0.68), lrx = Math.max(3.4, w * 0.15), lry = Math.max(2.6, h * 0.17);
    blob(m, lx, ly, lrx + 1.4, lry + 1.3, 4, rnd);
    blob(m, lx, ly, lrx, lry, 5, rnd);
    // 广场
    const px = Math.floor(w * 0.45), py = Math.floor(h * 0.45);
    blob(m, px, py, 3.3, 2.5, 3, rnd);
    // 房子位置：左上、右上、左下、下中、右上外
    const slots = [[Math.floor(w * 0.22), Math.floor(h * 0.3)], [Math.floor(w * 0.68), Math.floor(h * 0.24)], [Math.floor(w * 0.18), Math.floor(h * 0.74)], [Math.floor(w * 0.46), Math.floor(h * 0.8)], [Math.floor(w * 0.88), Math.floor(h * 0.3)], [Math.floor(w * 0.44), Math.floor(h * 0.18)]];
    houseList.forEach((hs, i) => {
      // 自己盖的房子多于预留位置时，找一块空地放下，一座都不丢
      let s = slots[i];
      for (let tries = 0; !s && tries < 60; tries++) {
        const cx = 3 + Math.floor(rnd() * (w - 6)), cy = 3 + Math.floor(rnd() * (h - 6));
        let ok = true;
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (!free(cx + dx, cy + dy) || getT(m, cx + dx, cy + dy) === 5) ok = false;
        if (ok) s = [cx, cy];
      }
      if (!s) s = [3 + (i % (w - 6)), 3];
      const tx = s[0] + Math.floor(rnd() * 3) - 1, ty = s[1];
      const [ox, oy] = [tx * T + T / 2, (ty + 1) * T - 2];
      const o = mkObj(hs.style, ox, oy, { houseId: hs.id, color: hs.color || CT.MAPOBJ[hs.style].colors[0] });
      m.objs.push(o);
      for (const f of W.footTiles(o)) hold(f[0], f[1]);
      pathLine(m, tx, ty + 1, px, py, 2);
      hs.door = [tx, ty + 1];
    });
    // 花草地与郁金香田
    for (let i = 0; i < 6; i++) blob(m, 2 + rnd() * (w - 4), 2 + rnd() * (h - 4), 2 + rnd() * 2.6, 1.6 + rnd() * 2, 1, rnd, 0);
    const fx = Math.floor(w * 0.08), fy = Math.floor(h * 0.42);
    for (let y = fy; y < fy + 3; y++) for (let x = fx; x < fx + 4; x++) if (getT(m, x, y) === 0 || getT(m, x, y) === 1) setT(m, x, y, 7);
    // 广场设施
    const put = (type, tx, ty, o) => {
      if (tx < 0 || ty < 0 || tx >= w || ty >= h) return null;
      const d = CT.MAPOBJ[type];
      const [x, y] = W.tileCenter(tx, ty);
      const ob = mkObj(type, x, y, Object.assign(d.colors ? { color: d.colors[Math.floor(rnd() * d.colors.length)] } : {}, o || {}));
      m.objs.push(ob); for (const f of W.footTiles(ob)) hold(f[0], f[1]);
      return ob;
    };
    put('fountain', px, py);
    for (const [dx, dy] of [[-4, -3], [4, -3], [-4, 3], [4, 3]]) put('lamp', px + dx, py + dy);
    put('bench', px - 2, py - 3); put('bench', px + 2, py - 3); put('mailbox', px - 5, py); put('sign', px + 5, py, { text: '云朵小镇' });
    put('well', px + 7, py + 3); put('arch', px, py - 4);
    const treeTypes = ['tree_round', 'tree_round', 'tree_sakura', 'tree_pine', 'tree_apple', 'tree_maple'];
    // 外缘一圈树
    for (let i = 0; i < w * h * 0.1; i++) {
      const edge = rnd() < 0.72;
      let tx, ty;
      if (edge) {
        const side = Math.floor(rnd() * 4);
        tx = side < 2 ? Math.floor(rnd() * w) : side === 2 ? Math.floor(rnd() * 3) : w - 1 - Math.floor(rnd() * 3);
        ty = side === 0 ? Math.floor(rnd() * 3) : side === 1 ? h - 1 - Math.floor(rnd() * 3) : Math.floor(rnd() * h);
      } else { tx = Math.floor(rnd() * w); ty = Math.floor(rnd() * h); }
      const tl = getT(m, tx, ty);
      if ((tl === 0 || tl === 1) && free(tx, ty)) put(treeTypes[Math.floor(rnd() * treeTypes.length)], tx, ty);
    }
    const small = ['bush', 'flowerbush', 'flowerbush', 'sunflower', 'mushroom', 'rock', 'stump'];
    for (let i = 0; i < w * h * 0.07; i++) {
      const tx = Math.floor(rnd() * w), ty = Math.floor(rnd() * h), tl = getT(m, tx, ty);
      if ((tl === 0 || tl === 1) && free(tx, ty)) put(small[Math.floor(rnd() * small.length)], tx, ty);
    }
    const spots = [['windmill', Math.floor(w * 0.1), Math.floor(h * 0.36)], ['campfire', Math.floor(w * 0.62), Math.floor(h * 0.86)], ['picnic', Math.floor(w * 0.56), Math.floor(h * 0.58)], ['swing', Math.floor(w * 0.3), Math.floor(h * 0.56)], ['tent', Math.floor(w * 0.9), Math.floor(h * 0.12)]];
    for (const s of spots) if ([0, 1, 4].indexOf(getT(m, s[1], s[2])) >= 0 && free(s[1], s[2])) put(s[0], s[1], s[2]);
    for (let i = 0; i < 5; i++) {
      const tx = Math.floor(lx - lrx + rnd() * lrx * 2), ty = Math.floor(ly - lry + rnd() * lry * 2);
      if (getT(m, tx, ty) === 5 && free(tx, ty)) put(i % 2 ? 'lily' : 'duck', tx, ty);
    }
    return m;
  };

  // ---------- 新游戏 ----------
  W.newGame = function (mainId, customChars, townName) {
    const chars = {};
    CT.PRESETS.forEach((p) => { chars[p.id] = JSON.parse(JSON.stringify(p)); chars[p.id].preset = true; });
    (customChars || []).forEach((c) => { chars[c.id] = c; });
    const main = chars[mainId];
    const home = W.mkHouse('h_cottage', main.name + '的家', mainId);
    const list = [
      Object.assign(home, { color: '#f78ea4' }),
      Object.assign(W.mkHouse('h_bakery', '小桃甜品屋', 'p_tao'), { color: '#f78ea4' }),
      Object.assign(W.mkHouse('h_flower', '柚子花店', 'p_you'), { color: '#7cc6a4' }),
      Object.assign(W.mkHouse('h_cafe', '墨香咖啡馆', 'p_mo'), { color: '#a8724e' }),
      Object.assign(W.mkHouse('h_tower', '月月的星星塔', 'p_yue'), { color: '#8f8ce8' }),
      Object.assign(W.mkHouse('h_mushroom', '栗子的蘑菇屋', 'p_li'), { color: '#f4626a' }),
    ];
    const map = W.genTown(CT.randi(1, 1e8), 36, 24, list);
    const houses = {};
    list.forEach((h) => { houses[h.id] = h; });
    const s = {
      v: 1, ts: Date.now(), townName: townName || '云朵小镇', day: 1, hour: 8.5, timeFlow: true, weather: 'sun', weatherAuto: true,
      mainId, chars, houses, homeId: home.id, map,
      wishes: null, stickers: [], diary: [],
      mail: { from: mainId === 'p_tao' ? 'p_yue' : 'p_tao', text: '欢迎搬来' + (townName || '云朵小镇') + '！大家都很期待见到你。我在你家客厅放了一份乔迁礼物，记得拆开看看。', gift: true },
    };
    // 邻居们的落脚处
    const place = (id, hid) => {
      const c = chars[id]; if (!c || id === mainId) return;
      const h = houses[hid]; c.loc = { k: 'room', h: hid, r: h.rooms[0].id }; c.x = CT.rand(420, 860); c.y = CT.rand(520, 660);
    };
    list.forEach((h) => { if (h.owner && h.owner !== mainId && h !== home) place(h.owner, h.id); });
    Object.values(chars).forEach((c) => {
      if (c.id === mainId) { c.loc = { k: 'room', h: home.id, r: home.rooms[0].id }; c.x = 560; c.y = 640; }
      else if (!c.loc) {
        const d = home.door, o = CT.pick(map.objs.filter((b) => b.type === 'fountain'));
        c.loc = { k: 'map' }; c.x = (o ? o.x : d[0] * T) + CT.rand(-90, 90); c.y = (o ? o.y : d[1] * T) + CT.rand(50, 90);
      }
    });
    return s;
  };

  // ---------- 存档 ----------
  const B36 = '0123456789abcdefghijklmnopqrstuvwxyz';
  W.serialize = function (s) {
    const o = Object.assign({}, s, { ts: Date.now() });
    o.map = Object.assign({}, s.map, { t: s.map.t.map((n) => B36[n]).join('') });
    return JSON.stringify(o);
  };
  W.deserialize = function (json) {
    const o = typeof json === 'string' ? JSON.parse(json) : json;
    if (!o || !o.map || !o.chars || !o.houses) throw new Error('存档内容不完整');
    if (typeof o.map.t === 'string') o.map.t = o.map.t.split('').map((ch) => B36.indexOf(ch));
    return o;
  };
  W.saveLocal = function (json) {
    try { localStorage.setItem(W.SAVE_KEY, json); return true; } catch (e) { return false; }
  };
  W.loadLocal = function () {
    try { const v = localStorage.getItem(W.SAVE_KEY); return v ? W.deserialize(v) : null; } catch (e) { return null; }
  };
  W.clearLocal = function () { try { localStorage.removeItem(W.SAVE_KEY); } catch (e) { /* 忽略 */ } };

  // 发布成网页后，存档再多存一份到每位玩家私有的云端文档；本地打开时这段不会启用
  const Cloud = (W.Cloud = { ref: null, busy: false, pending: null, off: false });
  Cloud.init = async function () {
    try {
      if (!window.claude || !window.claude.use) return null;
      const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
      if (!db || !user) return null;
      const uid = await user.id();
      if (!uid) return null;
      Cloud.ref = db.doc('data/users/' + uid + '/save');
      const snap = await Cloud.ref.get();
      if (snap.exists) { const d = snap.data(); if (d && d.data) return { ts: d.ts || 0, data: d.data }; }
    } catch (e) { /* 读不到云端就只用本地存档 */ }
    return null;
  };
  Cloud.save = async function (json, ts) {
    if (!Cloud.ref || Cloud.off) return;
    if (json.length > 240000) return;
    if (Cloud.busy) { Cloud.pending = [json, ts]; return; }
    Cloud.busy = true;
    try { await Cloud.ref.set({ ts, data: json }); } catch (e) { if (!e || e.code !== 'unavailable') Cloud.off = true; }
    Cloud.busy = false;
    if (Cloud.pending) { const p = Cloud.pending; Cloud.pending = null; Cloud.save(p[0], p[1]); }
  };
  Cloud.clear = async function () { if (Cloud.ref) { try { await Cloud.ref.delete(); } catch (e) { /* 忽略 */ } } };
})(window.CT);
