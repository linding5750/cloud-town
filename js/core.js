/* 云朵小镇 · core：数学/颜色/绘图工具、存储、生成式音乐与音效 */
'use strict';
window.CT = window.CT || {};
(function (CT) {
  // ---------- 数学 ----------
  CT.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  CT.lerp = (a, b, t) => a + (b - a) * t;
  CT.rand = (a, b) => a + Math.random() * (b - a);
  CT.randi = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
  CT.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  CT.chance = (p) => Math.random() < p;
  CT.uid = () => Math.random().toString(36).slice(2, 8) + (Date.now() % 1e6).toString(36);
  CT.dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
  CT.seeded = function (seed) {
    let s = seed >>> 0 || 1;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  CT.hash = function (x, y, s) {
    let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 982451653)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  CT.hashStr = function (str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = (Math.imul(h, 33) + str.charCodeAt(i)) | 0;
    return h >>> 0;
  };

  // ---------- 颜色 ----------
  const hexCache = new Map();
  function hexToRgb(h) {
    let c = hexCache.get(h);
    if (c) return c;
    let s = String(h).replace('#', '');
    if (s.length === 3) s = s.split('').map((x) => x + x).join('');
    const n = parseInt(s, 16);
    c = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    hexCache.set(h, c);
    return c;
  }
  function toHex(r, g, b) {
    return '#' + ((1 << 24) | (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b)).toString(16).slice(1);
  }
  CT.hexToRgb = hexToRgb;
  const mixCache = new Map();
  CT.mix = function (a, b, t) {
    const k = a + b + t;
    let v = mixCache.get(k);
    if (v) return v;
    const A = hexToRgb(a), B = hexToRgb(b);
    v = toHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
    if (mixCache.size > 6000) mixCache.clear();
    mixCache.set(k, v);
    return v;
  };
  CT.shade = (c, amt) => (amt >= 0 ? CT.mix(c, '#ffffff', amt) : CT.mix(c, '#2c1b2e', -amt));
  CT.rgba = function (h, a) {
    const c = hexToRgb(h);
    return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')';
  };

  // ---------- 绘图 ----------
  CT.P = (function () {
    const cache = new Map();
    return function (d) {
      let p = cache.get(d);
      if (!p) { p = new Path2D(d); cache.set(d, p); }
      return p;
    };
  })();
  CT.rrect = function (ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2));
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };
  CT.rr = function (ctx, x, y, w, h, r) { ctx.beginPath(); CT.rrect(ctx, x, y, w, h, r); };
  CT.ell = function (ctx, x, y, rx, ry, rot) {
    ctx.beginPath();
    ctx.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot || 0, 0, Math.PI * 2);
  };
  CT.fs = function (ctx, fill, stroke, lw) {
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.lineWidth = lw || 2; ctx.strokeStyle = stroke; ctx.stroke(); }
  };
  CT.fp = function (ctx, path, fill, stroke, lw) {
    if (fill) { ctx.fillStyle = fill; ctx.fill(path); }
    if (stroke) { ctx.lineWidth = lw || 2; ctx.strokeStyle = stroke; ctx.stroke(path); }
  };
  CT.lg = function (ctx, x0, y0, x1, y1, stops) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    for (let i = 0; i < stops.length; i++) g.addColorStop(stops.length === 1 ? 0 : i / (stops.length - 1), stops[i]);
    return g;
  };
  CT.heartPath = function (ctx, x, y, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + s * 0.9);
    ctx.bezierCurveTo(x - s * 1.5, y - s * 0.1, x - s * 0.8, y - s * 1.1, x, y - s * 0.35);
    ctx.bezierCurveTo(x + s * 0.8, y - s * 1.1, x + s * 1.5, y - s * 0.1, x, y + s * 0.9);
    ctx.closePath();
  };
  CT.starPath = function (ctx, x, y, r1, r2, n, rot) {
    n = n || 5;
    const a0 = (rot || 0) - Math.PI / 2;
    ctx.beginPath();
    for (let i = 0; i < n * 2; i++) {
      const r = i % 2 ? r2 : r1, a = a0 + (i * Math.PI) / n;
      const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
      if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
    }
    ctx.closePath();
  };
  CT.sparkle = function (ctx, x, y, r, color) {
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.quadraticCurveTo(x, y, x, y + r);
    ctx.quadraticCurveTo(x, y, x - r, y);
    ctx.quadraticCurveTo(x, y, x, y - r);
    ctx.closePath();
    ctx.fillStyle = color || '#fff';
    ctx.fill();
  };
  CT.line = function (ctx, x1, y1, x2, y2, c, lw) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.strokeStyle = c; ctx.lineWidth = lw || 1.5; ctx.lineCap = 'round'; ctx.stroke();
  };
  CT.cloudShape = function (ctx, x, y, w, h, seed) {
    // 一朵蓬松的云：几个圆鼓鼓的团子叠在一起
    const r = CT.seeded(seed || 7), n = 5;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n, cx = x - w / 2 + u * w, hh = Math.sin(u * Math.PI) * h * (0.7 + r() * 0.4) + h * 0.3, rx = (w / n) * 0.82, cy = y - hh * 0.46;
      ctx.moveTo(cx + rx, cy);
      ctx.ellipse(cx, cy, rx, hh * 0.62, 0, 0, Math.PI * 2);
    }
    ctx.moveTo(x + w * 0.52, y - h * 0.14);
    ctx.ellipse(x, y - h * 0.14, w * 0.52, h * 0.22, 0, 0, Math.PI * 2);
    ctx.closePath();
  };
  CT.FONT = '"ZCOOL KuaiLe","YouYuan","幼圆","PingFang SC","Microsoft YaHei",sans-serif';

  // ---------- 本地存储（读写都容错） ----------
  CT.store = {
    get(k) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* 忽略 */ } },
  };

  // ---------- 音频 ----------
  const A = (CT.Audio = {});
  const S = (A.settings = { music: true, sfx: true, vol: 0.6, sfxVol: 0.7, track: 'auto' });
  let ac = null, master = null, musicBus = null, sfxBus = null, revIn = null, noiseBuf = null;
  let cur = null, curId = null, phrases = null, step = 0, nextT = 0, timer = null, rainNode = null, rainGain = null;
  const LOOK = 1.4; // 预排 1.4 秒，切到后台时音乐也不断
  const CH = {
    maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], maj: [0, 4, 7], min: [0, 3, 7], add9: [0, 4, 7, 14],
    sus2: [0, 2, 7], six: [0, 4, 7, 9], m9: [0, 3, 7, 10, 14], dom7: [0, 4, 7, 10], maj9: [0, 4, 7, 11, 14],
  };
  const PENTA = [0, 2, 4, 7, 9];
  const PAT4 = [
    [[0, 3], [3, 1], [4, 2], [6, 2]], [[0, 2], [2, 2], [4, 4]], [[0, 1], [1, 1], [2, 2], [4, 2], [6, 2]],
    [[0, 4], [4, 2], [6, 2]], [[0, 6], [6, 2]], [[2, 2], [4, 2], [6, 2]], [[0, 2], [3, 1], [4, 4]],
  ];
  const PAT3 = [[[0, 4], [4, 2]], [[0, 2], [2, 2], [4, 2]], [[0, 6]], [[0, 3], [3, 1], [4, 2]], [[2, 2], [4, 2]]];
  const FORM = [0, 0, 1, 0];
  const TRACKS = (A.TRACKS = {
    garden: {
      name: '花园散步', bpm: 96, beats: 4, key: 55, lo: 67, hi: 88, lead: 'pluck', arp: [0, 1, 2, 1, 3, 1, 2, 1], kit: 2,
      prog: [[0, 'maj'], [7, 'maj'], [9, 'min'], [5, 'maj'], [0, 'add9'], [7, 'maj'], [5, 'maj'], [7, 'dom7']],
    },
    afternoon: {
      name: '云朵午后', bpm: 76, beats: 4, key: 53, lo: 65, hi: 86, lead: 'bell', arp: [0, 2, 1, 3, 2, 1, 3, 2], kit: 1,
      prog: [[5, 'maj7'], [7, 'dom7'], [4, 'm7'], [9, 'm7'], [2, 'm9'], [7, 'sus2'], [0, 'maj9'], [0, 'maj7']],
    },
    lullaby: {
      name: '星空摇篮曲', bpm: 60, beats: 3, key: 48, lo: 72, hi: 91, lead: 'bell', arp: [0, 1, 2, 3, 2, 1], kit: 0,
      prog: [[0, 'maj7'], [9, 'm7'], [5, 'maj7'], [7, 'sus2'], [0, 'add9'], [4, 'm7'], [5, 'maj9'], [7, 'dom7']],
    },
  });

  function makeIR(sec, decay) {
    const rate = ac.sampleRate, len = Math.floor(rate * sec), buf = ac.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }
  A.init = function () {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return true; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try { ac = new AC(); } catch (e) { ac = null; return false; }
    master = ac.createGain(); master.gain.value = 1.35;
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 18; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.3;
    master.connect(comp); comp.connect(ac.destination);
    const conv = ac.createConvolver(); conv.buffer = makeIR(3.0, 2.6);
    revIn = ac.createGain();
    const revOut = ac.createGain(); revOut.gain.value = 0.5;
    revIn.connect(conv); conv.connect(revOut); revOut.connect(master);
    musicBus = ac.createGain(); musicBus.gain.value = S.music ? S.vol : 0; musicBus.connect(master);
    const mr = ac.createGain(); mr.gain.value = 0.42; musicBus.connect(mr); mr.connect(revIn);
    sfxBus = ac.createGain(); sfxBus.gain.value = S.sfx ? S.sfxVol : 0; sfxBus.connect(master);
    const sr = ac.createGain(); sr.gain.value = 0.22; sfxBus.connect(sr); sr.connect(revIn);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    if (ac.state === 'suspended') ac.resume();
    return true;
  };

  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  function osc(type, f, t, stop, dest, detune) {
    const o = ac.createOscillator();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (detune) o.detune.value = detune;
    o.connect(dest); o.start(t); o.stop(stop);
    return o;
  }
  function gainTo(v, dest) { const g = ac.createGain(); g.gain.value = v; g.connect(dest); return g; }
  function voice(kind, midi, t, dur, vel, bus) {
    const f = mtof(midi), out = ac.createGain(), g = out.gain;
    out.connect(bus || musicBus);
    g.setValueAtTime(0.0001, t);
    if (kind === 'bell') {
      const end = t + 2.4;
      osc('sine', f, t, end, out);
      osc('sine', f * 2, t, end, gainTo(0.22, out));
      osc('triangle', f * 4.01, t, t + 0.5, gainTo(0.05, out));
      g.linearRampToValueAtTime(vel, t + 0.006);
      g.exponentialRampToValueAtTime(vel * 0.3, t + 0.3);
      g.exponentialRampToValueAtTime(0.0001, end);
    } else if (kind === 'piano') {
      const end = t + dur + 1.0;
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass';
      lp.frequency.setValueAtTime(2600, t); lp.frequency.exponentialRampToValueAtTime(800, t + 0.8); lp.connect(out);
      osc('triangle', f, t, end, lp);
      osc('sine', f * 2, t, end, gainTo(0.16, lp));
      g.linearRampToValueAtTime(vel, t + 0.01);
      g.exponentialRampToValueAtTime(vel * 0.32, t + 0.42);
      g.exponentialRampToValueAtTime(0.0001, end);
    } else if (kind === 'pad') {
      const end = t + dur + 1.7;
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 760; lp.Q.value = 0.4; lp.connect(out);
      osc('sawtooth', f, t, end, lp, -5); osc('sawtooth', f, t, end, lp, 6);
      g.linearRampToValueAtTime(vel, t + Math.min(0.9, dur * 0.5));
      g.setValueAtTime(vel, t + dur);
      g.linearRampToValueAtTime(0.0001, end);
    } else if (kind === 'bass') {
      const end = t + dur + 0.35;
      osc('sine', f, t, end, out); osc('triangle', f, t, end, gainTo(0.2, out));
      g.linearRampToValueAtTime(vel, t + 0.02);
      g.exponentialRampToValueAtTime(vel * 0.5, t + Math.max(0.1, dur * 0.7));
      g.exponentialRampToValueAtTime(0.0001, end);
    } else if (kind === 'pluck') {
      const end = t + 0.9;
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200; lp.connect(out);
      osc('triangle', f, t, end, lp); osc('sine', f * 2, t, end, gainTo(0.28, lp));
      g.linearRampToValueAtTime(vel * 1.15, t + 0.005);
      g.exponentialRampToValueAtTime(0.0001, end);
    }
  }
  function shaker(t, vel, bus) {
    const s = ac.createBufferSource(); s.buffer = noiseBuf;
    const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7000;
    const g = ac.createGain(); g.gain.setValueAtTime(vel, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    s.connect(hp); hp.connect(g); g.connect(bus || musicBus);
    s.start(t, Math.random()); s.stop(t + 0.08);
  }
  function softKick(t, vel) {
    const end = t + 0.32, g = ac.createGain();
    g.connect(musicBus);
    const o = osc('sine', 110, t, end, g);
    o.frequency.exponentialRampToValueAtTime(46, t + 0.14);
    g.gain.setValueAtTime(vel, t); g.gain.exponentialRampToValueAtTime(0.0001, end);
  }
  function nearest(list, m) {
    let best = list[0], bd = 1e9;
    for (const n of list) { const d = Math.abs(n - m); if (d < bd) { bd = d; best = n; } }
    return best;
  }
  function chordTones(tr, ch) {
    const out = [];
    for (let o = -2; o <= 4; o++) {
      for (const iv of CH[ch[1]]) {
        const m = tr.key + ch[0] + (iv % 12) + o * 12;
        if (m >= tr.lo && m <= tr.hi) out.push(m);
      }
    }
    return out.sort((a, b) => a - b);
  }
  function pentaNotes(tr) {
    const out = [];
    for (let o = -1; o <= 4; o++) for (const iv of PENTA) { const m = tr.key + iv + o * 12; if (m >= tr.lo && m <= tr.hi) out.push(m); }
    return out.sort((a, b) => a - b);
  }
  function genPhrase(tr, rnd) {
    const bars = [], pats = tr.beats === 3 ? PAT3 : PAT4, penta = pentaNotes(tr);
    let prev = Math.round((tr.lo + tr.hi) / 2);
    tr.prog.forEach((ch, b) => {
      const tones = chordTones(tr, ch);
      const last = b === tr.prog.length - 1;
      let pat = pats[Math.floor(rnd() * pats.length)];
      if (last) pat = tr.beats === 3 ? [[0, 6]] : [[0, 6], [6, 2]];
      else if (b % 4 === 3) pat = pats[3]; // 每四小节换口气，用长音收住
      const notes = [];
      for (const pair of pat) {
        const st = pair[0], strong = st % (tr.beats === 3 ? 6 : 4) === 0;
        let m;
        if (strong) m = nearest(tones, prev + Math.round((rnd() - 0.5) * 7));
        else {
          let i = penta.indexOf(nearest(penta, prev)) + (rnd() < 0.5 ? -1 : 1) * (rnd() < 0.72 ? 1 : 2);
          i = CT.clamp(i, 0, penta.length - 1);
          m = penta[i];
        }
        notes.push({ s: st, l: pair[1], m });
        prev = m;
      }
      if (last) notes[0].m = nearest(tones, tr.key + 24 + (ch[0] === 0 ? 0 : ch[0]));
      bars.push(notes);
    });
    return bars;
  }
  function scheduleStep(st, t) {
    const tr = cur, spb = 60 / tr.bpm / 2, sb = tr.beats * 2;
    const bar = Math.floor(st / sb), pos = st % sb, plen = tr.prog.length;
    const ci = bar % plen, ch = tr.prog[ci], ivs = CH[ch[1]];
    const root = tr.key + ch[0] - (ch[0] > 7 ? 12 : 0);
    const hum = () => (Math.random() - 0.5) * 0.012;
    if (pos === 0) {
      voice('bass', root - 12, t, spb * sb * (tr.kit === 2 ? 0.42 : 0.85), 0.17);
      ivs.slice(0, 4).forEach((iv) => voice('pad', root + 12 + (iv % 12), t, spb * sb, 0.016));
    }
    if (tr.kit === 2 && pos === sb / 2) voice('bass', root - 5, t, spb * sb * 0.4, 0.12);
    const voicing = [root + 12, root + 12 + ivs[1], root + 12 + ivs[2], root + 12 + (ivs[3] ? ivs[3] % 12 : 12), root + 24];
    const idx = tr.arp[pos % tr.arp.length];
    voice('piano', voicing[idx], t + hum(), spb * 1.6, pos === 0 ? 0.1 : 0.068);
    const sect = FORM[Math.floor(bar / plen) % FORM.length];
    if (bar >= 2) {
      for (const n of phrases[sect][ci]) if (n.s === pos) voice(tr.lead, n.m, t + hum(), n.l * spb, 0.12);
    }
    if (tr.kit === 2) {
      if (pos % 2 === 1) shaker(t, 0.03);
      if (pos === 0 || pos === sb / 2) softKick(t, 0.14);
    } else if (tr.kit === 1 && pos % 2 === 1) shaker(t, 0.012);
  }
  function tick() {
    if (!ac || !cur || ac.state !== 'running' || !S.music) return;
    const spb = 60 / cur.bpm / 2;
    if (nextT < ac.currentTime) {
      const miss = Math.ceil((ac.currentTime - nextT) / spb);
      step += miss; nextT += miss * spb;
    }
    while (nextT < ac.currentTime + LOOK) { scheduleStep(step, nextT); nextT += spb; step++; }
  }
  function startTrack(id) {
    cur = TRACKS[id]; curId = id;
    const rnd = CT.seeded(CT.hashStr(id) + 11 + Math.floor(Math.random() * 1e6));
    phrases = [genPhrase(cur, rnd), genPhrase(cur, rnd)];
    step = 0; nextT = ac.currentTime + 0.12;
    if (!timer) timer = setInterval(tick, 180);
    tick();
  }
  function setBus(bus, v, sec) {
    if (!bus) return;
    const t = ac.currentTime;
    bus.gain.cancelScheduledValues(t);
    bus.gain.setValueAtTime(bus.gain.value, t);
    bus.gain.linearRampToValueAtTime(v, t + (sec || 0.3));
  }
  let switching = 0, fading = false;
  A.play = function (id) {
    if (!ac) return;
    if (id === curId && (cur || fading)) return;
    if (!cur && !fading) { startTrack(id); return; }
    const token = ++switching;
    fading = true;
    setBus(musicBus, 0, 0.8);
    cur = null; // 停止继续预排，已排的音符随总线淡出
    curId = id;
    setTimeout(() => {
      if (token !== switching) return;
      fading = false;
      startTrack(id);
      setBus(musicBus, S.music ? S.vol : 0, 1.0);
    }, 1500);
  };
  A.trackForHour = (h) => (h >= 6 && h < 11 ? 'garden' : h >= 11 && h < 18.5 ? 'afternoon' : 'lullaby');
  A.autoPlay = function (hour) {
    if (!ac) return;
    A.play(S.track === 'auto' ? A.trackForHour(hour) : S.track);
  };
  A.curName = () => (curId && TRACKS[curId] ? TRACKS[curId].name : '');
  A.setMusic = function (on) {
    S.music = on;
    if (!ac) return;
    setBus(musicBus, on ? S.vol : 0, 0.4);
    if (on && ac.state === 'suspended') ac.resume();
  };
  A.setVol = function (v) { S.vol = v; if (ac && S.music) setBus(musicBus, v, 0.1); };
  A.setSfx = function (on) { S.sfx = on; if (ac) setBus(sfxBus, on ? S.sfxVol : 0, 0.1); };
  A.setSfxVol = function (v) { S.sfxVol = v; if (ac && S.sfx) setBus(sfxBus, v, 0.1); };

  A.setRain = function (on) {
    if (!ac) return;
    if (on && !rainNode) {
      rainNode = ac.createBufferSource(); rainNode.buffer = noiseBuf; rainNode.loop = true;
      const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1500;
      const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 280;
      rainGain = ac.createGain(); rainGain.gain.value = 0.0001;
      rainNode.connect(lp); lp.connect(hp); hp.connect(rainGain); rainGain.connect(master);
      rainNode.start();
      setBus(rainGain, 0.05, 1.5);
    } else if (!on && rainNode) {
      setBus(rainGain, 0.0001, 1.2);
      const n = rainNode; rainNode = null;
      setTimeout(() => { try { n.stop(); } catch (e) { /* 已停止 */ } }, 1400);
    }
  };

  function blip(t, type, f0, f1, dur, vol) {
    const g = ac.createGain(); g.connect(sfxBus);
    const o = osc(type, f0, t, t + dur + 0.02, g);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  function noise(t, dur, freq, vol, type) {
    const s = ac.createBufferSource(); s.buffer = noiseBuf;
    const f = ac.createBiquadFilter(); f.type = type || 'bandpass'; f.frequency.value = freq;
    const g = ac.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(sfxBus);
    s.start(t, Math.random()); s.stop(t + dur + 0.02);
  }
  function meow(t) {
    const g = ac.createGain(); g.connect(sfxBus);
    const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 2.4; bp.connect(g);
    bp.frequency.setValueAtTime(1100, t); bp.frequency.linearRampToValueAtTime(2100, t + 0.13); bp.frequency.linearRampToValueAtTime(1000, t + 0.42);
    const o = osc('sawtooth', 560, t, t + 0.46, bp);
    o.frequency.linearRampToValueAtTime(860, t + 0.12); o.frequency.linearRampToValueAtTime(640, t + 0.44);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.16, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
  }
  function woof(t) {
    const g = ac.createGain(); g.connect(sfxBus);
    const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.connect(g);
    const o = osc('square', 300, t, t + 0.16, lp);
    o.frequency.exponentialRampToValueAtTime(170, t + 0.14);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.13, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
  }
  A.sfx = function (name) {
    if (!ac || !S.sfx) return;
    const t = ac.currentTime + 0.005;
    switch (name) {
      case 'click': blip(t, 'sine', 940, 700, 0.07, 0.11); break;
      case 'pop': blip(t, 'sine', 420, 150, 0.14, 0.26); blip(t, 'triangle', 1500, 900, 0.04, 0.04); break;
      case 'pick': blip(t, 'sine', 520, 900, 0.09, 0.13); break;
      case 'del': blip(t, 'triangle', 720, 170, 0.22, 0.14); noise(t, 0.18, 2500, 0.05); break;
      case 'sparkle': [0, 4, 7, 12].forEach((iv, i) => voice('bell', 84 + iv, t + i * 0.06, 0.2, 0.08, sfxBus)); break;
      case 'chime': [0, 4, 7, 12, 16].forEach((iv, i) => voice('bell', 72 + iv, t + i * 0.09, 0.3, 0.11, sfxBus)); break;
      case 'magic': [0, 2, 4, 7, 9, 12, 14, 16].forEach((iv, i) => voice('bell', 74 + iv, t + i * 0.045, 0.2, 0.06, sfxBus)); noise(t, 0.5, 6000, 0.018, 'highpass'); break;
      case 'meow': meow(t); break;
      case 'woof': woof(t); woof(t + 0.19); break;
      case 'squeak': blip(t, 'sine', 1300, 1800, 0.08, 0.08); blip(t + 0.09, 'sine', 1500, 2100, 0.07, 0.07); break;
      case 'door': voice('bell', 76, t, 0.3, 0.1, sfxBus); voice('bell', 83, t + 0.12, 0.3, 0.1, sfxBus); break;
      case 'splash': noise(t, 0.45, 1200, 0.12); noise(t + 0.08, 0.3, 2200, 0.05); break;
      case 'sizzle': noise(t, 0.8, 5000, 0.035, 'highpass'); break;
      case 'switch': noise(t, 0.03, 3000, 0.09, 'highpass'); blip(t, 'square', 2200, 2000, 0.02, 0.018); break;
      case 'water': for (let i = 0; i < 5; i++) blip(t + i * 0.07, 'sine', 500 + Math.random() * 500, 900 + Math.random() * 500, 0.06, 0.05); break;
      case 'brush': noise(t, 0.2, 1800, 0.04); noise(t + 0.22, 0.2, 2200, 0.04); break;
      case 'shutter': noise(t, 0.05, 3500, 0.12, 'highpass'); blip(t + 0.05, 'square', 1200, 900, 0.03, 0.03); break;
      case 'step': noise(t, 0.04, 900, 0.03); break;
      default: break;
    }
  };
  // 钢琴互动：跟着当前和弦弹，永远不跑调
  let lastPiano = 74;
  A.pianoNote = function () {
    if (!ac || !S.sfx) return;
    const tr = cur || TRACKS.afternoon;
    const notes = pentaNotes(tr);
    const i = notes.indexOf(nearest(notes, lastPiano)) + CT.randi(-2, 2);
    lastPiano = notes[CT.clamp(i, 0, notes.length - 1)];
    voice('piano', lastPiano, ac.currentTime + 0.01, 0.5, 0.2, sfxBus);
  };
})(window.CT);
