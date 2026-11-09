/* 云朵小镇 · 家具与小动物：每一件都是实时绘制的，所以能换色、翻转、发光 */
'use strict';
(function (CT) {
  const sh = CT.shade, ell = CT.ell, rr = CT.rr, fs = CT.fs, line = CT.line, mix = CT.mix, lg = CT.lg;
  const INK = '#5a3448';
  const ol = (c, k) => mix(c, INK, k == null ? 0.42 : k);
  const box = (c, x, y, w, h, r, f, lw) => { rr(c, x, y, w, h, r); fs(c, f, ol(f), lw == null ? 2 : lw); };
  const oval = (c, x, y, rx, ry, f, lw) => { ell(c, x, y, rx, ry); fs(c, f, ol(f), lw == null ? 2 : lw); };
  const gloss = (c, x, y, w, h, a) => { rr(c, x, y, w, h, h / 2); fs(c, 'rgba(255,255,255,' + (a || 0.38) + ')'); };
  const poly = (c, pts, f, lw) => {
    c.beginPath(); c.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
    c.closePath(); fs(c, f, ol(f), lw == null ? 2 : lw);
  };
  const SOFT = ['#f7b3c2', '#a8d8ea', '#b9dba4', '#ffd59e', '#c9b8f0', '#f2e4d4', '#8aa7c9'];
  const WOODS = ['#d9a877', '#b98352', '#f0d9b5', '#8a5a44', '#fff4e6', '#f4c2cc', '#a9d6c6'];
  const WD = '#b98352', WL = '#d9a877', WHITE = '#fffdf8', CREAM = '#fff4e6', METAL = '#cfd3dc', GLASS = '#dff3f7';

  CT.FURN_CATS = [
    ['living', '客厅'], ['bedroom', '卧室'], ['kitchen', '厨房'], ['bath', '浴室'], ['decor', '摆设'], ['wall', '墙饰'], ['rug', '地毯'], ['small', '小物'], ['pet', '宠物'],
  ];
  const F = (CT.FURN = {});
  const def = (id, o) => { o.id = id; o.colors = o.colors || null; F[id] = o; };

  // ---------- 窗外的世界 ----------
  CT.DAY_ENV = { hour: 10, skyTop: '#8fd3f4', skyBot: '#dff5f4', night: 0, weather: 'sun', t: 0 };
  function skyView(c, x, y, w, h, env, clipFn) {
    const t = env.t || 0;
    c.save();
    c.beginPath(); clipFn(); c.clip();
    c.fillStyle = lg(c, 0, y, 0, y + h, [env.skyTop, env.skyBot]);
    c.fillRect(x, y, w, h);
    const night = env.night || 0;
    if (night > 0.3) {
      c.fillStyle = 'rgba(255,255,240,' + night + ')';
      for (let i = 0; i < 18; i++) {
        const sx = x + CT.hash(i, 3, 1) * w, sy = y + CT.hash(i, 5, 2) * h * 0.72;
        const r = 0.9 + 0.9 * Math.abs(Math.sin(t * 1.3 + i));
        c.beginPath(); c.arc(sx, sy, r, 0, 7); c.fill();
      }
      ell(c, x + w * 0.72, y + h * 0.26, 13, 13); fs(c, '#fff4c8');
      ell(c, x + w * 0.72 + 5, y + h * 0.26 - 3, 11, 11); fs(c, env.skyTop);
    } else {
      ell(c, x + w * 0.26, y + h * 0.26, 15, 15); fs(c, 'rgba(255,240,170,0.9)');
    }
    c.fillStyle = 'rgba(255,255,255,' + (0.85 - night * 0.65) + ')';
    for (let i = 0; i < 3; i++) {
      const cx = x + (((t * 5 + i * 70) % (w + 90)) - 45), cy = y + h * (0.2 + i * 0.16);
      CT.cloudShape(c, cx, cy + 12, 58 - i * 8, 20 - i * 3, i + 3); c.fill();
    }
    const hill = night > 0.5 ? '#3f5a78' : env.hour > 16.5 ? '#a8b48a' : '#a8dc9a';
    c.fillStyle = hill;
    c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + h * 0.82);
    c.quadraticCurveTo(x + w * 0.3, y + h * 0.66, x + w * 0.6, y + h * 0.84);
    c.quadraticCurveTo(x + w * 0.8, y + h * 0.74, x + w, y + h * 0.8);
    c.lineTo(x + w, y + h); c.closePath(); c.fill();
    if (env.weather === 'rain') {
      c.strokeStyle = 'rgba(210,230,255,0.7)'; c.lineWidth = 1.3; c.beginPath();
      for (let i = 0; i < 16; i++) {
        const rx = x + CT.hash(i, 9, 3) * w, ry = y + ((t * 170 + CT.hash(i, 7, 4) * 300) % (h + 20)) - 10;
        c.moveTo(rx, ry); c.lineTo(rx - 3, ry + 10);
      }
      c.stroke();
    } else if (env.weather === 'snow' || env.weather === 'petal') {
      c.fillStyle = env.weather === 'snow' ? '#fff' : '#ffb7ce';
      for (let i = 0; i < 12; i++) {
        const rx = x + ((CT.hash(i, 9, 3) * w + Math.sin(t + i) * 9 + w) % w), ry = y + ((t * 26 + CT.hash(i, 7, 4) * 300) % (h + 10)) - 5;
        ell(c, rx, ry, 2.4, 2); c.fill();
      }
    }
    c.restore();
  }

  // ---------- 客厅 ----------
  def('sofa', { name: '软软沙发', cat: 'living', kind: 'floor', w: 280, h: 156, colors: SOFT, seats: [[-58, -66], [58, -66]],
    draw(c, it) {
      const k = it.color, d = sh(k, -0.12), l = sh(k, 0.2);
      box(c, -118, -14, 12, 14, 3, WD); box(c, 106, -14, 12, 14, 3, WD);
      box(c, -122, -152, 244, 100, 34, d);
      box(c, -108, -143, 104, 84, 26, k); box(c, 4, -143, 104, 84, 26, k);
      gloss(c, -94, -136, 52, 8); gloss(c, 18, -136, 52, 8);
      box(c, -128, -70, 256, 58, 18, d);
      box(c, -112, -86, 110, 36, 14, l); box(c, 2, -86, 110, 36, 14, l);
      box(c, -140, -110, 44, 98, 20, k); box(c, 96, -110, 44, 98, 20, k);
      gloss(c, -132, -103, 24, 7); gloss(c, 104, -103, 24, 7);
    } });
  def('armchair', { name: '圆圆单人椅', cat: 'living', kind: 'floor', w: 156, h: 150, colors: SOFT.slice(1).concat(SOFT[0]), seats: [[0, -64]],
    draw(c, it) {
      const k = it.color, d = sh(k, -0.12), l = sh(k, 0.2);
      box(c, -60, -14, 11, 14, 3, WD); box(c, 49, -14, 11, 14, 3, WD);
      box(c, -64, -146, 128, 104, 40, k);
      gloss(c, -44, -136, 56, 8);
      box(c, -66, -66, 132, 54, 16, d);
      box(c, -54, -82, 108, 34, 14, l);
      box(c, -78, -102, 34, 90, 16, k); box(c, 44, -102, 34, 90, 16, k);
    } });
  def('coffeeTable', { name: '小茶几', cat: 'living', kind: 'floor', w: 190, h: 80, colors: WOODS, surface: { y: -66, w: 164 },
    draw(c, it) {
      const k = it.color, d = sh(k, -0.16);
      box(c, -76, -46, 12, 46, 4, d); box(c, 64, -46, 12, 46, 4, d);
      box(c, -80, -32, 160, 8, 3, d);
      box(c, -94, -80, 188, 28, 12, sh(k, 0.14));
      box(c, -94, -60, 188, 16, 7, k);
      gloss(c, -74, -75, 90, 5, 0.5);
    } });
  def('tv', { name: '小电视', cat: 'living', kind: 'floor', w: 200, h: 196, colors: WOODS, toggle: true, anim: true, light: { x: 0, y: -116, r: 210, c: '#bcd8ff' },
    use: { act: 'tv' },
    draw(c, it, t) {
      const k = it.color, d = sh(k, -0.14);
      box(c, -96, -66, 192, 62, 8, k);
      box(c, -86, -56, 84, 42, 5, d); box(c, 2, -56, 84, 42, 5, d);
      oval(c, -8, -35, 2.6, 2.6, METAL, 1.2); oval(c, 8, -35, 2.6, 2.6, METAL, 1.2);
      box(c, -86, -4, 14, 4, 2, d); box(c, 72, -4, 14, 4, 2, d);
      box(c, -14, -76, 28, 12, 2, '#6a5a68');
      box(c, -84, -194, 168, 122, 16, '#6a5a68');
      rr(c, -74, -184, 148, 102, 10);
      if (it.on) {
        c.save(); c.clip();
        const h = (t * 24) % 360;
        c.fillStyle = 'hsl(' + (190 + Math.sin(t * 0.4) * 24) + ',70%,78%)'; c.fillRect(-74, -184, 148, 102);
        c.fillStyle = '#fff';
        CT.cloudShape(c, -30 + Math.sin(t * 0.5) * 28, -138, 64, 24, 3); c.fill();
        c.fillStyle = 'hsl(' + h + ',80%,72%)';
        const hop = Math.abs(Math.sin(t * 3)) * 16;
        ell(c, 18, -102 - hop, 14, 13); c.fill();
        c.fillStyle = '#5a3448'; ell(c, 13, -105 - hop, 1.8, 2.4); c.fill(); ell(c, 23, -105 - hop, 1.8, 2.4); c.fill();
        c.fillStyle = '#9fdc8e'; c.fillRect(-74, -92, 148, 12);
        c.restore();
      } else {
        fs(c, lg(c, 0, -184, 0, -82, ['#7a8498', '#4d5364']));
        poly(c, [-60, -176, -30, -176, -56, -120, -66, -120], 'rgba(255,255,255,0.16)', 0);
      }
    } });
  def('bookshelf', { name: '大书架', cat: 'living', kind: 'floor', w: 146, h: 244, colors: WOODS, use: { act: 'read', dy: 24, back: true, arm: 'hold' },
    draw(c, it) {
      const k = it.color, d = sh(k, -0.16), seed = it.seed || 1;
      box(c, -72, -240, 144, 240, 8, k);
      const pal = ['#f27a93', '#8fb8ff', '#ffd977', '#7cc6a4', '#c9b8f0', '#ffb07a', '#fffdf8'];
      for (let row = 0; row < 4; row++) {
        const y = -230 + row * 56;
        box(c, -62, y, 124, 50, 3, d, 1.5);
        let x = -58, i = 0;
        while (x < 44) {
          const bw = 8 + CT.hash(i, row, seed) * 9, bh = 28 + CT.hash(row, i, seed + 3) * 16;
          if (CT.hash(i, row, seed + 5) < 0.86) {
            box(c, x, y + 49 - bh, bw, bh, 1.6, pal[Math.floor(CT.hash(i, row, seed + 8) * pal.length)], 1.1);
          }
          x += bw + 1.2; i++;
        }
      }
    } });
  def('floorLamp', { name: '落地灯', cat: 'living', kind: 'floor', w: 96, h: 226, colors: ['#ffe29a', '#ffc8d8', '#b8e0ee', '#c9e8b8'], toggle: true, on: true, light: { x: 0, y: -176, r: 280 },
    draw(c, it) {
      const k = it.color;
      ell(c, 0, -6, 30, 8); fs(c, '#a88a7a', ol('#a88a7a'), 2);
      line(c, 0, -8, 0, -170, '#a88a7a', 6);
      c.beginPath(); c.moveTo(-24, -222); c.lineTo(24, -222); c.lineTo(46, -160); c.quadraticCurveTo(0, -150, -46, -160); c.closePath();
      fs(c, it.on ? sh(k, 0.3) : sh(k, -0.1), ol(k), 2);
      line(c, 14, -160, 14, -142, '#a88a7a', 2); oval(c, 14, -138, 3.4, 3.4, '#d8b890', 1.2);
      gloss(c, -18, -214, 16, 44, 0.3);
    } });
  def('piano', { name: '小钢琴', cat: 'living', kind: 'floor', w: 216, h: 182, colors: ['#4a3a44', '#fffdf8', '#b98352', '#e8a9b4', '#7fa8b0'], use: { act: 'piano', dy: 28, back: true, arm: 'play' },
    draw(c, it) {
      const k = it.color, d = sh(k, -0.12);
      box(c, -102, -182, 204, 112, 10, k);
      box(c, -84, -168, 168, 60, 5, sh(k, 0.09), 1.5);
      box(c, -40, -160, 80, 34, 2, '#fffdf8', 1.3);
      line(c, -30, -150, 30, -150, '#c8c0c8', 1); line(c, -30, -142, 30, -142, '#c8c0c8', 1); line(c, -30, -134, 18, -134, '#c8c0c8', 1);
      box(c, -108, -84, 216, 26, 6, d);
      box(c, -100, -80, 200, 16, 2, '#fffdf8', 1.2);
      c.strokeStyle = '#c8c0c8'; c.lineWidth = 1; c.beginPath();
      for (let x = -90; x < 100; x += 10) { c.moveTo(x, -80); c.lineTo(x, -64); } c.stroke();
      c.fillStyle = '#4a3a44';
      for (let i = 0; i < 18; i++) if (i % 7 !== 2 && i % 7 !== 6) c.fillRect(-94 + i * 10.4, -80, 6, 9);
      box(c, -94, -60, 16, 60, 3, d); box(c, 78, -60, 16, 60, 3, d);
      box(c, -102, -60, 204, 10, 3, d);
      oval(c, -30, -3, 5, 3, '#d8b860', 1.2); oval(c, 30, -3, 5, 3, '#d8b860', 1.2);
    } });
  def('fireplace', { name: '暖暖壁炉', cat: 'living', kind: 'floor', w: 214, h: 206, colors: ['#e7a98c', '#d9d3cc', '#c9a6b8', '#fffdf8'], toggle: true, on: true, anim: true, light: { x: 0, y: -60, r: 340, c: '#ffb070' },
    draw(c, it, t) {
      const k = it.color, d = sh(k, -0.14);
      box(c, -96, -172, 192, 172, 8, k);
      c.strokeStyle = CT.rgba(d, 0.6); c.lineWidth = 1.4; c.beginPath();
      for (let y = -152; y < -6; y += 20) {
        c.moveTo(-94, y); c.lineTo(94, y);
        const off = ((y + 152) / 20) % 2 ? 0 : 24;
        for (let x = -92 + off; x < 94; x += 48) { c.moveTo(x, y); c.lineTo(x, y + 20); }
      }
      c.stroke();
      c.beginPath(); c.moveTo(-62, 0); c.lineTo(-62, -74); c.quadraticCurveTo(0, -142, 62, -74); c.lineTo(62, 0); c.closePath();
      fs(c, '#3e2b34', ol('#3e2b34'), 2);
      box(c, -108, -190, 216, 22, 7, sh(WD, 0.08));
      gloss(c, -94, -186, 120, 5, 0.4);
      box(c, -48, -16, 96, 12, 5, '#8a5a44'); box(c, -38, -24, 76, 11, 5, '#a8724e');
      if (it.on) {
        for (let i = 0; i < 3; i++) {
          const col = ['#ff8a4a', '#ffb84a', '#ffe68a'][i], s = 1 - i * 0.28;
          c.beginPath(); c.moveTo(-44 * s, -18);
          for (let j = 0; j <= 6; j++) {
            const px = -44 * s + (88 * s * j) / 6;
            const py = -22 - (Math.sin((j / 6) * Math.PI) * 74 * s + Math.sin(t * 7 + j * 1.9 + i) * 12 * s);
            c.quadraticCurveTo(px - 7 * s, py, px, py + 14);
          }
          c.lineTo(44 * s, -18); c.closePath(); c.fillStyle = col; c.fill();
        }
      }
    } });
  def('recordPlayer', { name: '唱片机', cat: 'living', kind: 'floor', w: 110, h: 128, colors: WOODS, toggle: true, anim: true, use: { act: 'music' },
    draw(c, it, t) {
      const k = it.color, d = sh(k, -0.14);
      box(c, -52, -66, 104, 66, 6, k); box(c, -42, -56, 84, 44, 4, d);
      line(c, -18, -56, -18, -12, CT.rgba(ol(d), 0.6), 1.5); line(c, 18, -56, 18, -12, CT.rgba(ol(d), 0.6), 1.5);
      box(c, -54, -86, 108, 22, 6, sh(k, 0.1));
      ell(c, -6, -80, 37, 11); fs(c, '#3e3440', '#2a2230', 1.5);
      c.save(); c.translate(-6, -80); c.scale(1, 0.3); c.rotate(it.on ? t * 3 : 0);
      ell(c, 0, 0, 10, 10); fs(c, '#f27a93');
      c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 25, 0.2, 1.2); c.stroke();
      c.restore();
      line(c, 40, -86, 17, -77, METAL, 3); oval(c, 40, -87, 4, 4, METAL, 1.3);
      c.beginPath(); c.moveTo(24, -88); c.quadraticCurveTo(44, -112, 34, -126); c.lineWidth = 3; c.strokeStyle = ol('#d8b860'); c.stroke();
      c.beginPath(); c.moveTo(34, -126); c.quadraticCurveTo(14, -128, 6, -112); c.lineTo(46, -112 - 12); c.closePath(); fs(c, '#e8c870', ol('#e8c870'), 1.6);
    } });
  def('beanbag', { name: '懒人豆袋', cat: 'living', kind: 'floor', w: 136, h: 96, colors: SOFT.slice(2).concat(SOFT.slice(0, 2)), seats: [[0, -46]],
    draw(c, it) {
      const k = it.color;
      c.beginPath(); c.moveTo(-64, -6);
      c.bezierCurveTo(-74, -66, -28, -96, 4, -92); c.bezierCurveTo(44, -88, 76, -50, 62, -6); c.quadraticCurveTo(0, 8, -64, -6); c.closePath();
      fs(c, lg(c, 0, -92, 0, 0, [sh(k, 0.2), sh(k, -0.08)]), ol(k), 2);
      ell(c, -18, -60, 22, 11, -0.5); fs(c, 'rgba(255,255,255,0.3)');
    } });
  def('cabinet', { name: '矮柜', cat: 'living', kind: 'floor', w: 176, h: 104, colors: WOODS, surface: { y: -96, w: 156 },
    draw(c, it) {
      const k = it.color, d = sh(k, -0.1);
      box(c, -82, -14, 12, 14, 3, sh(k, -0.2)); box(c, 70, -14, 12, 14, 3, sh(k, -0.2));
      box(c, -86, -94, 172, 84, 8, k);
      box(c, -76, -84, 74, 64, 5, d, 1.5); box(c, 2, -84, 74, 64, 5, d, 1.5);
      oval(c, -10, -52, 3.4, 3.4, '#e8c870', 1.2); oval(c, 10, -52, 3.4, 3.4, '#e8c870', 1.2);
      box(c, -90, -104, 180, 13, 5, sh(k, 0.18));
    } });

  // ---------- 卧室 ----------
  function pillow(c, x, y, w, h, col) {
    box(c, x - w / 2, y - h / 2, w, h, h * 0.45, col);
    gloss(c, x - w * 0.34, y - h * 0.36, w * 0.4, h * 0.2, 0.7);
  }
  function quilt(c, x, y, w, h, k) {
    box(c, x, y, w, h, 18, k);
    c.save(); rr(c, x, y, w, h, 18); c.clip();
    c.strokeStyle = CT.rgba(sh(k, -0.3), 0.3); c.lineWidth = 1.5; c.setLineDash([5, 4]); c.beginPath();
    for (let i = 1; i < 4; i++) { c.moveTo(x + (w * i) / 4, y + 26); c.lineTo(x + (w * i) / 4, y + h); }
    for (let i = 1; i < 4; i++) { c.moveTo(x, y + 26 + (h * i) / 4); c.lineTo(x + w, y + 26 + (h * i) / 4); }
    c.stroke(); c.setLineDash([]);
    c.restore();
    box(c, x - 1, y - 1, w + 2, 30, 13, sh(k, 0.62));
  }
  def('bedSingle', { name: '小木床', cat: 'bedroom', kind: 'floor', w: 196, h: 286, colors: ['#f7b3c2', '#a8d8ea', '#ffd59e', '#c9b8f0', '#b9dba4'], beds: [[0, -210]],
    draw(c, it) {
      box(c, -92, -286, 184, 132, 50, WL);
      gloss(c, -60, -274, 90, 7, 0.4);
      box(c, -92, -190, 184, 150, 12, sh(WL, -0.1));
      pillow(c, 0, -206, 124, 50, WHITE);
    },
    over(c, it) {
      quilt(c, -91, -172, 182, 134, it.color);
      box(c, -96, -52, 192, 44, 12, WL); gloss(c, -80, -47, 110, 5, 0.42);
      box(c, -90, -10, 14, 10, 3, sh(WL, -0.16)); box(c, 76, -10, 14, 10, 3, sh(WL, -0.16));
    } });
  def('bedCanopy', { name: '公主大床', cat: 'bedroom', kind: 'floor', w: 300, h: 358, colors: ['#f7b3c2', '#c9b8f0', '#a8d8ea', '#ffd59e'], beds: [[-62, -214], [62, -214]],
    draw(c, it) {
      const k = it.color;
      box(c, -146, -352, 10, 340, 4, WHITE); box(c, 136, -352, 10, 340, 4, WHITE);
      box(c, -140, -300, 280, 150, 44, sh(k, 0.4));
      box(c, -140, -190, 280, 150, 12, sh(k, 0.5));
      pillow(c, -66, -210, 118, 50, WHITE); pillow(c, 66, -210, 118, 50, WHITE);
    },
    over(c, it, t) {
      const k = it.color;
      quilt(c, -138, -176, 276, 138, k);
      box(c, -146, -52, 292, 42, 12, WHITE);
      box(c, -140, -10, 14, 10, 3, sh(WHITE, -0.14)); box(c, 126, -10, 14, 10, 3, sh(WHITE, -0.14));
      c.beginPath(); c.moveTo(-154, -350); c.quadraticCurveTo(0, -306, 154, -350); c.lineTo(154, -358); c.lineTo(-154, -358); c.closePath();
      fs(c, sh(k, 0.3), ol(k), 2);
      for (const s of [-1, 1]) {
        c.beginPath(); c.moveTo(s * 152, -350); c.quadraticCurveTo(s * 118, -280 + Math.sin(t) * 3, s * 150, -190); c.lineTo(s * 152, -190); c.closePath();
        fs(c, CT.rgba(sh(k, 0.3), 0.82), ol(k), 1.6);
      }
      oval(c, 0, -358, 10, 10, '#ffe08a', 1.6);
    } });
  def('wardrobe', { name: '大衣柜', cat: 'bedroom', kind: 'floor', w: 160, h: 254, colors: WOODS, use: { act: 'dress', dy: 22, back: true },
    draw(c, it) {
      const k = it.color, d = sh(k, -0.08);
      box(c, -76, -14, 12, 14, 3, sh(k, -0.2)); box(c, 64, -14, 12, 14, 3, sh(k, -0.2));
      box(c, -80, -244, 160, 234, 8, k);
      box(c, -70, -234, 68, 214, 5, d, 1.6); box(c, 2, -234, 68, 214, 5, d, 1.6);
      for (const s of [-1, 1]) { box(c, s * 36 - 22, -220, 44, 72, 5, sh(k, 0.14), 1.3); box(c, s * 36 - 22, -132, 44, 96, 5, sh(k, 0.14), 1.3); }
      oval(c, -9, -126, 3.4, 3.4, '#e8c870', 1.2); oval(c, 9, -126, 3.4, 3.4, '#e8c870', 1.2);
      box(c, -86, -254, 172, 14, 5, sh(k, 0.18));
    } });
  def('vanity', { name: '梳妆台', cat: 'bedroom', kind: 'floor', w: 170, h: 226, colors: ['#fff4e6', '#f4c2cc', '#d9a877', '#a9d6c6'], use: { act: 'mirror', dy: 22, back: true },
    draw(c, it) {
      const k = it.color, d = sh(k, -0.1);
      oval(c, 0, -160, 50, 64, sh(k, 0.1));
      ell(c, 0, -160, 41, 55);
      c.save(); c.clip();
      c.fillStyle = lg(c, -30, -210, 30, -110, ['#e4f5fa', '#bcdfe8', '#eaf8fb']); c.fillRect(-50, -220, 100, 120);
      poly(c, [-30, -220, -10, -220, -40, -110, -60, -110], 'rgba(255,255,255,0.4)', 0);
      c.restore();
      box(c, -82, -100, 164, 18, 6, sh(k, 0.14));
      box(c, -76, -84, 152, 34, 5, k);
      box(c, -66, -78, 62, 22, 3, d, 1.4); box(c, 4, -78, 62, 22, 3, d, 1.4);
      oval(c, -35, -67, 2.6, 2.6, '#e8c870', 1); oval(c, 35, -67, 2.6, 2.6, '#e8c870', 1);
      box(c, -74, -52, 11, 52, 3, d); box(c, 63, -52, 11, 52, 3, d);
      box(c, -50, -112, 14, 14, 3, '#f27a93', 1.3); oval(c, 46, -106, 8, 8, '#c9b8f0', 1.3);
    } });
  def('nightstand', { name: '床头小灯柜', cat: 'bedroom', kind: 'floor', w: 96, h: 150, colors: WOODS, toggle: true, on: true, light: { x: 0, y: -118, r: 190 },
    draw(c, it) {
      const k = it.color, d = sh(k, -0.1);
      box(c, -40, -10, 9, 10, 2, sh(k, -0.2)); box(c, 31, -10, 9, 10, 2, sh(k, -0.2));
      box(c, -44, -82, 88, 74, 6, k);
      box(c, -36, -74, 72, 26, 3, d, 1.4); box(c, -36, -42, 72, 26, 3, d, 1.4);
      oval(c, 0, -61, 3, 3, '#e8c870', 1.1); oval(c, 0, -29, 3, 3, '#e8c870', 1.1);
      box(c, -48, -90, 96, 11, 4, sh(k, 0.18));
      line(c, 0, -90, 0, -112, '#a88a7a', 5);
      c.beginPath(); c.moveTo(-14, -146); c.lineTo(14, -146); c.lineTo(30, -110); c.quadraticCurveTo(0, -103, -30, -110); c.closePath();
      fs(c, it.on ? '#fff3c4' : '#e4d6b0', ol('#e4d6b0'), 2);
    } });
  def('desk', { name: '小书桌', cat: 'bedroom', kind: 'floor', w: 200, h: 170, colors: WOODS, use: { act: 'study', dy: 24, back: true, arm: 'play' }, surface: { y: -96, w: 90, x: 44 },
    draw(c, it) {
      const k = it.color, d = sh(k, -0.14);
      box(c, -92, -86, 13, 86, 3, d); box(c, 79, -86, 13, 86, 3, d);
      box(c, 20, -84, 62, 62, 4, k); box(c, 26, -78, 50, 22, 3, d, 1.3); box(c, 26, -50, 50, 22, 3, d, 1.3);
      box(c, -100, -104, 200, 24, 8, sh(k, 0.14));
      gloss(c, -84, -100, 110, 4, 0.5);
      box(c, -52, -162, 80, 54, 5, '#7a8498'); box(c, -46, -156, 68, 42, 3, '#bfe6f2', 1.2);
      poly(c, [-58, -108, 34, -108, 42, -100, -66, -100], '#8a94a8', 1.6);
    } });

  // ---------- 厨房 ----------
  def('fridge', { name: '奶油冰箱', cat: 'kitchen', kind: 'floor', w: 126, h: 240, colors: ['#ffe9d2', '#bfe6e0', '#f7c3cf', '#d5dcf0', '#fffdf8'], use: { act: 'fridge', dy: 22, back: true },
    draw(c, it) {
      const k = it.color;
      box(c, -54, -12, 12, 12, 3, '#9a8a90'); box(c, 42, -12, 12, 12, 3, '#9a8a90');
      box(c, -60, -238, 120, 228, 20, k);
      line(c, -60, -166, 60, -166, ol(k), 2);
      gloss(c, -48, -228, 14, 54, 0.45); gloss(c, -48, -156, 14, 120, 0.3);
      box(c, 40, -214, 8, 36, 4, METAL, 1.5); box(c, 40, -154, 8, 60, 4, METAL, 1.5);
      CT.heartPath(c, -12, -128, 7); fs(c, '#f27a93', ol('#f27a93'), 1.3);
      oval(c, 12, -112, 6, 6, '#ffd977', 1.3); box(c, -22, -104, 18, 14, 2, WHITE, 1.2);
    } });
  def('stove', { name: '小灶台', cat: 'kitchen', kind: 'floor', w: 156, h: 176, colors: ['#fff4e6', '#f7c3cf', '#bfe6e0', '#d9d3cc'], use: { act: 'cook', dy: 24, back: true, arm: 'hold', hold: 'pan' }, anim: true,
    draw(c, it, t) {
      const k = it.color, d = sh(k, -0.12);
      box(c, -74, -116, 148, 116, 8, k);
      box(c, -60, -90, 120, 74, 6, '#4f4752');
      box(c, -50, -80, 100, 54, 4, it.busy ? '#8a4a3a' : '#6a6270', 1.5);
      box(c, -56, -102, 112, 6, 3, METAL, 1.3);
      box(c, -78, -126, 156, 14, 5, sh(k, 0.12));
      for (const x of [-34, 34]) { ell(c, x, -130, 26, 6); fs(c, '#4f4752', '#3a3440', 1.5); }
      if (it.busy) { ell(c, 34, -130, 20, 4.6); fs(c, '#ff8a4a'); }
      for (const x of [-44, -22, 0, 22, 44]) oval(c, x, -108, 3.6, 3.6, d, 1.2);
      // 小锅
      box(c, 8, -168, 52, 34, 9, '#e87a7a');
      box(c, 2, -172, 64, 9, 4, sh('#e87a7a', -0.12));
      oval(c, 34, -177, 4, 3, '#fffdf8', 1.2);
      gloss(c, 16, -160, 20, 4, 0.5);
    } });
  def('counter', { name: '料理台', cat: 'kitchen', kind: 'floor', w: 180, h: 132, colors: ['#bfe6e0', '#fff4e6', '#f7c3cf', '#d9a877'], surface: { y: -122, w: 80, x: -44 }, use: { act: 'wash', dx: 44, dy: 24, back: true },
    draw(c, it) {
      const k = it.color, d = sh(k, -0.1);
      box(c, -88, -112, 176, 112, 7, k);
      box(c, -78, -102, 76, 92, 5, d, 1.5); box(c, 2, -102, 76, 92, 5, d, 1.5);
      oval(c, -10, -56, 3.2, 3.2, '#e8c870', 1.1); oval(c, 10, -56, 3.2, 3.2, '#e8c870', 1.1);
      box(c, -92, -128, 184, 20, 6, WHITE);
      ell(c, 46, -119, 32, 7); fs(c, '#c8ccd8', '#9aa0b0', 1.5);
      c.beginPath(); c.moveTo(46, -126); c.lineTo(46, -150); c.quadraticCurveTo(46, -160, 58, -158); c.strokeStyle = '#9aa0b0'; c.lineWidth = 4.6; c.lineCap = 'round'; c.stroke();
    } });
  def('diningTable', { name: '大餐桌', cat: 'kitchen', kind: 'floor', w: 246, h: 118, colors: ['#fffdf8', '#ffd3df', '#d5ecd0', '#cfe6f5', '#ffe9b8'], surface: { y: -104, w: 214 },
    draw(c, it) {
      const k = it.color;
      box(c, -102, -94, 14, 94, 4, WD); box(c, 88, -94, 14, 94, 4, WD);
      box(c, -118, -118, 236, 28, 10, sh(WL, 0.1));
      rr(c, -122, -116, 244, 40, 10); fs(c, k, ol(k), 2);
      c.fillStyle = sh(k, -0.1);
      c.beginPath(); c.moveTo(-122, -90);
      for (let i = 0; i <= 8; i++) { const x = -122 + i * 30.5; c.quadraticCurveTo(x - 15, -66, x, -90 + (i === 8 ? 0 : 0)); }
      c.lineTo(122, -96); c.lineTo(-122, -96); c.closePath(); c.fill(); c.strokeStyle = ol(k); c.lineWidth = 1.6; c.stroke();
    } });
  def('chair', { name: '木椅子', cat: 'kitchen', kind: 'floor', w: 88, h: 142, colors: WOODS, seats: [[0, -60]],
    draw(c, it) {
      const k = it.color, d = sh(k, -0.14);
      box(c, -32, -48, 9, 48, 3, d); box(c, 23, -48, 9, 48, 3, d);
      box(c, -36, -140, 72, 74, 22, k);
      box(c, -24, -128, 48, 18, 7, d, 1.3);
      box(c, -40, -70, 80, 22, 8, sh(k, 0.14));
      gloss(c, -28, -66, 34, 4, 0.5);
    } });
  def('stool', { name: '圆凳', cat: 'kitchen', kind: 'floor', w: 74, h: 74, colors: SOFT, seats: [[0, -66]],
    draw(c, it) {
      const d = sh(WL, -0.14);
      box(c, -26, -52, 8, 52, 3, d); box(c, 18, -52, 8, 52, 3, d);
      oval(c, 0, -62, 34, 12, it.color);
      gloss(c, -16, -68, 26, 4, 0.45);
    } });

  // ---------- 浴室 ----------
  def('bathtub', { name: '泡泡浴缸', cat: 'bath', kind: 'floor', w: 252, h: 150, colors: ['#fffdf8', '#f7c3cf', '#bfe6e0', '#d5dcf0'], tub: [0, -46],
    draw(c, it) {
      const k = it.color;
      ell(c, 0, -106, 118, 28); fs(c, sh(k, -0.1), ol(k), 2);
      ell(c, 0, -106, 104, 21); fs(c, '#bfe9f4');
    },
    over(c, it, t) {
      const k = it.color;
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * 6.28, r = 7 + (i % 3) * 3;
        const x = Math.cos(a) * 88, y = -102 + Math.sin(a) * 11 + Math.sin(t * 2 + i) * 1.4;
        ell(c, x, y, r, r * 0.86); fs(c, 'rgba(255,255,255,0.96)', 'rgba(170,205,225,0.8)', 1);
      }
      c.beginPath(); c.moveTo(-120, -106); c.quadraticCurveTo(0, -64, 120, -106); c.quadraticCurveTo(118, -24, 88, -18); c.lineTo(-88, -18); c.quadraticCurveTo(-118, -24, -120, -106); c.closePath();
      fs(c, lg(c, 0, -106, 0, -18, [sh(k, 0.3), sh(k, -0.08)]), ol(k), 2);
      gloss(c, -86, -74, 70, 6, 0.45);
      for (const s of [-1, 1]) { oval(c, s * 84, -8, 12, 9, '#e8c870', 1.6); }
      box(c, 104, -134, 8, 28, 3, METAL, 1.4); oval(c, 108, -138, 8, 4, METAL, 1.3);
    } });
  def('sinkMirror', { name: '洗手台', cat: 'bath', kind: 'floor', w: 132, h: 236, colors: ['#fffdf8', '#bfe6e0', '#f7c3cf'], use: { act: 'wash', dy: 22, back: true },
    draw(c, it) {
      const k = it.color;
      oval(c, 0, -190, 40, 44, sh(WL, 0.14));
      ell(c, 0, -190, 33, 37); fs(c, lg(c, -20, -220, 20, -160, ['#e4f5fa', '#bcdfe8']));
      poly(c, [-18, -222, -6, -222, -26, -160, -36, -160], 'rgba(255,255,255,0.45)', 0);
      box(c, -22, -96, 44, 96, 8, sh(k, -0.04));
      c.beginPath(); c.moveTo(-58, -112); c.lineTo(58, -112); c.quadraticCurveTo(52, -76, 22, -74); c.lineTo(-22, -74); c.quadraticCurveTo(-52, -76, -58, -112); c.closePath();
      fs(c, k, ol(k), 2);
      ell(c, 0, -111, 44, 7); fs(c, '#d9eef4', '#a8c0cc', 1.4);
      box(c, -4, -130, 8, 16, 3, METAL, 1.3); line(c, 0, -128, 13, -124, METAL, 4);
    } });

  // ---------- 摆设 ----------
  function pot(c, y, h, w, col) {
    c.beginPath(); c.moveTo(-w / 2, y); c.lineTo(w / 2, y); c.lineTo(w * 0.36, y + h); c.lineTo(-w * 0.36, y + h); c.closePath();
    fs(c, lg(c, 0, y, 0, y + h, [sh(col, 0.12), sh(col, -0.1)]), ol(col), 2);
    box(c, -w / 2 - 3, y - 5, w + 6, 11, 4, sh(col, 0.08));
  }
  function leaf(c, x, y, len, ang, col) {
    c.save(); c.translate(x, y); c.rotate(ang);
    c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(len * 0.3, -len * 0.42, len * 0.8, -len * 0.3, len, 0); c.bezierCurveTo(len * 0.8, len * 0.3, len * 0.3, len * 0.42, 0, 0); c.closePath();
    fs(c, col, ol(col, 0.36), 1.7);
    line(c, 2, 0, len * 0.86, 0, ol(col, 0.2), 1.1);
    for (const f of [0.3, 0.5, 0.7]) { line(c, len * f, 0, len * (f + 0.1), -len * 0.2, ol(col, 0.2), 0.9); line(c, len * f, 0, len * (f + 0.1), len * 0.2, ol(col, 0.2), 0.9); }
    c.restore();
  }
  def('monstera', { name: '大叶绿植', cat: 'decor', kind: 'floor', w: 136, h: 196, colors: ['#e9c6a0', '#fffdf8', '#f7b3c2', '#a8d8ea'], use: { act: 'water', dx: 56, dy: 14, arm: 'hold', hold: 'can' }, anim: true,
    draw(c, it, t) {
      const g = '#6cbb7c', sw = Math.sin(t * 1.1 + (it.seed || 0)) * 0.03;
      const stems = [[-1.9, 96], [-1.2, 110], [-2.5, 84], [-0.65, 88], [-1.55, 72], [-2.2, 60], [-0.95, 62]];
      stems.forEach((s, i) => leaf(c, 0, -70, s[1], s[0] + sw, i % 2 ? g : sh(g, 0.14)));
      pot(c, -68, 66, 76, it.color);
      const n = it.grow || 0;
      for (let i = 0; i < Math.min(n, 5); i++) oval(c, -40 + i * 21, -128 - (i % 2) * 28, 5.4, 5.4, '#ffd977', 1.2);
    } });
  def('flowerPot', { name: '小花盆', cat: 'decor', kind: 'floor', w: 86, h: 112, colors: ['#ff8fb1', '#ffd35c', '#ffa56b', '#b89cf0', '#ff7a7a', '#7ec8f0'], use: { act: 'water', dx: 42, dy: 12, arm: 'hold', hold: 'can' },
    draw(c, it) {
      const k = it.color, n = 3 + Math.min(it.grow || 0, 4);
      for (let i = 0; i < n; i++) {
        const a = -1.57 + ((i - (n - 1) / 2) * 1.9) / n, r = 42 + (i % 2) * 18;
        const x = Math.cos(a) * r, y = -46 + Math.sin(a) * r;
        line(c, 0, -46, x, y, '#6cbb7c', 3);
        for (let p = 0; p < 5; p++) { const pa = (p * 6.28) / 5; ell(c, x + Math.cos(pa) * 6.2, y + Math.sin(pa) * 6.2, 5.4, 5.4); fs(c, k, ol(k, 0.3), 1.1); }
        oval(c, x, y, 3.6, 3.6, '#ffe27a', 1);
      }
      pot(c, -46, 44, 56, '#e7a98c');
    } });
  def('cactus', { name: '仙人球', cat: 'decor', kind: 'floor', w: 70, h: 104, colors: ['#fffdf8', '#f7b3c2', '#a8d8ea'], use: { act: 'water', dx: 38, dy: 12, arm: 'hold', hold: 'can' },
    draw(c, it) {
      const g = '#7cc68c';
      rr(c, -19, -100, 38, 64, 18); fs(c, g, ol(g, 0.36), 2);
      rr(c, 12, -82, 24, 16, 8); fs(c, g, ol(g, 0.36), 1.6); rr(c, 24, -92, 12, 24, 6); fs(c, g, ol(g, 0.36), 1.6);
      for (const x of [-9, 0, 9]) line(c, x, -92, x, -46, ol(g, 0.18), 1);
      oval(c, 0, -104, 6, 6, '#ff8fb1', 1.2);
      pot(c, -40, 38, 54, it.color);
    } });
  def('teddy', { name: '泰迪熊', cat: 'decor', kind: 'floor', w: 104, h: 112, colors: ['#d9a877', '#f7c3cf', '#fffdf8', '#a8c8e8'], use: { act: 'hug' },
    draw(c, it) {
      const k = it.color, l = sh(k, 0.36);
      oval(c, -30, -14, 17, 13, k); oval(c, 30, -14, 17, 13, k);
      oval(c, 0, -38, 32, 34, k); oval(c, 0, -32, 20, 22, l, 1.3);
      oval(c, -32, -52, 11, 15, k); oval(c, 32, -52, 11, 15, k);
      oval(c, -24, -100, 12, 12, k); oval(c, 24, -100, 12, 12, k);
      oval(c, -24, -100, 6, 6, l, 1); oval(c, 24, -100, 6, 6, l, 1);
      oval(c, 0, -80, 31, 28, k); oval(c, 0, -72, 13, 10, l, 1.2);
      ell(c, -13, -84, 3, 3.4); fs(c, '#4a3038'); ell(c, 13, -84, 3, 3.4); fs(c, '#4a3038');
      ell(c, 0, -76, 3.6, 2.6); fs(c, '#4a3038');
      line(c, -4, -68, 0, -66, '#4a3038', 1.4); line(c, 4, -68, 0, -66, '#4a3038', 1.4);
      c.beginPath(); c.moveTo(-3, -54); c.lineTo(-16, -60); c.lineTo(-16, -48); c.closePath(); c.moveTo(3, -54); c.lineTo(16, -60); c.lineTo(16, -48); c.closePath(); fs(c, '#f27a93', ol('#f27a93'), 1.3);
      oval(c, 0, -54, 3.4, 3.4, '#e85a7a', 1.1);
    } });
  def('bunnyPlush', { name: '兔兔玩偶', cat: 'decor', kind: 'floor', w: 80, h: 128, colors: ['#fffdf8', '#f7c3cf', '#d8d0e8'], use: { act: 'hug' },
    draw(c, it) {
      const k = it.color;
      for (const s of [-1, 1]) {
        ell(c, s * 14, -100, 9.5, 28, s * 0.14); fs(c, k, ol(k, 0.3), 2);
        ell(c, s * 14, -100, 4.6, 20, s * 0.14); fs(c, '#ffc2d0');
      }
      oval(c, -19, -9, 13, 9, k); oval(c, 19, -9, 13, 9, k);
      oval(c, 0, -34, 26, 28, k);
      oval(c, -25, -40, 9, 12, k); oval(c, 25, -40, 9, 12, k);
      oval(c, 0, -66, 27, 24, k);
      ell(c, -11, -68, 2.8, 3.3); fs(c, '#4a3038'); ell(c, 11, -68, 2.8, 3.3); fs(c, '#4a3038');
      ell(c, 0, -60, 2.4, 1.7); fs(c, '#f27a93');
      ell(c, -18, -60, 5, 3); fs(c, 'rgba(255,140,160,0.4)'); ell(c, 18, -60, 5, 3); fs(c, 'rgba(255,140,160,0.4)');
    } });
  def('aquarium', { name: '小鱼缸', cat: 'decor', kind: 'floor', w: 184, h: 176, colors: WOODS, anim: true, use: { act: 'look' },
    draw(c, it, t) {
      const k = it.color;
      box(c, -86, -66, 172, 66, 6, k); box(c, -74, -56, 148, 44, 4, sh(k, -0.1), 1.4);
      rr(c, -82, -172, 164, 106, 8); fs(c, lg(c, 0, -172, 0, -66, ['#b6ecf5', '#6cc8de']), '#6fa8b8', 2.2);
      c.save(); rr(c, -80, -170, 160, 102, 7); c.clip();
      c.fillStyle = '#f0ddac'; c.beginPath(); c.moveTo(-82, -66); c.lineTo(-82, -80); c.quadraticCurveTo(0, -96, 82, -78); c.lineTo(82, -66); c.closePath(); c.fill();
      for (let i = 0; i < 4; i++) {
        const x = -62 + i * 40, sw = Math.sin(t * 1.4 + i) * 6;
        c.beginPath(); c.moveTo(x, -76); c.quadraticCurveTo(x + sw, -102, x - sw * 0.6, -128); c.strokeStyle = '#5cb88a'; c.lineWidth = 4; c.lineCap = 'round'; c.stroke();
      }
      const fish = ['#ff8a5c', '#ffd35c', '#ff8fb1'];
      fish.forEach((col, i) => {
        const p = t * (0.6 + i * 0.17) + i * 2, x = Math.sin(p) * 62, y = -142 + i * 20 + Math.sin(p * 2.3) * 7, dir = Math.cos(p) > 0 ? 1 : -1;
        c.save(); c.translate(x, y); c.scale(dir, 1);
        c.beginPath(); c.moveTo(-10, 0); c.lineTo(-20, -7); c.lineTo(-20, 7); c.closePath(); c.fillStyle = col; c.fill();
        ell(c, 0, 0, 13, 8); c.fill();
        ell(c, 6, -2, 1.7, 1.7); fs(c, '#3a2838');
        c.restore();
      });
      c.fillStyle = 'rgba(255,255,255,0.75)';
      for (let i = 0; i < 6; i++) {
        const y = -70 - ((t * 26 + i * 37) % 100), x = -40 + i * 18 + Math.sin(t + i) * 4;
        ell(c, x, y, 2 + (i % 2), 2 + (i % 2)); c.fill();
      }
      c.restore();
      gloss(c, -70, -162, 10, 56, 0.45);
    } });
  def('giftBox', { name: '神秘礼物', cat: 'decor', kind: 'floor', w: 82, h: 92, colors: ['#ff8fb1', '#8fb8ff', '#ffd35c', '#7cc6a4', '#b89cf0'], use: { act: 'gift' },
    draw(c, it) {
      const k = it.color, r = '#fffdf8';
      box(c, -34, -56, 68, 56, 6, k); c.fillStyle = r; c.fillRect(-6, -55, 12, 54);
      box(c, -39, -68, 78, 19, 5, sh(k, 0.14)); c.fillRect(-6, -67, 12, 17);
      c.beginPath(); c.moveTo(0, -68); c.bezierCurveTo(-30, -96, -36, -66, 0, -68); c.moveTo(0, -68); c.bezierCurveTo(30, -96, 36, -66, 0, -68); fs(c, r, ol(k), 2);
      oval(c, 0, -69, 5, 5, r, 1.6);
    } });
  def('balloons', { name: '气球束', cat: 'decor', kind: 'floor', w: 112, h: 236, colors: ['#ff8fb1', '#8fb8ff', '#ffd35c'], anim: true,
    draw(c, it, t) {
      const base = it.color, cols = [base, sh(base, 0.3), mix(base, '#8fb8ff', 0.6)];
      box(c, -10, -12, 20, 12, 4, '#c9a6b8');
      [[-30, -186], [28, -200], [2, -156]].forEach((p, i) => {
        const bx = p[0] + Math.sin(t * 1.3 + i) * 5, by = p[1] + Math.cos(t * 1.1 + i) * 4;
        c.beginPath(); c.moveTo(0, -12); c.quadraticCurveTo(bx * 0.4, by * 0.45, bx, by + 34); c.strokeStyle = '#b8a8b8'; c.lineWidth = 1.2; c.stroke();
        c.beginPath(); c.ellipse(bx, by, 28, 33, 0, 0, 7); fs(c, cols[i], ol(cols[i], 0.3), 1.8);
        ell(c, bx - 9, by - 12, 6, 10, 0.4); fs(c, 'rgba(255,255,255,0.5)');
      });
    } });
  def('easel', { name: '小画架', cat: 'decor', kind: 'floor', w: 124, h: 196, colors: WOODS, variants: 4, use: { act: 'paint', dy: 24, back: true, arm: 'hold', hold: 'brush' },
    draw(c, it) {
      const k = it.color, d = sh(k, -0.14), v = (it.variant || 0) % 4;
      line(c, -46, 0, -8, -190, ol(k), 8); line(c, -46, 0, -8, -190, k, 5);
      line(c, 46, 0, 8, -190, ol(k), 8); line(c, 46, 0, 8, -190, k, 5);
      line(c, 0, -30, 0, -180, ol(k), 8); line(c, 0, -30, 0, -180, d, 5);
      box(c, -48, -70, 96, 10, 3, k);
      box(c, -46, -182, 92, 112, 3, WHITE);
      c.save(); rr(c, -42, -178, 84, 104, 2); c.clip();
      const seed = (it.seed || 1) + v * 17;
      if (v === 0) { c.fillStyle = lg(c, 0, -178, 0, -74, ['#a8e0f0', '#fff0d0']); c.fillRect(-46, -180, 92, 110); oval(c, 16, -148, 14, 14, '#ffd35c', 0); c.fillStyle = '#9fdc8e'; c.beginPath(); c.ellipse(-14, -74, 56, 30, 0, 0, 7); c.fill(); }
      else if (v === 1) { c.fillStyle = '#ffe8ee'; c.fillRect(-46, -180, 92, 110); for (let i = 0; i < 9; i++) { const px = -36 + CT.hash(i, 1, seed) * 72, py = -168 + CT.hash(i, 2, seed) * 86; ell(c, px, py, 8, 8); c.fillStyle = ['#ff8fb1', '#ffd35c', '#8fb8ff', '#b89cf0'][i % 4]; c.fill(); } }
      else if (v === 2) { c.fillStyle = '#2d3a78'; c.fillRect(-46, -180, 92, 110); c.fillStyle = '#ffe9a8'; for (let i = 0; i < 16; i++) { CT.starPath(c, -40 + CT.hash(i, 3, seed) * 80, -172 + CT.hash(i, 4, seed) * 90, 3.4, 1.4, 4); c.fill(); } ell(c, 18, -150, 13, 13); c.fill(); }
      else { c.fillStyle = '#fff5e0'; c.fillRect(-46, -180, 92, 110); ['#f27a93', '#ffb07a', '#ffd977', '#9fdc8e', '#8fb8ff', '#b89cf0'].forEach((col, i) => { c.beginPath(); c.arc(0, -72, 62 - i * 9, 3.14, 6.28); c.strokeStyle = col; c.lineWidth = 8; c.stroke(); }); }
      c.restore();
    } });
  def('catBed', { name: '猫窝', cat: 'decor', kind: 'floor', w: 118, h: 58, colors: SOFT,
    draw(c, it) {
      const k = it.color;
      ell(c, 0, -22, 56, 22); fs(c, sh(k, -0.1), ol(k), 2);
      ell(c, 0, -26, 42, 13); fs(c, sh(k, 0.42));
      c.beginPath(); c.moveTo(-56, -22); c.quadraticCurveTo(0, 18, 56, -22); c.quadraticCurveTo(0, 2, -56, -22); fs(c, k, ol(k), 1.6);
    } });
  def('globe', { name: '地球仪', cat: 'decor', kind: 'floor', w: 84, h: 112, colors: ['#8fc8e8', '#ffb8c8', '#b9dba4'],
    draw(c, it, t) {
      const k = it.color;
      box(c, -24, -10, 48, 10, 5, WD);
      line(c, 0, -10, 0, -22, WD, 6);
      c.beginPath(); c.arc(0, -66, 40, -1.1, 1.9); c.strokeStyle = ol(WD); c.lineWidth = 3.4; c.stroke();
      oval(c, 0, -66, 33, 33, k);
      c.save(); ell(c, 0, -66, 32, 32); c.clip();
      c.fillStyle = '#9fdc8e';
      for (let i = 0; i < 4; i++) { const x = ((t * 7 + i * 34) % 92) - 46; ell(c, x, -78 + i * 14, 11, 7); c.fill(); }
      c.restore();
      ell(c, -11, -78, 7, 11, 0.5); fs(c, 'rgba(255,255,255,0.4)');
    }, anim: true });
  def('telescope', { name: '观星望远镜', cat: 'decor', kind: 'floor', w: 120, h: 186, colors: ['#c9b8f0', '#8fb8ff', '#f7b3c2', '#4a4a6a'], use: { act: 'stars', dx: -46, dy: 16, arm: 'heart' },
    draw(c, it) {
      const k = it.color;
      line(c, 0, -96, -36, 0, ol(WD), 8); line(c, 0, -96, -36, 0, WD, 5);
      line(c, 0, -96, 36, 0, ol(WD), 8); line(c, 0, -96, 36, 0, WD, 5);
      line(c, 0, -96, 0, -2, ol(WD), 7); line(c, 0, -96, 0, -2, sh(WD, -0.12), 4);
      c.save(); c.translate(2, -110); c.rotate(-0.6);
      box(c, -54, -13, 78, 26, 7, k); box(c, 22, -18, 46, 36, 6, sh(k, 0.18)); box(c, -66, -8, 14, 16, 3, '#5a4a5a');
      c.restore();
    } });
  def('xmasTree', { name: '星光圣诞树', cat: 'decor', kind: 'floor', w: 170, h: 252, colors: ['#6cbb7c', '#8fd0c4', '#f7b3c2'], toggle: true, on: true, anim: true, light: { x: 0, y: -110, r: 240, c: '#ffe2a8' },
    draw(c, it, t) {
      const k = it.color;
      box(c, -14, -34, 28, 26, 4, '#a8724e'); box(c, -30, -22, 60, 22, 6, '#e87a7a');
      [[-30, 82], [-82, 66], [-130, 50]].forEach((l, i) => {
        c.beginPath(); c.moveTo(0, l[0] - 96); c.quadraticCurveTo(l[1] * 0.2, l[0] - 50, l[1], l[0]); c.quadraticCurveTo(0, l[0] + 18, -l[1], l[0]); c.quadraticCurveTo(-l[1] * 0.2, l[0] - 50, 0, l[0] - 96); c.closePath();
        fs(c, sh(k, i * 0.06), ol(k, 0.36), 2);
      });
      const cols = ['#ff8fb1', '#ffd35c', '#8fd8ff', '#fffdf8', '#ff9a5c'];
      for (let i = 0; i < 18; i++) {
        const lvl = i % 3, sp = 60 - lvl * 16, x = (CT.hash(i, 1, 4) - 0.5) * sp * 2, y = -44 - lvl * 54 - CT.hash(i, 2, 4) * 26;
        const lit = it.on && Math.sin(t * 3 + i) > -0.4;
        ell(c, x, y, 4, 4); fs(c, lit ? cols[i % 5] : sh(cols[i % 5], -0.28), 'rgba(90,52,72,0.5)', 1);
      }
      CT.starPath(c, 0, -224, 17, 7.4, 5); fs(c, '#ffe07a', '#d8a848', 1.6);
    } });

  // ---------- 墙饰（原点在中心） ----------
  function frame(c, x, y, w, h, col, curtain, env, t) {
    box(c, x - 7, y - 7, w + 14, h + 14, 9, col);
    skyView(c, x, y, w, h, env, () => CT.rrect(c, x, y, w, h, 4));
  }
  def('windowA', { name: '方窗', cat: 'wall', kind: 'wall', w: 206, h: 216, colors: ['#ffb8c8', '#a8d8ea', '#ffe29a', '#b9dba4', '#c9b8f0', '#f6efe6'], window: true, anim: true,
    draw(c, it, t, env) {
      const k = it.color, x = -74, y = -92, w = 148, h = 176;
      frame(c, x, y, w, h, CREAM, k, env, t);
      line(c, 0, y, 0, y + h, ol(CREAM, 0.16), 6); line(c, 0, y, 0, y + h, CREAM, 4);
      line(c, x, y + 76, x + w, y + 76, ol(CREAM, 0.16), 6); line(c, x, y + 76, x + w, y + 76, CREAM, 4);
      box(c, x - 16, y + h + 5, w + 32, 13, 4, sh(WL, 0.14));
      for (const s of [-1, 1]) {
        c.beginPath(); c.moveTo(s * 100, -104); c.lineTo(s * 48, -104); c.quadraticCurveTo(s * 66, -22, s * 92, -4); c.quadraticCurveTo(s * 98, 34, s * 100, 96); c.closePath();
        fs(c, lg(c, s * 48, 0, s * 100, 0, [sh(k, 0.3), k]), ol(k, 0.36), 2);
      }
      box(c, -106, -114, 212, 12, 6, WD);
    } });
  def('windowArch', { name: '拱形大窗', cat: 'wall', kind: 'wall', w: 186, h: 246, colors: ['#fff4e6', '#d9a877', '#a9d6c6', '#f4c2cc'], window: true, anim: true,
    draw(c, it, t, env) {
      const k = it.color, w = 142, h = 214, x = -71, y = -106;
      const path = (pad) => { c.moveTo(x - pad, y + h + pad); c.lineTo(x - pad, y + 71); c.arc(0, y + 71, 71 + pad, 3.1416, 0); c.lineTo(-x + pad, y + h + pad); c.closePath(); };
      c.beginPath(); path(9); fs(c, k, ol(k), 2);
      skyView(c, x, y, w, h, env, () => path(0));
      c.strokeStyle = k; c.lineWidth = 5; c.beginPath(); c.moveTo(0, y); c.lineTo(0, y + h); c.moveTo(x, y + 74); c.lineTo(-x, y + 74); c.moveTo(x, y + 144); c.lineTo(-x, y + 144); c.stroke();
      box(c, x - 14, y + h + 8, w + 28, 12, 4, sh(k, 0.1));
    } });
  def('windowRound', { name: '圆窗', cat: 'wall', kind: 'wall', w: 150, h: 150, colors: ['#d9a877', '#fff4e6', '#a9d6c6', '#f4c2cc'], window: true, anim: true,
    draw(c, it, t, env) {
      const k = it.color;
      oval(c, 0, 0, 74, 74, k);
      skyView(c, -64, -64, 128, 128, env, () => c.arc(0, 0, 63, 0, 6.3));
      c.strokeStyle = k; c.lineWidth = 5; c.beginPath(); c.moveTo(0, -64); c.lineTo(0, 64); c.moveTo(-64, 0); c.lineTo(64, 0); c.stroke();
    } });
  def('painting', { name: '小挂画', cat: 'wall', kind: 'wall', w: 150, h: 118, colors: WOODS, variants: 4,
    draw(c, it) {
      const k = it.color, v = (it.variant || 0) % 4;
      box(c, -75, -59, 150, 118, 4, k);
      c.save(); rr(c, -64, -48, 128, 96, 2); c.clip();
      if (v === 0) {
        c.fillStyle = lg(c, 0, -48, 0, 48, ['#a8e0f0', '#fff0d0']); c.fillRect(-64, -48, 128, 96);
        oval(c, 34, -22, 14, 14, '#ffd35c', 0);
        c.fillStyle = '#9fdc8e'; ell(c, -30, 52, 70, 42); c.fill(); c.fillStyle = '#7fcf8c'; ell(c, 40, 56, 66, 34); c.fill();
      } else if (v === 1) {
        c.fillStyle = '#fff0e8'; c.fillRect(-64, -48, 128, 96);
        for (const p of [[-24, 8, '#ff8fb1'], [0, -14, '#ffd35c'], [24, 8, '#b89cf0']]) {
          line(c, p[0], p[1], 0, 46, '#6cbb7c', 3);
          for (let i = 0; i < 6; i++) { const a = (i * 6.28) / 6; ell(c, p[0] + Math.cos(a) * 9, p[1] + Math.sin(a) * 9, 7, 7); c.fillStyle = p[2]; c.fill(); }
          ell(c, p[0], p[1], 5, 5); c.fillStyle = '#ffe9a8'; c.fill();
        }
      } else if (v === 2) {
        c.fillStyle = '#ffe2b0'; c.fillRect(-64, -48, 128, 96);
        oval(c, 0, 14, 34, 32, '#fffdf8', 1.5);
        poly(c, [-30, -4, -24, -32, -8, -16], '#fffdf8', 1.5); poly(c, [30, -4, 24, -32, 8, -16], '#fffdf8', 1.5);
        ell(c, -12, 8, 3.4, 4.2); fs(c, '#3a2838'); ell(c, 12, 8, 3.4, 4.2); fs(c, '#3a2838'); ell(c, 0, 16, 2.6, 1.8); fs(c, '#f27a93');
      } else {
        c.fillStyle = '#26305c'; c.fillRect(-64, -48, 128, 96);
        c.fillStyle = '#ffe9a8'; for (let i = 0; i < 16; i++) { CT.starPath(c, -58 + CT.hash(i, 7, 2) * 116, -42 + CT.hash(i, 8, 2) * 66, 3, 1.3, 4); c.fill(); }
        ell(c, 30, -18, 16, 16); c.fill(); ell(c, 38, -22, 14, 14); c.fillStyle = '#26305c'; c.fill();
        c.fillStyle = '#3f4d86'; ell(c, -10, 62, 90, 34); c.fill();
      }
      c.restore();
    } });
  def('clock', { name: '挂钟', cat: 'wall', kind: 'wall', w: 96, h: 96, colors: ['#fff4e6', '#f7b3c2', '#a8d8ea', '#ffd59e'], anim: true,
    draw(c, it, t, env) {
      const k = it.color, h = env.hour || 0;
      oval(c, 0, 0, 46, 46, sh(WL, 0.08)); oval(c, 0, 0, 37, 37, k, 1.5);
      for (let i = 0; i < 12; i++) { const a = (i * 6.283) / 12; line(c, Math.cos(a) * 30, Math.sin(a) * 30, Math.cos(a) * 34, Math.sin(a) * 34, ol(k, 0.6), 2); }
      const ha = ((h % 12) / 12) * 6.283 - 1.5708, ma = ((h % 1)) * 6.283 - 1.5708;
      line(c, 0, 0, Math.cos(ha) * 18, Math.sin(ha) * 18, '#5a3448', 4); line(c, 0, 0, Math.cos(ma) * 27, Math.sin(ma) * 27, '#5a3448', 2.6);
      oval(c, 0, 0, 3.4, 3.4, '#f27a93', 1.1);
    } });
  def('wallShelf', { name: '墙上小架', cat: 'wall', kind: 'wall', w: 200, h: 110, colors: WOODS,
    draw(c, it) {
      const k = it.color;
      box(c, -98, 26, 196, 13, 4, k);
      poly(c, [-74, 38, -60, 38, -74, 52], sh(k, -0.14), 1.5); poly(c, [74, 38, 60, 38, 74, 52], sh(k, -0.14), 1.5);
      c.save(); c.translate(-58, 26); c.scale(0.72, 0.72); F.cactus.draw(c, { color: '#fffdf8' }); c.restore();
      [['#f27a93', 34], ['#8fb8ff', 42], ['#ffd977', 30], ['#7cc6a4', 38]].forEach((b, i) => box(c, -14 + i * 14, 26 - b[1], 12, b[1], 2, b[0], 1.3));
      c.save(); c.translate(68, 26); c.scale(0.7, 0.7); F.bunnyPlush.draw(c, { color: '#f7c3cf' }); c.restore();
    } });
  def('stringLights', { name: '星星串灯', cat: 'wall', kind: 'wall', w: 340, h: 80, colors: ['#ffe07a', '#ffb8c8', '#a8e0f0'], toggle: true, on: true, anim: true,
    lights(it) { const o = []; for (let i = 0; i < 5; i++) o.push({ x: -130 + i * 65, y: 22, r: 130, i: 0.34 }); return o; },
    draw(c, it, t) {
      c.beginPath(); c.moveTo(-168, -28);
      for (let i = 0; i < 4; i++) c.quadraticCurveTo(-126 + i * 84, 36, -84 + i * 84, -28);
      c.strokeStyle = '#8a6a70'; c.lineWidth = 2; c.stroke();
      for (let i = 0; i < 9; i++) {
        const x = -148 + i * 37, ph = (i * 37 + 20) / 84, y = -12 + Math.abs(Math.sin(ph * Math.PI)) * 16;
        const lit = it.on && Math.sin(t * 2 + i) > -0.6;
        CT.starPath(c, x, y + 6, 10, 4.6, 5); fs(c, lit ? it.color : sh(it.color, -0.26), ol(it.color, 0.3), 1.3);
      }
    } });
  def('mirrorWall', { name: '椭圆镜子', cat: 'wall', kind: 'wall', w: 110, h: 156, colors: ['#e8c870', '#fff4e6', '#f7b3c2'],
    draw(c, it) {
      oval(c, 0, 0, 52, 74, it.color);
      ell(c, 0, 0, 42, 64); fs(c, lg(c, -30, -60, 30, 60, ['#eaf8fb', '#bcdfe8', '#e4f5fa']));
      c.save(); ell(c, 0, 0, 42, 64); c.clip(); poly(c, [-24, -70, -2, -70, -44, 60, -60, 60], 'rgba(255,255,255,0.45)', 0); c.restore();
    } });
  def('photoFrame', { name: '合影相框', cat: 'wall', kind: 'wall', w: 104, h: 128, colors: WOODS,
    draw(c, it, t, env) {
      box(c, -52, -64, 104, 128, 4, it.color);
      c.save(); rr(c, -42, -54, 84, 108, 2); c.clip();
      c.fillStyle = lg(c, 0, -54, 0, 54, ['#bfe6f2', '#fff0e8']); c.fillRect(-44, -56, 88, 112);
      c.fillStyle = '#ffffff'; CT.cloudShape(c, 0, -26, 72, 20, 4); c.fill();
      if (env.mainLook) { c.translate(0, 100); c.scale(0.52, 0.52); CT.drawChar(c, env.mainLook, { t: 0.4, expr: 'happy', arm: 'wave' }); }
      c.restore();
    } });
  def('wallLamp', { name: '小壁灯', cat: 'wall', kind: 'wall', w: 80, h: 96, colors: ['#ffe29a', '#ffc8d8', '#b8e0ee'], toggle: true, on: true, light: { x: 0, y: 6, r: 200 },
    draw(c, it) {
      const k = it.color;
      box(c, -9, -8, 18, 44, 5, '#c8a878');
      c.beginPath(); c.moveTo(-14, -46); c.lineTo(14, -46); c.lineTo(36, 12); c.quadraticCurveTo(0, 22, -36, 12); c.closePath();
      fs(c, it.on ? sh(k, 0.34) : sh(k, -0.08), ol(k), 2);
    } });
  def('garland', { name: '彩旗', cat: 'wall', kind: 'wall', w: 340, h: 86, colors: ['#ff8fb1', '#8fb8ff', '#ffd35c', '#7cc6a4'],
    draw(c, it) {
      const cols = [it.color, '#ffd977', '#a8d8ea', '#c9e8b8', '#ffc8d8', '#d0c0f4'];
      c.beginPath(); c.moveTo(-166, -32); c.quadraticCurveTo(0, 26, 166, -32); c.strokeStyle = '#8a6a70'; c.lineWidth = 2; c.stroke();
      for (let i = 0; i < 9; i++) {
        const u = (i + 0.5) / 9, x = -166 + 332 * u, y = -32 + 4 * u * (1 - u) * 29, dy = (1 - 2 * u) * 12;
        poly(c, [x - 16, y - dy * 0.9, x + 16, y + dy * 0.9, x, y + 34], cols[i % 6], 1.6);
      }
    } });
  def('pendant', { name: '吊灯', cat: 'wall', kind: 'wall', w: 150, h: 180, colors: ['#ffe29a', '#ffc8d8', '#b8e0ee', '#fff4e6'], toggle: true, on: true, light: { x: 0, y: 60, r: 320 },
    draw(c, it) {
      const k = it.color;
      line(c, 0, -90, 0, 18, '#8a6a70', 3);
      c.beginPath(); c.moveTo(-18, 14); c.quadraticCurveTo(-72, 26, -74, 74); c.quadraticCurveTo(0, 92, 74, 74); c.quadraticCurveTo(72, 26, 18, 14); c.closePath();
      fs(c, it.on ? sh(k, 0.3) : k, ol(k), 2);
      ell(c, 0, 76, 26, 8); fs(c, it.on ? '#fff7d6' : '#e8e0d0');
    } });
  def('wallPlant', { name: '吊篮绿萝', cat: 'wall', kind: 'wall', w: 120, h: 190, colors: ['#e9c6a0', '#fffdf8', '#f7b3c2'], anim: true,
    draw(c, it, t) {
      for (const s of [-1, 0.2, 1]) line(c, 0, -92, s * 32, 8, '#a8886a', 1.8);
      for (let i = 0; i < 6; i++) {
        const x = -38 + i * 15, len = 28 + (i % 3) * 26, sw = Math.sin(t + i) * 3;
        c.beginPath(); c.moveTo(x, 18); c.quadraticCurveTo(x + sw, 18 + len / 2, x + sw * 1.6, 18 + len); c.strokeStyle = '#5cab6c'; c.lineWidth = 2.4; c.stroke();
        for (let j = 1; j <= 3; j++) leaf(c, x + (sw * j) / 2.2, 18 + (len * j) / 3, 15, (j % 2 ? 0.5 : 2.6), '#7cc68c');
      }
      c.save(); c.translate(0, 34); pot(c, -34, 36, 74, it.color); c.restore();
    } });
  def('towelRack', { name: '毛巾架', cat: 'wall', kind: 'wall', w: 150, h: 110, colors: ['#f7b3c2', '#a8d8ea', '#ffd59e', '#c9b8f0'],
    draw(c, it) {
      box(c, -72, -44, 144, 8, 4, METAL, 1.6);
      oval(c, -72, -40, 6, 6, METAL, 1.4); oval(c, 72, -40, 6, 6, METAL, 1.4);
      box(c, -52, -46, 52, 88, 5, it.color); box(c, 8, -46, 44, 66, 5, sh(it.color, 0.42));
      for (const y of [18, 28]) line(c, -48, y, -4, y, sh(it.color, -0.14), 2);
    } });
  def('corkBoard', { name: '心愿便签板', cat: 'wall', kind: 'wall', w: 170, h: 126, colors: WOODS,
    draw(c, it) {
      box(c, -85, -63, 170, 126, 5, it.color);
      box(c, -76, -54, 152, 108, 3, '#d8b88a', 1.3);
      [['#ffe9a8', -54, -42, -0.08], ['#ffc8d8', 10, -36, 0.06], ['#bfe6e0', -36, 6, 0.05], ['#d5dcf0', 26, 12, -0.07]].forEach((n) => {
        c.save(); c.translate(n[1] + 19, n[2] + 19); c.rotate(n[3]);
        box(c, -19, -19, 38, 38, 2, n[0], 1.3);
        line(c, -12, -6, 12, -6, 'rgba(90,52,72,0.3)', 1.3); line(c, -12, 2, 8, 2, 'rgba(90,52,72,0.3)', 1.3);
        oval(c, 0, -17, 3, 3, '#f27a93', 0.9);
        c.restore();
      });
    } });

  // ---------- 地毯（原点在中心，绘制时已压扁透视） ----------
  def('rugRound', { name: '圆地毯', cat: 'rug', kind: 'rug', w: 280, h: 280, colors: ['#ffc8d8', '#bfe6f0', '#ffe9a8', '#d5ecd0', '#d9c8f4'],
    draw(c, it) {
      const k = it.color;
      oval(c, 0, 0, 140, 140, k);
      ell(c, 0, 0, 112, 112); fs(c, null, sh(k, 0.5), 8);
      ell(c, 0, 0, 78, 78); fs(c, sh(k, -0.08));
      ell(c, 0, 0, 44, 44); fs(c, sh(k, 0.42));
    } });
  def('rugRect', { name: '条纹地毯', cat: 'rug', kind: 'rug', w: 340, h: 240, colors: ['#a8d8ea', '#ffc8d8', '#ffe9a8', '#d5ecd0', '#d9c8f4'],
    draw(c, it) {
      const k = it.color;
      box(c, -170, -120, 340, 240, 10, k);
      c.fillStyle = sh(k, 0.55);
      for (let i = 0; i < 5; i++) c.fillRect(-170 + 28 + i * 66, -118, 22, 236);
      c.strokeStyle = sh(k, -0.2); c.setLineDash([9, 7]); c.lineWidth = 3; rr(c, -156, -106, 312, 212, 6); c.stroke(); c.setLineDash([]);
    } });
  def('rugHeart', { name: '爱心地毯', cat: 'rug', kind: 'rug', w: 280, h: 260, colors: ['#ff9db6', '#ffc8d8', '#e8a8ff', '#ffd59e'],
    draw(c, it) {
      CT.heartPath(c, 0, 8, 118); fs(c, it.color, ol(it.color), 2);
      CT.heartPath(c, 0, 8, 88); fs(c, sh(it.color, 0.4));
    } });
  def('rugCloud', { name: '云朵地毯', cat: 'rug', kind: 'rug', w: 340, h: 220, colors: ['#fffdf8', '#dff1fb', '#ffe8f0'],
    draw(c, it) {
      const k = it.color, d = sh(k, -0.1);
      [[-96, 26, 74], [0, -14, 94], [96, 26, 74], [-44, 44, 66], [50, 46, 66]].forEach((b) => { ell(c, b[0], b[1], b[2], b[2] * 0.84); fs(c, d, ol(k, 0.3), 2); });
      [[-96, 26, 66], [0, -14, 86], [96, 26, 66], [-44, 44, 58], [50, 46, 58]].forEach((b) => { ell(c, b[0], b[1], b[2], b[2] * 0.84); fs(c, k); });
    } });

  // ---------- 小物（可以放在桌子上） ----------
  const smallPlate = (c, w) => { ell(c, 0, -4, w, 6); fs(c, WHITE, ol('#e0d4d8', 0.3), 1.4); };
  def('cake', { name: '草莓蛋糕', cat: 'small', kind: 'small', w: 84, h: 78, colors: ['#fffdf8', '#ffd3df', '#d9b28a'],
    draw(c, it) {
      const k = it.color; smallPlate(c, 40);
      box(c, -30, -46, 60, 42, 8, k); c.fillStyle = '#f27a93'; c.fillRect(-29, -28, 58, 7);
      c.beginPath(); c.moveTo(-31, -40);
      for (let i = 0; i < 4; i++) c.quadraticCurveTo(-23 + i * 15.5, -26, -15.5 + i * 15.5, -40);
      c.lineTo(31, -48); c.lineTo(-31, -48); c.closePath(); fs(c, WHITE, ol('#e0d4d8', 0.3), 1.3);
      oval(c, 0, -54, 10, 9.6, '#f2486a', 1.3); c.fillStyle = '#7cc68c'; ell(c, 0, -63, 7, 2.4); c.fill();
    } });
  def('cupcake', { name: '杯子蛋糕', cat: 'small', kind: 'small', w: 56, h: 66, colors: ['#ffc8d8', '#c9e8b8', '#d9c8f4', '#ffe29a'],
    draw(c, it) {
      const k = it.color;
      c.beginPath(); c.moveTo(-18, -26); c.lineTo(18, -26); c.lineTo(13, 0); c.lineTo(-13, 0); c.closePath(); fs(c, '#e6b673', ol('#e6b673'), 1.6);
      oval(c, 0, -32, 22, 11, k, 1.6); oval(c, 0, -43, 15, 9, sh(k, 0.14), 1.4); oval(c, 0, -52, 8, 6, sh(k, 0.3), 1.3);
      oval(c, 0, -60, 5, 5, '#f2486a', 1.1);
    } });
  def('teapot', { name: '下午茶壶', cat: 'small', kind: 'small', w: 92, h: 74, colors: ['#fffdf8', '#a8d8ea', '#f7c3cf', '#c9e8b8'],
    draw(c, it, t) {
      const k = it.color;
      c.beginPath(); c.moveTo(24, -28); c.quadraticCurveTo(38, -32, 44, -46); c.strokeStyle = ol(k); c.lineWidth = 7; c.lineCap = 'round'; c.stroke(); c.strokeStyle = k; c.lineWidth = 4; c.stroke();
      c.beginPath(); c.arc(-30, -26, 11, 1.2, 5); c.strokeStyle = ol(k); c.lineWidth = 3.4; c.stroke();
      oval(c, 0, -24, 28, 24, k);
      ell(c, 0, -46, 16, 5); fs(c, sh(k, -0.08), ol(k), 1.5); oval(c, 0, -53, 4, 4, '#f27a93', 1.1);
      CT.heartPath(c, 0, -24, 6); fs(c, '#f27a93');
    } });
  def('fruitBowl', { name: '水果盘', cat: 'small', kind: 'small', w: 84, h: 60, colors: ['#fffdf8', '#a8d8ea', '#f7c3cf'],
    draw(c, it) {
      oval(c, -15, -28, 13, 13, '#ff7a7a', 1.5); oval(c, 13, -30, 12, 12, '#ffb35c', 1.5); oval(c, 0, -38, 12, 12, '#a0d468', 1.5);
      c.beginPath(); c.moveTo(-38, -22); c.quadraticCurveTo(0, -12, 38, -22); c.quadraticCurveTo(30, 2, 0, 2); c.quadraticCurveTo(-30, 2, -38, -22); c.closePath(); fs(c, it.color, ol(it.color), 1.8);
    } });
  def('vase', { name: '插花瓶', cat: 'small', kind: 'small', w: 66, h: 104, colors: ['#a8d8ea', '#f7c3cf', '#fffdf8', '#ffe29a'],
    draw(c, it) {
      const pts = [[-20, -80, '#ff8fb1'], [0, -94, '#ffd35c'], [20, -80, '#b89cf0'], [-10, -66, '#fffdf8'], [12, -64, '#ff9a6b']];
      for (const p of pts) line(c, 0, -44, p[0], p[1], '#6cbb7c', 2.4);
      for (const p of pts) { for (let i = 0; i < 5; i++) { const a = (i * 6.28) / 5; ell(c, p[0] + Math.cos(a) * 5, p[1] + Math.sin(a) * 5, 4.4, 4.4); fs(c, p[2], ol(p[2], 0.3), 0.9); } oval(c, p[0], p[1], 2.6, 2.6, '#ffe27a', 0.8); }
      c.beginPath(); c.moveTo(-9, -50); c.bezierCurveTo(-8, -38, -24, -30, -18, -10); c.quadraticCurveTo(-14, 0, 0, 0); c.quadraticCurveTo(14, 0, 18, -10); c.bezierCurveTo(24, -30, 8, -38, 9, -50); c.closePath();
      fs(c, it.color, ol(it.color), 1.8);
      gloss(c, -12, -28, 6, 18, 0.5);
    } });
  def('candle', { name: '香薰蜡烛', cat: 'small', kind: 'small', w: 48, h: 64, colors: ['#ffc8d8', '#fff4e6', '#c9e8b8', '#d9c8f4'], toggle: true, on: true, anim: true, light: { x: 0, y: -50, r: 130, c: '#ffc27a' },
    draw(c, it, t) {
      box(c, -16, -36, 32, 36, 6, it.color); ell(c, 0, -36, 15.4, 4.4); fs(c, sh(it.color, 0.3), ol(it.color), 1.4);
      line(c, 0, -38, 0, -46, '#5a3448', 1.8);
      if (it.on) {
        const f = Math.sin(t * 9) * 1.5;
        c.beginPath(); c.moveTo(0, -60 - f); c.quadraticCurveTo(9, -48, 0, -43); c.quadraticCurveTo(-9, -48, 0, -60 - f); fs(c, '#ffb84a');
        ell(c, 0, -49, 2.6, 4); fs(c, '#fff0b8');
      }
    } });
  def('cookies', { name: '曲奇盘', cat: 'small', kind: 'small', w: 84, h: 40, colors: ['#e6b673', '#c98b5a', '#f0d0a0'],
    draw(c, it) {
      smallPlate(c, 40);
      [[-20, -13], [20, -13], [0, -17], [-9, -8], [11, -7]].forEach((d) => {
        oval(c, d[0], d[1], 13, 7, it.color, 1.3);
        ell(c, d[0] - 3, d[1] - 1, 1.6, 1.1); fs(c, '#6a463a'); ell(c, d[0] + 4, d[1] + 1, 1.6, 1.1); fs(c, '#6a463a');
      });
    } });
  def('pudding', { name: '布丁', cat: 'small', kind: 'small', w: 60, h: 54, colors: ['#ffe29a', '#f7c3cf', '#c9e8b8'],
    draw(c, it) {
      smallPlate(c, 28);
      c.beginPath(); c.moveTo(-15, -32); c.lineTo(15, -32); c.lineTo(22, -6); c.quadraticCurveTo(0, -1, -22, -6); c.closePath(); fs(c, it.color, ol(it.color), 1.6);
      c.beginPath(); c.moveTo(-15.5, -32); c.quadraticCurveTo(0, -38, 15.5, -32); c.lineTo(16.8, -25); c.quadraticCurveTo(9, -18, 6, -25); c.quadraticCurveTo(0, -17, -6, -25); c.quadraticCurveTo(-11, -18, -16.8, -25); c.closePath(); fs(c, '#a8643c', ol('#a8643c'), 1.3);
      oval(c, 0, -38, 6, 6, '#f2486a', 1.1);
    } });
  def('mug', { name: '热可可', cat: 'small', kind: 'small', w: 58, h: 56, colors: ['#fffdf8', '#f7b3c2', '#a8d8ea', '#ffd59e'], anim: true,
    draw(c, it, t) {
      c.beginPath(); c.arc(20, -18, 9, -1.3, 1.3); c.strokeStyle = ol(it.color); c.lineWidth = 3.4; c.stroke();
      box(c, -20, -36, 40, 36, 8, it.color); ell(c, 0, -34, 17, 4); fs(c, '#a8643c');
      c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 2; c.lineCap = 'round';
      for (const x of [-6, 7]) { c.beginPath(); c.moveTo(x, -42); c.quadraticCurveTo(x + Math.sin(t * 2 + x) * 5, -49, x, -56); c.stroke(); }
    } });
  def('bookStack', { name: '一摞书', cat: 'small', kind: 'small', w: 78, h: 48, colors: ['#8fb8ff', '#f27a93', '#7cc6a4', '#c9b8f0'],
    draw(c, it) {
      box(c, -36, -14, 72, 14, 2, it.color, 1.5); box(c, -30, -28, 62, 14, 2, '#ffd977', 1.5); box(c, -34, -42, 64, 14, 2, sh(it.color, 0.3), 1.5);
      for (const y of [-7, -21, -35]) line(c, -26, y, 26, y, 'rgba(255,255,255,0.65)', 1.2);
    } });
  def('duck', { name: '小黄鸭', cat: 'small', kind: 'small', w: 66, h: 56, colors: ['#ffd84a', '#ffb8c8', '#a8e0f0'], use: { act: 'hug' },
    draw(c, it) {
      const k = it.color;
      c.beginPath(); c.moveTo(-22, -22); c.lineTo(-33, -32); c.lineTo(-26, -13); c.closePath(); fs(c, k, ol(k, 0.3), 1.6);
      oval(c, -3, -15, 27, 15, k, 1.6);
      ell(c, -7, -16, 13, 7.5, 0.15); fs(c, sh(k, -0.1));
      oval(c, 10, -34, 16, 15, k, 1.6);
      c.beginPath(); c.moveTo(24, -36); c.quadraticCurveTo(38, -34, 25, -28); c.closePath(); fs(c, '#ff9a4a', ol('#ff9a4a'), 1.2);
      ell(c, 14, -38, 2.1, 2.4); fs(c, '#3a2838');
    } });
  def('miniPlant', { name: '桌面小绿植', cat: 'small', kind: 'small', w: 56, h: 62, colors: ['#fffdf8', '#f7b3c2', '#ffd59e', '#a8d8ea'],
    draw(c, it) {
      [[-2.2, 28], [-1.57, 34], [-0.9, 28], [-2.7, 20], [-0.45, 20]].forEach((l, i) => leaf(c, 0, -22, l[1], l[0], i % 2 ? '#7cc68c' : '#6cbb7c'));
      pot(c, -22, 22, 32, it.color);
    } });

  // 小心：礼物随机开出来的东西
  CT.GIFT_POOL = ['teddy', 'bunnyPlush', 'cake', 'cupcake', 'vase', 'balloons', 'globe', 'candle', 'flowerPot', 'miniPlant', 'duck', 'pudding'];
  CT.FOOD_POOL = ['cake', 'cupcake', 'pudding', 'cookies', 'teapot', 'mug', 'fruitBowl'];

  // ---------- 宠物 ----------
  CT.PETS = {
    cat: { name: '小猫', colors: ['#f5b26b', '#fffdf8', '#5a5560', '#c0c0cc', '#f0d0b0'], cry: 'meow' },
    dog: { name: '小狗', colors: ['#e8b07a', '#fffdf8', '#8a6a5a', '#f4d8b0'], cry: 'woof' },
    bunny: { name: '小兔', colors: ['#fffdf8', '#e8d0c0', '#c8c8d8', '#f7c3cf'], cry: 'squeak' },
  };
  function petFace(c, x, y, r, kind, happy, sleep) {
    const dark = '#3a2838';
    for (const s of [-1, 1]) {
      if (sleep) { c.beginPath(); c.moveTo(x + s * r * 0.5 - 3.4, y - 1); c.quadraticCurveTo(x + s * r * 0.5, y + 2, x + s * r * 0.5 + 3.4, y - 1); c.strokeStyle = dark; c.lineWidth = 1.6; c.stroke(); }
      else if (happy) { c.beginPath(); c.moveTo(x + s * r * 0.5 - 3.6, y + 1); c.quadraticCurveTo(x + s * r * 0.5, y - 4, x + s * r * 0.5 + 3.6, y + 1); c.strokeStyle = dark; c.lineWidth = 1.8; c.stroke(); }
      else { ell(c, x + s * r * 0.5, y - 1, r * 0.13 + 1, r * 0.17 + 1); fs(c, dark); ell(c, x + s * r * 0.5 - 1, y - 2.4, 1.1, 1.3); fs(c, '#fff'); }
    }
    ell(c, x, y + r * 0.24, 2.4, 1.7); fs(c, kind === 'dog' ? dark : '#f27a93');
    c.beginPath(); c.moveTo(x - 3.6, y + r * 0.42); c.quadraticCurveTo(x - 1.8, y + r * 0.56, x, y + r * 0.4); c.quadraticCurveTo(x + 1.8, y + r * 0.56, x + 3.6, y + r * 0.42); c.strokeStyle = dark; c.lineWidth = 1.2; c.stroke();
    if (kind === 'cat') for (const s of [-1, 1]) for (const d of [-2, 2]) line(c, x + s * r * 0.64, y + r * 0.26, x + s * r * 1.08, y + r * 0.2 + d * 1.6, 'rgba(90,70,80,0.55)', 0.9);
    ell(c, x - r * 0.68, y + r * 0.26, 4, 2.4); fs(c, 'rgba(255,130,155,0.42)'); ell(c, x + r * 0.68, y + r * 0.26, 4, 2.4); fs(c, 'rgba(255,130,155,0.42)');
  }
  function petEars(c, x, y, r, kind, col, t) {
    const o = ol(col, 0.34);
    if (kind === 'cat') {
      for (const s of [-1, 1]) {
        c.beginPath(); c.moveTo(x + s * r * 0.28, y - r * 0.8); c.lineTo(x + s * r * 0.86, y - r * 1.36); c.lineTo(x + s * r * 0.98, y - r * 0.32); c.closePath(); fs(c, col, o, 1.6);
        c.beginPath(); c.moveTo(x + s * r * 0.5, y - r * 0.8); c.lineTo(x + s * r * 0.82, y - r * 1.12); c.lineTo(x + s * r * 0.86, y - r * 0.52); c.closePath(); fs(c, '#ffbfcf');
      }
    } else if (kind === 'dog') {
      for (const s of [-1, 1]) { ell(c, x + s * r * 0.98, y - r * 0.06, r * 0.32, r * 0.66, s * 0.22); fs(c, sh(col, -0.14), o, 1.6); }
    } else {
      for (const s of [-1, 1]) {
        ell(c, x + s * r * 0.42, y - r * 1.4, r * 0.3, r * 0.82, s * 0.12 + Math.sin(t * 2 + s) * 0.04); fs(c, col, o, 1.6);
        ell(c, x + s * r * 0.42, y - r * 1.36, r * 0.14, r * 0.56, s * 0.12); fs(c, '#ffc2d0');
      }
    }
  }
  // st: {t, pose: sit|walk|sleep, dir, happy, phase}
  CT.drawPet = function (c, kind, col, st) {
    const t = st.t || 0, pose = st.pose || 'sit', o = ol(col, 0.34), l = sh(col, 0.4), ph = st.phase || 0;
    c.save(); c.lineJoin = 'round'; c.lineCap = 'round';
    if (st.happy) c.translate(0, -Math.abs(Math.sin(t * 8)) * 7);
    if (pose === 'sleep') {
      if (kind !== 'bunny') { c.beginPath(); c.moveTo(-32, -10); c.quadraticCurveTo(-4, 10, 30, -5); c.strokeStyle = o; c.lineWidth = 11; c.stroke(); c.strokeStyle = col; c.lineWidth = 8; c.stroke(); }
      ell(c, -4, -19, 34, 19 + Math.sin(t * 2) * 1); fs(c, col, o, 1.8);
      petEars(c, 20, -24, 15, kind, col, t);
      oval(c, 20, -22, 15, 14, col, 1.6);
      petFace(c, 20, -22, 15, kind, false, true);
    } else if (pose === 'walk') {
      c.scale(st.dir || 1, 1);
      const b = Math.sin(ph) * 2;
      if (kind === 'bunny') { ell(c, -26, -32, 8, 8); fs(c, WHITE, o, 1.4); }
      else { c.beginPath(); c.moveTo(-26, -34); c.quadraticCurveTo(-44, -52 + b, -38, -66 + b); c.strokeStyle = o; c.lineWidth = 9.6; c.stroke(); c.strokeStyle = col; c.lineWidth = 6.6; c.stroke(); }
      for (const [x, p] of [[-18, 0], [-10, Math.PI], [10, Math.PI], [18, 0]]) {
        const lift = Math.max(0, Math.sin(ph + p)) * 5;
        line(c, x, -18, x + Math.cos(ph + p) * 3, -3 - lift, o, 9.4); line(c, x, -18, x + Math.cos(ph + p) * 3, -3 - lift, col, 6.6);
      }
      rr(c, -28, -41 + b * 0.4, 54, 28, 14); fs(c, col, o, 1.8);
      petEars(c, 27, -49 + b * 0.5, 17, kind, col, t);
      oval(c, 27, -47 + b * 0.5, 18, 16.5, col, 1.8);
      petFace(c, 29, -47 + b * 0.5, 17, kind, st.happy);
    } else {
      if (kind === 'bunny') { ell(c, 14, -11, 9, 9); fs(c, WHITE, o, 1.4); }
      else {
        const w = Math.sin(t * 3) * 5;
        c.beginPath(); c.moveTo(14, -8); c.quadraticCurveTo(40, -8, 38 + w, -32); c.strokeStyle = o; c.lineWidth = 9.6; c.stroke(); c.strokeStyle = col; c.lineWidth = 6.6; c.stroke();
      }
      ell(c, 0, -22, 21, 23); fs(c, col, o, 1.8);
      ell(c, 0, -19, 11, 14); fs(c, l);
      oval(c, -11, -3, 8, 4.4, col, 1.4); oval(c, 11, -3, 8, 4.4, col, 1.4);
      const hy = -56 + Math.sin(t * 2.1) * 0.6;
      petEars(c, 0, hy, 21, kind, col, t);
      oval(c, 0, hy, 22, 19.5, col, 1.8);
      if (kind === 'cat' && col === '#f5b26b') for (const x of [-7, 0, 7]) line(c, x, hy - 17, x, hy - 11, sh(col, -0.2), 2);
      petFace(c, 0, hy + 1, 20, kind, st.happy);
    }
    c.restore();
  };

  // 目录缩略图
  CT.furnThumb = function (cv, id, color) {
    const d = F[id], c = cv.getContext('2d'), W = cv.width, H = cv.height;
    c.clearRect(0, 0, W, H);
    c.save();
    const it = { color: color || (d.colors ? d.colors[0] : null), on: d.on !== undefined ? d.on : false, seed: 3, variant: 0 };
    const env = CT.DAY_ENV;
    const s = Math.min(W / (d.w + 16), H / (d.h + 16));
    if (d.kind === 'floor' || d.kind === 'small') {
      c.translate(W / 2, H / 2 + (d.h * s) / 2); c.scale(s, s);
    } else if (d.kind === 'rug') {
      const rs = Math.min(W / (d.w + 16), H / (d.h * 0.62 + 16));
      c.translate(W / 2, H / 2); c.scale(rs, rs * 0.62);
    } else {
      c.translate(W / 2, H / 2); c.scale(s, s);
    }
    d.draw(c, it, 1.2, env);
    if (d.over) d.over(c, it, 1.2, env);
    c.restore();
  };
  CT.petThumb = function (cv, kind) {
    const c = cv.getContext('2d'), W = cv.width, H = cv.height, s = Math.min(W, H) / 96;
    c.clearRect(0, 0, W, H);
    c.save(); c.translate(W / 2, H - 8 * s); c.scale(s, s);
    CT.drawPet(c, kind, CT.PETS[kind].colors[0], { t: 1 });
    c.restore();
  };
})(window.CT);
