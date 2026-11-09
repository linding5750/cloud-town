/* 云朵小镇 · 小镇地图：地形自动圆角拼接，树木房屋等都是实时绘制 */
'use strict';
(function (CT) {
  const sh = CT.shade, ell = CT.ell, rr = CT.rr, fs = CT.fs, line = CT.line, mix = CT.mix, lg = CT.lg;
  const INK = '#5a3448';
  const ol = (c, k) => mix(c, INK, k == null ? 0.4 : k);
  const box = (c, x, y, w, h, r, f, lw) => { rr(c, x, y, w, h, r); fs(c, f, ol(f), lw == null ? 1.8 : lw); };
  const oval = (c, x, y, rx, ry, f, lw) => { ell(c, x, y, rx, ry); fs(c, f, ol(f), lw == null ? 1.8 : lw); };
  const poly = (c, pts, f, lw) => {
    c.beginPath(); c.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
    c.closePath(); fs(c, f, ol(f), lw == null ? 1.8 : lw);
  };
  const T = (CT.TILE = 48);
  CT.TERRAIN = [
    { id: 0, name: '草地', c: '#a8e096' }, { id: 1, name: '花草地', c: '#b8e89a' }, { id: 2, name: '泥土小路', c: '#ecd2a2' },
    { id: 3, name: '石板路', c: '#dcd8d6' }, { id: 4, name: '沙滩', c: '#f8e6b4' }, { id: 5, name: '湖水', c: '#86d8ec' },
    { id: 6, name: '木桥', c: '#c89a68' }, { id: 7, name: '郁金香田', c: '#c8a07a' }, { id: 8, name: '雪地', c: '#f2f8fd' },
  ];
  CT.isWater = (id) => id === 5;

  function blobPath(m, id) {
    const p = new Path2D(), R = 15;
    const tile = (x, y) => m.t[y * m.w + x];
    const same = (x, y) => (x < 0 || y < 0 || x >= m.w || y >= m.h ? true : tile(x, y) === id);
    for (let y = 0; y < m.h; y++) {
      for (let x = 0; x < m.w; x++) {
        if (tile(x, y) !== id) continue;
        const px = x * T, py = y * T;
        const tl = !same(x - 1, y) && !same(x, y - 1) ? R : 0, tr = !same(x + 1, y) && !same(x, y - 1) ? R : 0;
        const br = !same(x + 1, y) && !same(x, y + 1) ? R : 0, bl = !same(x - 1, y) && !same(x, y + 1) ? R : 0;
        p.moveTo(px + tl, py);
        p.lineTo(px + T - tr, py); if (tr) p.arcTo(px + T, py, px + T, py + tr, tr);
        p.lineTo(px + T, py + T - br); if (br) p.arcTo(px + T, py + T, px + T - br, py + T, br);
        p.lineTo(px + bl, py + T); if (bl) p.arcTo(px, py + T, px, py + T - bl, bl);
        p.lineTo(px, py + tl); if (tl) p.arcTo(px, py, px + tl, py, tl);
        p.closePath();
        for (const sx of [-1, 1]) {
          for (const sy of [-1, 1]) {
            if (same(x + sx, y) && same(x, y + sy) && !same(x + sx, y + sy)) {
              const cx = (x + (sx > 0 ? 1 : 0)) * T, cy = (y + (sy > 0 ? 1 : 0)) * T;
              const a0 = sy > 0 ? -Math.PI / 2 : Math.PI / 2, a1 = sx > 0 ? Math.PI : 0;
              p.moveTo(cx, cy); p.lineTo(cx + sx * R, cy);
              p.arc(cx + sx * R, cy + sy * R, R, a0, a1, sx * sy > 0);
              p.closePath();
            }
          }
        }
      }
    }
    return p;
  }
  function eachTile(m, id, fn) {
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (m.t[y * m.w + x] === id) fn(x, y, x * T, y * T);
  }
  CT.renderTerrain = function (m, k, cv) {
    const W = m.w * T, H = m.h * T;
    cv = cv || document.createElement('canvas');
    const pw = Math.ceil(W * k), ph = Math.ceil(H * k);
    if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
    const c = cv.getContext('2d');
    c.setTransform(k, 0, 0, k, 0, 0);
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.fillStyle = '#a8e096'; c.fillRect(0, 0, W, H);
    for (let y = 0; y < m.h; y++) {
      for (let x = 0; x < m.w; x++) {
        const px = x * T, py = y * T;
        if (CT.hash(x, y, 1) < 0.45) { ell(c, px + CT.hash(x, y, 2) * T, py + CT.hash(x, y, 3) * T, 18, 11); fs(c, 'rgba(198,240,170,0.5)'); }
        c.strokeStyle = 'rgba(112,186,110,0.6)'; c.lineWidth = 1.5; c.beginPath();
        for (let i = 0; i < 4; i++) {
          const tx = px + CT.hash(x, y, 10 + i) * T, ty = py + CT.hash(x, y, 20 + i) * T;
          c.moveTo(tx - 3, ty); c.lineTo(tx - 1, ty - 5); c.moveTo(tx + 2, ty); c.lineTo(tx + 2, ty - 6);
        }
        c.stroke();
      }
    }
    const layer = (id, edge, ew, fill, deco) => {
      const p = blobPath(m, id);
      if (edge) { c.strokeStyle = edge; c.lineWidth = ew; c.stroke(p); }
      c.fillStyle = fill; c.fill(p);
      if (deco) { c.save(); c.clip(p); deco(); c.restore(); }
    };
    layer(4, '#efd9a0', 5, '#f8e6b4', () => {
      c.fillStyle = 'rgba(200,160,100,0.35)';
      eachTile(m, 4, (x, y, px, py) => { for (let i = 0; i < 7; i++) { ell(c, px + CT.hash(x, y, 30 + i) * T, py + CT.hash(x, y, 40 + i) * T, 1.2, 1); c.fill(); } });
    });
    layer(2, '#dcbd8a', 5, '#ecd2a2', () => {
      eachTile(m, 2, (x, y, px, py) => {
        for (let i = 0; i < 3; i++) { ell(c, px + CT.hash(x, y, 50 + i) * T, py + CT.hash(x, y, 60 + i) * T, 3 + CT.hash(x, y, 70 + i) * 3, 2 + CT.hash(x, y, 72 + i) * 1.6); fs(c, 'rgba(190,150,100,0.34)'); }
      });
    });
    layer(3, '#bfb9b6', 5, '#dcd8d6', () => {
      eachTile(m, 3, (x, y, px, py) => {
        const off = (x + y) % 2 ? 0 : 8;
        for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
          rr(c, px + 2 + i * 23 - (j % 2 ? off : 0), py + 2 + j * 23, 21, 21, 6);
          fs(c, mix('#ece8e4', '#d4cec8', CT.hash(x + i, y + j, 5)), 'rgba(160,150,146,0.5)', 1);
        }
      });
    });
    layer(1, null, 0, '#bcea9e', () => {
      const cols = ['#fffdf8', '#ffd35c', '#ff9fc0', '#b8a4f0'];
      eachTile(m, 1, (x, y, px, py) => {
        for (let i = 0; i < 6; i++) {
          const fx = px + CT.hash(x, y, 80 + i) * T, fy = py + CT.hash(x, y, 90 + i) * T, col = cols[Math.floor(CT.hash(x, y, 95 + i) * 4)];
          for (let p = 0; p < 4; p++) { ell(c, fx + Math.cos(p * 1.57) * 2.4, fy + Math.sin(p * 1.57) * 2.4, 2, 2); fs(c, col); }
          ell(c, fx, fy, 1.3, 1.3); fs(c, '#ffb35c');
        }
      });
    });
    layer(7, '#a8805c', 5, '#c8a07a', () => {
      const cols = ['#ff7a8a', '#ffd35c', '#ff9fc0', '#fffdf8', '#b8a4f0'];
      eachTile(m, 7, (x, y, px, py) => {
        for (let j = 0; j < 3; j++) {
          line(c, px, py + 10 + j * 16, px + T, py + 10 + j * 16, '#a8805c', 2);
          for (let i = 0; i < 3; i++) {
            const fx = px + 8 + i * 16, fy = py + 12 + j * 16, col = cols[Math.floor(CT.hash(x + i, y + j, 7) * 5)];
            line(c, fx, fy, fx, fy - 7, '#5cab6c', 2);
            c.beginPath(); c.moveTo(fx - 4.4, fy - 8); c.lineTo(fx - 4.4, fy - 13.5); c.lineTo(fx - 1.6, fy - 11); c.lineTo(fx, fy - 14); c.lineTo(fx + 1.6, fy - 11); c.lineTo(fx + 4.4, fy - 13.5); c.lineTo(fx + 4.4, fy - 8); c.quadraticCurveTo(fx, fy - 4, fx - 4.4, fy - 8); c.closePath();
            fs(c, col);
          }
        }
      });
    });
    layer(8, '#d4e6f4', 5, '#f2f8fd', () => {
      c.fillStyle = '#d8e8f6';
      eachTile(m, 8, (x, y, px, py) => { for (let i = 0; i < 3; i++) { ell(c, px + CT.hash(x, y, 100 + i) * T, py + CT.hash(x, y, 110 + i) * T, 8, 3); c.fill(); } });
    });
    layer(5, '#ffffff', 7, '#86d8ec', () => {
      c.fillStyle = 'rgba(70,178,214,0.28)';
      eachTile(m, 5, (x, y, px, py) => { ell(c, px + CT.hash(x, y, 120) * T, py + CT.hash(x, y, 121) * T, 24, 13); c.fill(); });
    });
    // 木桥
    eachTile(m, 6, (x, y, px, py) => {
      const vert = (y > 0 && [5, 6].indexOf(m.t[(y - 1) * m.w + x]) < 0) || (y < m.h - 1 && [5, 6].indexOf(m.t[(y + 1) * m.w + x]) < 0);
      c.fillStyle = '#86d8ec'; c.fillRect(px, py, T, T);
      c.save(); c.translate(px + T / 2, py + T / 2); if (vert) c.rotate(Math.PI / 2);
      for (let i = 0; i < 6; i++) { rr(c, -T / 2 + i * 8 + 0.3, -T / 2 + 5, 7.4, T - 10, 2); fs(c, mix('#d4a878', '#b98352', CT.hash(x, y, i)), '#8a5a44', 1); }
      line(c, -T / 2, -T / 2 + 5, T / 2, -T / 2 + 5, '#8a5a44', 3.4); line(c, -T / 2, T / 2 - 5, T / 2, T / 2 - 5, '#8a5a44', 3.4);
      c.restore();
    });
    return cv;
  };
  CT.terrainThumb = function (cv, id) {
    const m = { w: 3, h: 3, t: new Array(9).fill(id) };
    const tmp = document.createElement('canvas');
    CT.renderTerrain(m, 1, tmp);
    const c = cv.getContext('2d');
    c.clearRect(0, 0, cv.width, cv.height);
    c.drawImage(tmp, T * 0.5, T * 0.5, T * 2, T * 2, 0, 0, cv.width, cv.height);
  };

  // ---------- 物件 ----------
  const O = (CT.MAPOBJ = {});
  const def = (id, o) => { o.id = id; O[id] = o; };
  CT.MAP_CATS = [['tree', '树木'], ['plant', '花草'], ['deco', '设施'], ['house', '房子']];
  function crown(c, blobs, col, hi) {
    for (const b of blobs) { ell(c, b[0], b[1], b[2], b[3] || b[2]); fs(c, col, ol(col, 0.36), 2); }
    for (const b of blobs) { ell(c, b[0], b[1], b[2] - 0.6, (b[3] || b[2]) - 0.6); fs(c, col); }
    for (const b of blobs) { ell(c, b[0] - b[2] * 0.26, b[1] - b[2] * 0.3, b[2] * 0.42, b[2] * 0.28, -0.4); fs(c, hi); }
  }
  function trunk(c, h, w) {
    c.beginPath(); c.moveTo(-w / 2 - 3, 0); c.quadraticCurveTo(-w / 2, -h * 0.5, -w / 2 + 1, -h); c.lineTo(w / 2 - 1, -h); c.quadraticCurveTo(w / 2, -h * 0.5, w / 2 + 3, 0); c.closePath();
    fs(c, '#a8724e', '#7a5040', 1.8);
  }
  const swayT = (c, o, t, k) => { c.rotate(Math.sin(t * 0.9 + (o.seed || 0)) * (k || 0.012)); };
  def('tree_round', { name: '圆圆树', cat: 'tree', w: 104, h: 136, colors: ['#7ccb80', '#96d68a', '#62bda0'],
    draw(c, o, t) { trunk(c, 58, 18); swayT(c, o, t); const k = o.color; crown(c, [[-24, -78, 34], [24, -80, 33], [0, -108, 38], [0, -74, 34]], k, sh(k, 0.3)); } });
  def('tree_pine', { name: '松树', cat: 'tree', w: 96, h: 150, colors: ['#5cab8c', '#6cc08c', '#4f9a9a'],
    draw(c, o, t) {
      trunk(c, 34, 16); swayT(c, o, t, 0.008); const k = o.color;
      [[-30, 48, 70], [-64, 40, 62], [-96, 31, 54]].forEach((l, i) => poly(c, [0, l[0] - l[2], l[1], l[0], 0, l[0] + 7, -l[1], l[0]], sh(k, i * 0.08), 2));
    } });
  def('tree_sakura', { name: '樱花树', cat: 'tree', w: 120, h: 140, colors: ['#ffb7ce', '#ffd0e0', '#f7a8c4'],
    draw(c, o, t) {
      trunk(c, 58, 16); swayT(c, o, t); const k = o.color;
      crown(c, [[-30, -78, 36], [30, -80, 35], [0, -110, 40], [0, -76, 36]], k, sh(k, 0.5));
      c.fillStyle = sh(k, -0.14);
      for (let i = 0; i < 16; i++) { ell(c, -54 + CT.hash(i, 1, 9) * 108, -130 + CT.hash(i, 2, 9) * 80, 2.2, 1.7); c.fill(); }
    } });
  def('tree_apple', { name: '苹果树', cat: 'tree', w: 108, h: 136, colors: ['#7ccb80', '#8cd27c'],
    draw(c, o, t) {
      trunk(c, 56, 18); swayT(c, o, t); const k = o.color;
      crown(c, [[-26, -78, 34], [26, -80, 33], [0, -108, 37], [0, -74, 34]], k, sh(k, 0.3));
      for (const a of [[-30, -72], [22, -66], [-8, -96], [32, -94], [4, -60], [-22, -106]]) { oval(c, a[0], a[1], 6.4, 6.4, '#f4626a', 1.3); ell(c, a[0] - 2, a[1] - 2, 1.8, 1.4); fs(c, 'rgba(255,255,255,0.6)'); }
    } });
  def('tree_maple', { name: '枫树', cat: 'tree', w: 108, h: 138, colors: ['#ffa64d', '#f4784a', '#ffc84d'],
    draw(c, o, t) { trunk(c, 58, 16); swayT(c, o, t); const k = o.color; crown(c, [[-26, -78, 33], [26, -80, 32], [0, -108, 37], [0, -74, 33]], k, sh(k, 0.34)); } });
  def('tree_palm', { name: '椰子树', cat: 'tree', w: 118, h: 150, colors: ['#74c47c', '#58b88c'],
    draw(c, o, t) {
      c.beginPath(); c.moveTo(-9, 0); c.quadraticCurveTo(-12, -60, 3, -108); c.lineTo(11, -106); c.quadraticCurveTo(3, -60, 9, 0); c.closePath(); fs(c, '#c89a68', '#8a5a44', 1.8);
      const k = o.color; c.save(); c.translate(7, -108); swayT(c, o, t, 0.03);
      for (const a of [-2.9, -2.2, -1.5, -0.9, -0.25, 0.3, 3.5]) {
        c.save(); c.rotate(a); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(30, -18, 62, 6); c.quadraticCurveTo(28, 6, 0, 0); c.closePath(); fs(c, k, ol(k, 0.36), 1.6); c.restore();
      }
      c.restore();
      oval(c, 0, -102, 6.6, 6.6, '#a8724e', 1.3); oval(c, 13, -100, 6.6, 6.6, '#a8724e', 1.3);
    } });
  def('bush', { name: '灌木丛', cat: 'plant', w: 72, h: 50, colors: ['#7ccb80', '#62bda0', '#96d68a'],
    draw(c, o) { const k = o.color; crown(c, [[-18, -16, 17], [18, -16, 17], [0, -26, 21]], k, sh(k, 0.3)); } });
  def('flowerbush', { name: '花丛', cat: 'plant', w: 76, h: 52, colors: ['#ff8fb1', '#ffd35c', '#b89cf0', '#ff7a7a', '#fffdf8'],
    draw(c, o) {
      crown(c, [[-18, -16, 17], [18, -16, 17], [0, -26, 21]], '#7ccb80', '#a4e0a0');
      for (let i = 0; i < 9; i++) {
        const fx = -30 + CT.hash(i, 1, 2) * 60, fy = -40 + CT.hash(i, 2, 2) * 34;
        for (let p = 0; p < 5; p++) { const a = (p * 6.28) / 5; ell(c, fx + Math.cos(a) * 3, fy + Math.sin(a) * 3, 2.5, 2.5); fs(c, o.color); }
        ell(c, fx, fy, 1.5, 1.5); fs(c, '#ffe27a');
      }
    } });
  def('sunflower', { name: '向日葵', cat: 'plant', w: 56, h: 84, colors: ['#ffd35c', '#ffb84d'],
    draw(c, o, t) {
      c.rotate(Math.sin(t + (o.seed || 0)) * 0.03);
      line(c, 0, 0, 0, -56, '#5cab6c', 4.6);
      c.beginPath(); c.moveTo(0, -26); c.quadraticCurveTo(-22, -44, -22, -26); c.quadraticCurveTo(-14, -18, 0, -26); fs(c, '#74c47c', '#4d8d72', 1.3);
      for (let i = 0; i < 12; i++) { const a = (i * 6.283) / 12; ell(c, Math.cos(a) * 15, -62 + Math.sin(a) * 15, 7.4, 4, a); fs(c, o.color, ol(o.color, 0.3), 1); }
      oval(c, 0, -62, 11, 11, '#8a5a3c', 1.3);
    } });
  def('mushroom', { name: '小蘑菇', cat: 'plant', w: 54, h: 50, colors: ['#ff7a7a', '#ffb35c', '#b89cf0'],
    draw(c, o) {
      box(c, -8, -26, 16, 26, 6, '#fff4e6');
      c.beginPath(); c.moveTo(-24, -24); c.quadraticCurveTo(0, -60, 24, -24); c.quadraticCurveTo(0, -18, -24, -24); c.closePath(); fs(c, o.color, ol(o.color), 1.7);
      for (const d of [[-10, -33, 3.6], [6, -38, 4.4], [13, -27, 2.6]]) { ell(c, d[0], d[1], d[2], d[2]); fs(c, '#fffdf8'); }
    } });
  def('rock', { name: '小石头', cat: 'plant', w: 64, h: 42, colors: ['#c8c8d0', '#d6cec4', '#b8bcc8'],
    draw(c, o) {
      c.beginPath(); c.moveTo(-28, 0); c.quadraticCurveTo(-32, -24, -8, -33); c.quadraticCurveTo(22, -38, 28, -14); c.quadraticCurveTo(32, -4, 26, 0); c.closePath(); fs(c, o.color, ol(o.color), 1.8);
      ell(c, -8, -22, 9, 4.6, -0.4); fs(c, 'rgba(255,255,255,0.45)');
    } });
  def('stump', { name: '树桩', cat: 'plant', w: 58, h: 42,
    draw(c) {
      c.beginPath(); c.moveTo(-23, -28); c.lineTo(-27, 0); c.lineTo(27, 0); c.lineTo(23, -28); c.closePath(); fs(c, '#a8724e', '#7a5040', 1.8);
      ell(c, 0, -28, 23, 9); fs(c, '#ecd2a2', '#a8724e', 1.8); ell(c, 0, -28, 12, 4.4); fs(c, null, '#c8a06e', 1.2);
    } });
  def('lily', { name: '荷叶', cat: 'plant', w: 66, h: 34, water: true, colors: ['#ff9fc0', '#fffdf8'],
    draw(c, o, t) {
      c.translate(0, Math.sin(t + (o.seed || 0)) * 1.3);
      ell(c, -8, -6, 22, 11); fs(c, '#6cc08c', '#4d8d72', 1.5);
      ell(c, 16, -2, 15, 8); fs(c, '#7ccb80', '#4d8d72', 1.5);
      for (let i = 0; i < 6; i++) { const a = (i * 6.28) / 6; ell(c, -8 + Math.cos(a) * 6, -10 + Math.sin(a) * 3.4, 5, 3.2, a); fs(c, o.color, ol(o.color, 0.3), 1); }
      ell(c, -8, -10, 2.4, 2); fs(c, '#ffe27a');
    } });
  def('duck', { name: '小鸭子', cat: 'plant', w: 54, h: 44, water: true, colors: ['#fffdf8', '#ffd84a'],
    draw(c, o, t) {
      c.translate(Math.sin(t * 0.5 + (o.seed || 0)) * 10, Math.sin(t * 2) * 1.2);
      if (Math.cos(t * 0.5 + (o.seed || 0)) < 0) c.scale(-1, 1);
      ell(c, 0, -2, 26, 3.4); fs(c, 'rgba(255,255,255,0.5)');
      c.beginPath(); c.moveTo(-24, -14); c.quadraticCurveTo(-18, -2, 0, -2); c.quadraticCurveTo(20, -2, 20, -14); c.quadraticCurveTo(0, -18, -24, -14); c.closePath(); fs(c, o.color, ol(o.color, 0.26), 1.6);
      oval(c, 12, -24, 10.4, 10, o.color, 1.6);
      poly(c, [21, -26, 31, -23, 21, -20], '#ff9a4a', 1);
      ell(c, 15, -26, 1.6, 1.8); fs(c, '#3a2838');
    } });
  def('fence', { name: '木栅栏', cat: 'deco', w: 56, h: 42, colors: ['#fff4e6', '#e6c49a', '#c8a07a'],
    draw(c, o) {
      const k = o.color;
      box(c, -28, -24, 56, 6, 2, k); box(c, -28, -12, 56, 6, 2, k);
      for (const x of [-19, 0, 19]) poly(c, [x - 5, 0, x - 5, -32, x, -39, x + 5, -32, x + 5, 0], k, 1.7);
    } });
  def('lamp', { name: '路灯', cat: 'deco', w: 40, h: 104, colors: ['#5f6a82', '#7a5a60', '#4a7a70'], light: (o) => [{ x: o.x, y: o.y - 86, r: 170 }],
    draw(c, o, t, env) {
      const k = o.color;
      box(c, -9, -8, 18, 8, 3, k); box(c, -3, -82, 6, 76, 2, k);
      box(c, -12, -102, 24, 22, 7, env.night > 0.2 ? '#fff0b0' : '#eef6f6', 1.6);
      poly(c, [-15, -100, 0, -112, 15, -100], k, 1.5); oval(c, 0, -113, 2.6, 2.6, k, 1);
    } });
  def('bench', { name: '长椅', cat: 'deco', w: 92, h: 56, colors: ['#c89a68', '#7cc6a4', '#f7a8b8'], sit: true,
    draw(c, o) {
      const k = o.color;
      box(c, -38, -16, 6, 16, 2, '#5f6a82'); box(c, 32, -16, 6, 16, 2, '#5f6a82');
      box(c, -44, -50, 88, 11, 4, k); box(c, -44, -37, 88, 9, 3, k); box(c, -46, -22, 92, 10, 4, sh(k, 0.14));
      box(c, -38, -50, 5, 34, 2, '#5f6a82'); box(c, 33, -50, 5, 34, 2, '#5f6a82');
    } });
  def('fountain', { name: '喷泉', cat: 'deco', w: 116, h: 92, blockW: 2,
    draw(c, o, t) {
      ell(c, 0, -14, 56, 22); fs(c, '#dcd8d6', '#a8a0a0', 2);
      ell(c, 0, -17, 46, 16); fs(c, '#a0e4f4');
      for (let i = 0; i < 3; i++) { const r = ((t * 14 + i * 12) % 36) + 8; ell(c, 0, -17, r, r * 0.36); fs(c, null, 'rgba(255,255,255,' + (1 - r / 44) * 0.7 + ')', 1.3); }
      box(c, -7, -50, 14, 34, 4, '#dcd8d6');
      ell(c, 0, -50, 21, 7); fs(c, '#dcd8d6', '#a8a0a0', 1.8);
      c.strokeStyle = 'rgba(190,240,255,0.95)'; c.lineWidth = 2.4;
      for (let i = 0; i < 6; i++) {
        const a = (i - 2.5) * 6 + Math.sin(t * 3 + i) * 1.4;
        c.beginPath(); c.moveTo(0, -52); c.quadraticCurveTo(a * 0.9, -92, a * 2.8, -24); c.stroke();
      }
      ell(c, 0, -84, 5, 5); fs(c, '#d8f6ff');
    } });
  def('mailbox', { name: '信箱', cat: 'deco', w: 44, h: 66, colors: ['#ff8fb1', '#8fb8ff', '#ffd35c'], letter: true,
    draw(c, o, t, env) {
      box(c, -4, -40, 8, 40, 2, '#a8724e');
      c.beginPath(); c.moveTo(-19, -38); c.lineTo(-19, -52); c.arc(0, -52, 19, 3.14, 0); c.lineTo(19, -38); c.closePath(); fs(c, o.color, ol(o.color), 1.8);
      box(c, -11, -56, 22, 5, 2, ol(o.color, 0.3), 1);
      c.save(); c.translate(19, -48); c.rotate(env.hasMail ? -0.4 : 1.2);
      box(c, 0, -2, 4, 18, 1, '#f27a93', 1); c.restore();
    } });
  def('sign', { name: '小木牌', cat: 'deco', w: 96, h: 74, text: true,
    draw(c, o) {
      box(c, -4, -36, 8, 36, 2, '#a8724e');
      box(c, -46, -72, 92, 38, 5, '#e6c49a');
      c.fillStyle = '#6a463a'; c.font = '14px ' + CT.FONT; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(String(o.text || '欢迎来玩').slice(0, 7), 0, -52);
    } });
  def('windmill', { name: '风车', cat: 'deco', w: 112, h: 142, colors: ['#fffdf8', '#ffe9d2', '#f7c3cf'], blockW: 2,
    draw(c, o, t) {
      const k = o.color;
      poly(c, [-27, 0, -16, -88, 16, -88, 27, 0], k, 2);
      box(c, -9, -30, 18, 30, 8, '#c89a68');
      poly(c, [-20, -86, 0, -108, 20, -86], '#e87a7a', 1.8);
      c.save(); c.translate(0, -88); c.rotate(t * 0.7 + (o.seed || 0));
      for (let i = 0; i < 4; i++) { c.rotate(1.5708); box(c, -3, 0, 6, 50, 2, '#a8724e', 1.2); box(c, 3, 13, 15, 37, 2, '#fff4e6', 1.2); }
      c.restore();
      oval(c, 0, -88, 5.6, 5.6, '#a8724e', 1.4);
    } });
  def('campfire', { name: '篝火', cat: 'deco', w: 64, h: 66, light: (o) => [{ x: o.x, y: o.y - 22, r: 150, c: '#ffb070' }], fx: 'fire',
    draw(c, o, t) {
      for (let i = 0; i < 8; i++) { const a = (i * 6.28) / 8; oval(c, Math.cos(a) * 25, -8 + Math.sin(a) * 8, 7, 5, '#c8c8d0', 1.1); }
      line(c, -20, -7, 20, -16, '#7a5040', 6.6); line(c, 20, -7, -20, -16, '#8a5a44', 6.6);
      for (let i = 0; i < 3; i++) {
        const s = 1 - i * 0.3;
        c.beginPath(); c.moveTo(-15 * s, -12); c.quadraticCurveTo(-18 * s, -32 * s, Math.sin(t * 8 + i) * 4, -(58 + Math.sin(t * 11 + i) * 6) * s); c.quadraticCurveTo(18 * s, -32 * s, 15 * s, -12); c.closePath();
        fs(c, ['#ff8a4a', '#ffb84a', '#ffe68a'][i]);
      }
    } });
  def('picnic', { name: '野餐垫', cat: 'deco', w: 112, h: 74, colors: ['#ff9fb0', '#8fc8f0', '#ffd35c'], flat: true,
    draw(c, o) {
      const k = o.color;
      poly(c, [-44, -58, 44, -58, 56, 0, -56, 0], '#fffdf8', 1.8);
      c.save(); c.beginPath(); c.moveTo(-44, -58); c.lineTo(44, -58); c.lineTo(56, 0); c.lineTo(-56, 0); c.closePath(); c.clip();
      c.fillStyle = CT.rgba(k, 0.8);
      for (let i = 0; i < 7; i++) c.fillRect(-60 + i * 25, -60, 12, 62);
      for (let i = 0; i < 4; i++) c.fillRect(-60, -56 + i * 15, 124, 7);
      c.restore();
      box(c, -24, -40, 26, 19, 4, '#c89a68'); c.beginPath(); c.arc(-11, -40, 8, 3.14, 0); c.strokeStyle = '#8a5a44'; c.lineWidth = 2.6; c.stroke();
      oval(c, 22, -30, 9, 9, '#f4626a', 1.3);
    } });
  def('tent', { name: '小帐篷', cat: 'deco', w: 128, h: 92, colors: ['#ffb07a', '#8fc8f0', '#c9b8f0', '#9fdc8e'], blockW: 2,
    draw(c, o) {
      const k = o.color;
      poly(c, [0, -90, 62, 0, -62, 0], k, 2);
      poly(c, [0, -70, 21, 0, -21, 0], '#5a4a5a', 1.5);
      poly(c, [0, -70, -21, 0, -7, 0], sh(k, 0.3), 1.4); poly(c, [0, -70, 21, 0, 7, 0], sh(k, 0.3), 1.4);
      poly(c, [0, -92, 0, -112, 20, -102], '#ff8fb1', 1.2);
      line(c, 0, -92, 0, -112, '#8a5a44', 2);
    } });
  def('snowman', { name: '雪人', cat: 'deco', w: 64, h: 88, colors: ['#ff7a7a', '#8fb8ff', '#7cc6a4'],
    draw(c, o) {
      oval(c, 0, -22, 26, 24, '#fffdf8'); oval(c, 0, -60, 19, 18, '#fffdf8');
      box(c, -18, -45, 36, 9, 4, o.color); box(c, 6, -44, 9, 25, 3, o.color);
      ell(c, -7, -64, 2.4, 2.6); fs(c, '#3a2838'); ell(c, 7, -64, 2.4, 2.6); fs(c, '#3a2838');
      poly(c, [0, -60, 17, -56, 0, -54], '#ff9a4a', 1);
      box(c, -14, -86, 28, 13, 3, '#4a4a5a'); box(c, -21, -76, 42, 5, 2, '#4a4a5a');
    } });
  def('swing', { name: '秋千', cat: 'deco', w: 112, h: 112, colors: ['#ff9fb0', '#8fc8f0', '#ffd35c'], blockW: 2,
    draw(c, o, t) {
      const a = Math.sin(t * 1.6 + (o.seed || 0)) * 0.26;
      line(c, -46, 0, -34, -104, '#a8724e', 7); line(c, 46, 0, 34, -104, '#a8724e', 7); line(c, -42, -104, 42, -104, '#8a5a44', 7);
      c.save(); c.translate(0, -102); c.rotate(a);
      line(c, -18, 0, -18, 72, '#c8c8d0', 2); line(c, 18, 0, 18, 72, '#c8c8d0', 2);
      box(c, -24, 70, 48, 8, 3, o.color); c.restore();
    } });
  def('arch', { name: '花拱门', cat: 'deco', w: 112, h: 118, colors: ['#ff9fc0', '#ffd35c', '#b89cf0'], noBlock: true,
    draw(c, o) {
      c.lineWidth = 8; c.strokeStyle = '#a8886a'; c.beginPath(); c.moveTo(-42, 0); c.lineTo(-42, -66); c.arc(0, -66, 42, 3.1416, 0); c.lineTo(42, 0); c.stroke();
      for (let i = 0; i < 26; i++) {
        const u = i / 25, a = 3.1416 + u * 3.1416, x = u < 0.28 ? -42 : u > 0.72 ? 42 : Math.cos(a) * 42;
        const y = u < 0.28 ? -u * 240 : u > 0.72 ? -(1 - u) * 240 : -66 + Math.sin(a) * 42;
        ell(c, x + (i % 2 ? 4 : -4), y, 6, 6); fs(c, i % 3 ? '#7ccb80' : o.color);
      }
    } });
  def('well', { name: '许愿井', cat: 'deco', w: 80, h: 106, wish: true,
    draw(c) {
      box(c, -33, -40, 66, 40, 6, '#c8c8d0');
      c.strokeStyle = 'rgba(120,115,130,0.55)'; c.lineWidth = 1.2; c.beginPath();
      for (const y of [-27, -14]) { c.moveTo(-32, y); c.lineTo(32, y); } c.stroke();
      ell(c, 0, -40, 33, 10); fs(c, '#c8c8d0', ol('#c8c8d0'), 1.8); ell(c, 0, -40, 25, 6.6); fs(c, '#5ec4dc');
      box(c, -32, -84, 6, 44, 2, '#a8724e'); box(c, 26, -84, 6, 44, 2, '#a8724e');
      poly(c, [-42, -78, 0, -106, 42, -78], '#e87a7a', 1.8);
    } });

  // ---------- 房子 ----------
  function glassWin(c, x, y, w, h, env, round) {
    rr(c, x, y, w, h, round || 4);
    const lit = env.night > 0.25;
    fs(c, lit ? lg(c, 0, y, 0, y + h, ['#ffe9a0', '#ffc86a']) : lg(c, 0, y, 0, y + h, ['#bfe9f6', '#e8fafb']), '#8a6a60', 1.7);
    line(c, x + w / 2, y, x + w / 2, y + h, '#8a6a60', 1.5); line(c, x, y + h / 2, x + w, y + h / 2, '#8a6a60', 1.5);
  }
  function door(c, x, y, w, h, col) {
    c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + w / 2); c.arc(x + w / 2, y + w / 2, w / 2, 3.1416, 0); c.lineTo(x + w, y + h); c.closePath();
    fs(c, col, ol(col), 1.9);
    ell(c, x + w - 6.4, y + h * 0.58, 2.2, 2.2); fs(c, '#ffe07a', '#b8904a', 0.9);
  }
  const homeLight = (wins) => (o) => wins.map((w) => ({ x: o.x + w[0], y: o.y + w[1], r: w[2] || 92, c: '#ffcf8a' }));
  def('h_cottage', { name: '小木屋', cat: 'house', w: 168, h: 168, blockW: 3, blockH: 2, house: true, colors: ['#f78ea4', '#f4a66a', '#7cb8e0', '#8cc884', '#b89cf0'], rooms: 3, light: homeLight([[-42, -46], [42, -46]]),
    draw(c, o, t, env) {
      const k = o.color;
      box(c, 30, -158, 20, 44, 3, '#c89a78');
      box(c, 26, -162, 28, 8, 3, '#a8806a');
      box(c, -68, -86, 136, 86, 4, '#fff4e6');
      c.strokeStyle = 'rgba(190,150,120,0.5)'; c.lineWidth = 1; c.beginPath();
      for (let y = -74; y < -4; y += 12) { c.moveTo(-66, y); c.lineTo(66, y); } c.stroke();
      c.beginPath(); c.moveTo(-86, -80); c.lineTo(0, -152); c.lineTo(86, -80); c.quadraticCurveTo(0, -72, -86, -80); c.closePath();
      fs(c, lg(c, 0, -152, 0, -76, [sh(k, 0.14), sh(k, -0.08)]), ol(k), 2);
      c.strokeStyle = CT.rgba(sh(k, -0.2), 0.55); c.lineWidth = 1.3; c.beginPath();
      for (let i = 0; i < 3; i++) { const y = -128 + i * 16, hw = 30 + i * 21; c.moveTo(-hw, y); c.quadraticCurveTo(0, y + 6, hw, y); } c.stroke();
      glassWin(c, -56, -64, 28, 30, env); glassWin(c, 28, -64, 28, 30, env);
      door(c, -14, -56, 28, 56, sh(k, -0.12));
      box(c, -60, -32, 36, 8, 3, '#c89a68'); box(c, 24, -32, 36, 8, 3, '#c89a68');
      for (const x of [-54, -44, -34, 30, 40, 50]) { ell(c, x, -35, 3.6, 3.6); fs(c, ['#ff8fb1', '#ffd35c', '#fffdf8'][Math.abs(x) % 3]); }
    } });
  def('h_mushroom', { name: '蘑菇屋', cat: 'house', w: 164, h: 164, blockW: 3, blockH: 2, house: true, colors: ['#f4626a', '#ff9f5c', '#b08cf0', '#f78ea4'], rooms: 2, light: homeLight([[-36, -52], [38, -52]]),
    draw(c, o, t, env) {
      const k = o.color;
      c.beginPath(); c.moveTo(-58, 0); c.quadraticCurveTo(-52, -50, -44, -88); c.lineTo(44, -88); c.quadraticCurveTo(52, -50, 58, 0); c.closePath(); fs(c, '#fff4e6', ol('#fff4e6', 0.3), 2);
      c.beginPath(); c.moveTo(-84, -82); c.bezierCurveTo(-82, -180, 82, -180, 84, -82); c.quadraticCurveTo(0, -60, -84, -82); c.closePath();
      fs(c, lg(c, 0, -160, 0, -70, [sh(k, 0.14), sh(k, -0.08)]), ol(k), 2);
      for (const d of [[-44, -112, 13], [4, -134, 17], [46, -106, 12], [-10, -96, 9], [28, -86, 6]]) { ell(c, d[0], d[1], d[2], d[2] * 0.9); fs(c, '#fffdf8', 'rgba(150,100,100,0.35)', 1); }
      glassWin(c, -48, -68, 26, 26, env, 13); glassWin(c, 24, -68, 26, 26, env, 13);
      door(c, -15, -56, 30, 56, '#c89a68');
    } });
  def('h_candy', { name: '糖果屋', cat: 'house', w: 172, h: 172, blockW: 3, blockH: 2, house: true, colors: ['#ffc2d6', '#c8e8ff', '#fff0a8', '#d5c4f8'], rooms: 2, light: homeLight([[-42, -48], [42, -48]]),
    draw(c, o, t, env) {
      const k = o.color;
      box(c, -70, -92, 140, 92, 8, k);
      c.save(); rr(c, -69, -91, 138, 90, 8); c.clip(); c.fillStyle = 'rgba(255,255,255,0.45)';
      for (let x = -70; x < 70; x += 28) c.fillRect(x, -92, 14, 92);
      c.restore();
      c.beginPath(); c.moveTo(-86, -86); c.quadraticCurveTo(0, -196, 86, -86); c.closePath(); fs(c, '#a8643c', ol('#a8643c'), 2);
      c.beginPath(); c.moveTo(-80, -92); c.quadraticCurveTo(0, -192, 80, -92);
      for (let i = 0; i < 6; i++) { const x = 80 - i * 26.6; c.quadraticCurveTo(x - 13, -68 - (i % 2) * 8, x - 26.6, -92); }
      c.closePath(); fs(c, '#fffdf8', 'rgba(170,130,140,0.5)', 1.4);
      for (const [x, y, col] of [[-30, -116, '#ff7a8a'], [0, -146, '#7cc6e8'], [32, -112, '#ffd35c'], [-4, -106, '#a8e0a0']]) oval(c, x, y, 7.6, 7.6, col, 1.3);
      glassWin(c, -56, -62, 28, 30, env); glassWin(c, 28, -62, 28, 30, env);
      door(c, -15, -56, 30, 56, '#f27a93');
      for (const s of [-1, 1]) {
        line(c, s * 80, 0, s * 80, -38, '#fffdf8', 4.6);
        oval(c, s * 80, -50, 13, 13, s > 0 ? '#ff8fb1' : '#8fd0f0', 1.6);
        c.beginPath(); c.arc(s * 80, -50, 7.4, 0, 4.4); c.strokeStyle = '#fffdf8'; c.lineWidth = 2.6; c.stroke();
      }
    } });
  function awning(c, y, hw, k, h) {
    const n = 8, sw = (hw * 2) / n;
    for (let i = 0; i < n; i++) {
      const x = -hw + i * sw, col = i % 2 ? '#fffdf8' : k;
      c.beginPath(); c.moveTo(x + 7 * (1 - i / (n / 2)), y); c.lineTo(x + sw + 7 * (1 - (i + 1) / (n / 2)), y); c.lineTo(x + sw, y + h); c.arc(x + sw / 2, y + h, sw / 2, 0, 3.1416); c.closePath(); fs(c, col, ol(k), 1.4);
    }
  }
  def('h_bakery', { name: '甜品屋', cat: 'house', w: 178, h: 158, blockW: 3, blockH: 2, house: true, colors: ['#f78ea4', '#ffb07a', '#8fc8f0'], rooms: 2, light: homeLight([[-44, -46, 110], [44, -46, 110]]),
    draw(c, o, t, env) {
      const k = o.color;
      box(c, -76, -128, 152, 128, 5, '#ffeedd');
      box(c, -82, -146, 164, 24, 6, sh(k, -0.06));
      box(c, -42, -158, 84, 26, 8, '#fffdf8');
      c.fillStyle = '#7a4a4a'; c.font = '15px ' + CT.FONT; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('甜品屋', 0, -145);
      awning(c, -112, 78, k, 19);
      glassWin(c, -68, -74, 44, 44, env, 5); glassWin(c, 24, -74, 44, 44, env, 5);
      door(c, -15, -62, 30, 62, sh(k, -0.14));
      for (const x of [-46, 46]) { ell(c, x, -38, 12, 5); fs(c, '#fffdf8', '#c8a8b0', 1.2); oval(c, x, -46, 7, 7, '#ff9fb8', 1.2); }
    } });
  def('h_flower', { name: '花店', cat: 'house', w: 178, h: 150, blockW: 3, blockH: 2, house: true, colors: ['#7cc6a4', '#f7a8c4', '#ffd35c'], rooms: 2, light: homeLight([[-42, -46, 110], [44, -46, 110]]),
    draw(c, o, t, env) {
      const k = o.color;
      box(c, -76, -122, 152, 122, 5, '#f6fbf0');
      poly(c, [-84, -118, 0, -148, 84, -118], sh(k, -0.1), 2);
      awning(c, -110, 78, k, 18);
      glassWin(c, -66, -76, 42, 42, env, 5); glassWin(c, 24, -76, 42, 42, env, 5);
      door(c, -14, -60, 28, 60, '#c89a68');
      for (let x = -70; x <= 70; x += 14) {
        if (Math.abs(x) < 22) continue;
        box(c, x - 6, -12, 12, 12, 2, '#e7a98c', 1.1);
        for (let p = 0; p < 5; p++) { const a = (p * 6.28) / 5; ell(c, x + Math.cos(a) * 3.2, -19 + Math.sin(a) * 3.2, 2.8, 2.8); fs(c, ['#ff8fb1', '#ffd35c', '#b89cf0', '#ff9a6b'][Math.abs(x / 14 | 0) % 4]); }
      }
    } });
  def('h_cafe', { name: '咖啡馆', cat: 'house', w: 176, h: 156, blockW: 3, blockH: 2, house: true, colors: ['#a8724e', '#7a8a6a', '#6a7a9a'], rooms: 2, light: homeLight([[-44, -46, 110], [44, -46, 110]]),
    draw(c, o, t, env) {
      const k = o.color;
      box(c, -74, -112, 148, 112, 5, sh(k, 0.42));
      c.beginPath(); c.moveTo(-86, -106); c.lineTo(-68, -148); c.lineTo(68, -148); c.lineTo(86, -106); c.closePath(); fs(c, k, ol(k), 2);
      awning(c, -98, 76, '#d86a6a', 15);
      glassWin(c, -66, -70, 42, 42, env, 5); glassWin(c, 24, -70, 42, 42, env, 5);
      door(c, -15, -60, 30, 60, sh(k, -0.2));
      box(c, -12, -138, 24, 18, 4, '#fffdf8', 1.4); c.beginPath(); c.arc(13, -129, 5, -1.4, 1.4); c.strokeStyle = ol('#c8a8b0'); c.lineWidth = 2; c.stroke();
      box(c, -9, -135, 18, 5, 2, '#8a5a44', 0);
      c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 2;
      for (const x of [-5, 5]) { c.beginPath(); c.moveTo(x, -141); c.quadraticCurveTo(x + Math.sin(t * 2 + x) * 3.4, -147, x, -153); c.stroke(); }
    } });
  def('h_tower', { name: '星星塔', cat: 'house', w: 128, h: 208, blockW: 2, blockH: 2, house: true, colors: ['#8f8ce8', '#6fb7e8', '#f78ea4'], rooms: 3, light: homeLight([[0, -112, 90], [0, -60, 70]]),
    draw(c, o, t, env) {
      const k = o.color;
      c.beginPath(); c.moveTo(-46, 0); c.lineTo(-38, -146); c.lineTo(38, -146); c.lineTo(46, 0); c.closePath(); fs(c, '#f4eff8', ol('#f4eff8', 0.3), 2);
      c.strokeStyle = 'rgba(160,140,170,0.45)'; c.lineWidth = 1.2; c.beginPath();
      for (let y = -130; y < 0; y += 20) { c.moveTo(-42, y); c.lineTo(42, y); } c.stroke();
      c.beginPath(); c.moveTo(-54, -138); c.lineTo(0, -214); c.lineTo(54, -138); c.quadraticCurveTo(0, -128, -54, -138); c.closePath();
      fs(c, lg(c, 0, -214, 0, -134, [sh(k, 0.2), sh(k, -0.08)]), ol(k), 2);
      CT.starPath(c, 0, -218, 9, 4, 5, Math.sin(t) * 0.2); fs(c, '#ffe07a', '#c8a848', 1.2);
      glassWin(c, -14, -124, 28, 30, env, 13); glassWin(c, -11, -80, 22, 22, env, 11);
      door(c, -14, -50, 28, 50, '#b89cf0');
    } });

  CT.mapObjThumb = function (cv, id) {
    const d = O[id], c = cv.getContext('2d'), W = cv.width, H = cv.height;
    c.clearRect(0, 0, W, H);
    const s = Math.min(W / (d.w + 10), H / (d.h + 12));
    c.save(); c.translate(W / 2, H / 2 + (d.h * s) / 2); c.scale(s, s);
    d.draw(c, { color: d.colors ? d.colors[0] : null, seed: 1, x: 0, y: 0 }, 1, { night: 0 });
    c.restore();
  };

  // 水面粼光（每帧叠加在缓存地形上）
  CT.drawWaterFx = function (c, m, x0, y0, x1, y1, t) {
    c.strokeStyle = 'rgba(255,255,255,0.65)'; c.lineWidth = 1.8; c.lineCap = 'round'; c.beginPath();
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        if (m.t[y * m.w + x] !== 5) continue;
        for (let i = 0; i < 2; i++) {
          const phase = t * 0.8 + CT.hash(x, y, 130 + i) * 6.28;
          const a = Math.sin(phase);
          if (a < 0.1) continue;
          const px = x * T + CT.hash(x, y, 134 + i) * T + Math.cos(phase) * 3, py = y * T + CT.hash(x, y, 138 + i) * T;
          const w = 3 + a * 6;
          c.moveTo(px - w, py); c.quadraticCurveTo(px, py - 2.4, px + w, py);
        }
      }
    }
    c.stroke();
  };
})(window.CT);
