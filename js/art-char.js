/* 云朵小镇 · 角色：所有女孩都由这里的路径实时绘制，换发型换衣服不需要图片素材 */
'use strict';
(function (CT) {
  const P = CT.P, mix = CT.mix, shade = CT.shade, fp = CT.fp, fs = CT.fs, ell = CT.ell;
  const INK = '#5a3448';
  const ol = (c, k) => mix(c, INK, k == null ? 0.5 : k);

  // ---------- 捏人选项 ----------
  CT.CHAR_OPTS = {
    skin: ['#fff1e8', '#ffe6d8', '#fbd6be', '#efbf9c', '#cf9770', '#9f6a4e'],
    hairColors: ['#f7a8c4', '#ffd0e0', '#c9b8f0', '#a8c8ff', '#8fd9c8', '#ffe08a', '#ffb35c', '#e8706a', '#a8724e', '#6a463a', '#3b3346', '#f4f1f6', '#b4bccc', '#9fce8f'],
    eyeColors: ['#e0607e', '#7b6cd9', '#3fa86b', '#2b9bb0', '#4aa3ff', '#b07a3c', '#9b3b4f', '#5a4a7a', '#f29a3a', '#4c4a58'],
    clothColors: ['#ffc8d8', '#ffa8bd', '#f27a93', '#e8706a', '#ffd59e', '#ffe9a8', '#d7f0b0', '#7cc6a4', '#a8d8ea', '#8fb8ff', '#b9a6ea', '#d9c2f0', '#f3e6d0', '#fffdf8', '#6b4f7a', '#3e4a6b', '#7a5a48', '#4a4a52'],
    accColors: ['#ff6f91', '#ffa8bd', '#ffd35c', '#ff9d5c', '#7cc6a4', '#6fb7e8', '#a38cf0', '#fffdf8', '#a8724e', '#3b3346'],
    back: [['long', '长直发'], ['twin', '双马尾'], ['pony', '高马尾'], ['bob', '波波头'], ['buns', '丸子头'], ['wavy', '大波浪'], ['braid', '麻花辫']],
    bangs: [['straight', '齐刘海'], ['airy', '空气刘海'], ['side', '斜刘海'], ['center', '中分'], ['hime', '公主切']],
    eyes: [['round', '圆圆眼'], ['sparkle', '闪闪眼'], ['gentle', '温柔眼'], ['cat', '猫猫眼'], ['star', '星星眼']],
    mouth: [['smile', '微笑'], ['open', '开心'], ['cat', '猫猫嘴'], ['o', '小圆嘴'], ['pout', '嘟嘟嘴']],
    outfit: [['dress', '连衣裙'], ['sailor', '水手服'], ['hoodie', '卫衣短裙'], ['overall', '背带裙'], ['lolita', '洛丽塔'], ['sweater', '毛衣长裙'], ['pajama', '睡衣'], ['apron', '围裙装']],
    sock: [['none', '光脚丫'], ['short', '短袜'], ['knee', '长筒袜'], ['tights', '连裤袜']],
    acc: [['none', '不戴'], ['bow', '蝴蝶结'], ['flower', '小花'], ['catEars', '猫耳'], ['bunny', '兔耳'], ['beret', '贝雷帽'], ['star', '星星发夹'], ['band', '发箍'], ['crown', '小皇冠']],
  };
  CT.defaultLook = () => ({
    skin: '#ffe6d8', back: 'long', bangs: 'straight', hair: '#a8724e', eyes: 'round', eye: '#7b6cd9', mouth: 'smile', blush: true,
    outfit: 'dress', c1: '#ffc8d8', c2: '#fffdf8', sock: 'short', sockC: '#fffdf8', shoe: '#a8606a', acc: 'bow', accC: '#ff6f91', glasses: false,
  });
  CT.randomLook = function () {
    const O = CT.CHAR_OPTS, p = CT.pick, c = (list) => p(list)[0];
    return {
      skin: p(O.skin.slice(0, 5)), back: c(O.back), bangs: c(O.bangs), hair: p(O.hairColors), eyes: c(O.eyes), eye: p(O.eyeColors), mouth: c(O.mouth), blush: true,
      outfit: c(O.outfit), c1: p(O.clothColors), c2: p(O.clothColors), sock: c(O.sock), sockC: p(['#fffdf8', '#ffc8d8', '#3e3a48', '#a8d8ea']), shoe: p(['#a8606a', '#7a4a3a', '#5a8ad0', '#4a3a3a', '#e0884a']),
      acc: c(O.acc), accC: p(O.accColors), glasses: CT.chance(0.14),
    };
  };

  CT.PRESETS = [
    { id: 'p_tao', name: '小桃', title: '甜点师', bio: '最喜欢烤草莓蛋糕，梦想是开一家全世界最甜的甜品屋。', likes: '蛋糕 · 粉色 · 晴天', phrase: '要不要尝尝我做的蛋糕？',
      look: { skin: '#ffe9de', back: 'twin', bangs: 'straight', hair: '#f7a8c4', eyes: 'round', eye: '#e0607e', mouth: 'open', blush: true, outfit: 'apron', c1: '#ffa8bd', c2: '#fffdf8', sock: 'knee', sockC: '#fffdf8', shoe: '#c0606e', acc: 'bow', accC: '#ff6f91', glasses: false } },
    { id: 'p_yue', name: '月月', title: '星星观察员', bio: '安静又温柔，晚上总抱着望远镜数星星。', likes: '星空 · 童话书 · 热牛奶', phrase: '今晚的星星也很亮呢。',
      look: { skin: '#fff1e8', back: 'long', bangs: 'airy', hair: '#c9b8f0', eyes: 'gentle', eye: '#7b6cd9', mouth: 'smile', blush: true, outfit: 'lolita', c1: '#b9a6ea', c2: '#fff7e0', sock: 'tights', sockC: '#fffdf8', shoe: '#6b5a9a', acc: 'star', accC: '#ffd35c', glasses: false } },
    { id: 'p_you', name: '柚子', title: '元气园丁', bio: '元气满满！喜欢种花、晒太阳，还有和小狗赛跑。', likes: '向日葵 · 橘子汽水 · 小狗', phrase: '今天也要元气满满哦！',
      look: { skin: '#fbd6be', back: 'bob', bangs: 'side', hair: '#ffb35c', eyes: 'sparkle', eye: '#3fa86b', mouth: 'open', blush: true, outfit: 'overall', c1: '#7cc6a4', c2: '#ffe27a', sock: 'short', sockC: '#fffdf8', shoe: '#e0884a', acc: 'flower', accC: '#ff8fb1', glasses: false } },
    { id: 'p_mo', name: '墨墨', title: '文艺少女', bio: '喜欢读诗和弹钢琴，下雨天会泡一壶桂花茶。', likes: '书本 · 钢琴 · 雨天', phrase: '这本书很好看，借给你吧。',
      look: { skin: '#fff1e8', back: 'long', bangs: 'hime', hair: '#3b3346', eyes: 'cat', eye: '#9b3b4f', mouth: 'smile', blush: true, outfit: 'sailor', c1: '#3e4a6b', c2: '#e8706a', sock: 'knee', sockC: '#3e3a48', shoe: '#4a3a3a', acc: 'none', accC: '#e8706a', glasses: true } },
    { id: 'p_tang', name: '糖糖', title: '小画家', bio: '口袋里永远装着蜡笔，想把小镇画成彩虹色。', likes: '画画 · 彩虹 · 薄荷糖', phrase: '别动，我想把你画下来！',
      look: { skin: '#ffe6d8', back: 'wavy', bangs: 'center', hair: '#8fd9c8', eyes: 'round', eye: '#2b9bb0', mouth: 'cat', blush: true, outfit: 'hoodie', c1: '#ffe9a8', c2: '#8fb8ff', sock: 'knee', sockC: '#fffdf8', shoe: '#5a8ad0', acc: 'beret', accC: '#e8706a', glasses: false } },
    { id: 'p_li', name: '栗子', title: '编织达人', bio: '会织毛衣和围巾，家里住着三只猫咪。', likes: '毛线 · 猫咪 · 热可可', phrase: '天冷了，我给你织条围巾吧。',
      look: { skin: '#fbd6be', back: 'braid', bangs: 'straight', hair: '#a8724e', eyes: 'gentle', eye: '#b07a3c', mouth: 'smile', blush: true, outfit: 'sweater', c1: '#f2c2a0', c2: '#7a5a48', sock: 'none', sockC: '#fffdf8', shoe: '#7a4a3a', acc: 'catEars', accC: '#a8724e', glasses: false } },
    { id: 'p_xing', name: '星星', title: '小歌手', bio: '爱唱歌的小公主，梦想是开一场星空演唱会。', likes: '唱歌 · 亮晶晶 · 草莓牛奶', phrase: '啦啦啦，一起唱歌吧！',
      look: { skin: '#fff1e8', back: 'buns', bangs: 'airy', hair: '#ffe08a', eyes: 'star', eye: '#4aa3ff', mouth: 'open', blush: true, outfit: 'dress', c1: '#9ad0ff', c2: '#fffdf8', sock: 'short', sockC: '#fffdf8', shoe: '#5a8ad0', acc: 'crown', accC: '#ffd35c', glasses: false } },
  ];

  // ---------- 关键点与路径（y 向上为负，脚底在 0） ----------
  const HC = -158, SIT_DY = 62;
  const FACE = 'M-33,0 C-33,24 -24,38 -12,44 Q0,49 12,44 C24,38 33,24 33,0 C33,-30 -33,-30 -33,0 Z';
  const DOME = 'M-40,8 C-47,-54 47,-54 40,8';
  const BACK = {
    long: DOME + ' C42,40 47,80 46,112 Q40,118 33,112 Q28,120 20,113 L-20,113 Q-28,120 -33,112 Q-40,118 -46,112 C-47,80 -42,40 -40,8 Z',
    twin: DOME + ' C41,26 37,40 30,47 L-30,47 C-37,40 -41,26 -40,8 Z',
    pony: DOME + ' C41,26 37,40 30,47 L-30,47 C-37,40 -41,26 -40,8 Z',
    bob: DOME + ' C44,26 47,40 41,50 Q34,57 26,51 L-26,51 Q-34,57 -41,50 C-47,40 -44,26 -40,8 Z',
    buns: DOME + ' C41,24 37,38 30,44 L-30,44 C-37,38 -41,24 -40,8 Z',
    wavy: DOME + ' C50,26 44,44 52,62 C58,78 48,92 54,108 Q46,120 36,110 Q30,122 20,112 L-20,112 Q-30,122 -36,110 Q-46,120 -54,108 C-48,92 -58,78 -52,62 C-44,44 -50,26 -40,8 Z',
    braid: DOME + ' C42,24 39,40 31,48 L-31,48 C-39,40 -42,24 -40,8 Z',
  };
  const TAIL = 'M30,-32 C49,-37 61,-6 59,32 C57,64 65,96 53,124 C51,110 46,100 44,86 C39,64 42,30 34,2 Z';
  const TAIL_LINE = 'M40,-16 C50,0 51,30 50,60 C49,80 52,96 52,106';
  const PONY = 'M10,-46 C42,-60 66,-30 60,10 C57,42 66,74 52,100 C48,84 42,66 40,46 C36,16 30,-14 12,-30 Z';
  const PONY_BACK = 'M-9,-34 C-24,-16 -22,30 -8,84 Q0,98 8,84 C22,30 24,-16 9,-34 Z';
  const DOMEB = 'M-37,6 C-43,-49 43,-49 37,6';
  const BANGS = {
    straight: DOMEB + ' Q33,-3 30,4 Q27,-7 22,1 Q18,-8 13,0 Q9,-9 5,-1 Q1,-10 -3,-1 Q-7,-9 -11,0 Q-16,-8 -20,1 Q-25,-7 -29,4 Q-33,-3 -37,6 Z',
    airy: DOMEB + ' Q31,-13 16,-17 Q0,-20 -16,-17 Q-31,-13 -37,6 Z M-27,-14 Q-23,-5 -25,3 Q-29,-5 -32,-8 Z M-15,-18 Q-12,-7 -15,2 Q-20,-8 -23,-15 Z M-3,-19 Q1,-8 -3,1 Q-8,-9 -11,-18 Z M9,-19 Q13,-8 9,2 Q4,-9 1,-19 Z M21,-16 Q24,-6 21,3 Q17,-7 13,-18 Z M29,-11 Q32,-4 30,4 Q27,-4 24,-13 Z',
    side: DOMEB + ' Q34,-4 30,3 Q24,-9 16,-2 Q6,-12 -6,-8 Q-18,-16 -30,-9 Q-35,-5 -37,6 Z',
    center: DOMEB + ' Q34,-2 31,5 Q27,-9 18,-12 Q8,-15 1,-25 L-1,-25 Q-8,-15 -18,-12 Q-27,-9 -31,5 Q-34,-2 -37,6 Z',
    hime: DOMEB + ' L33.5,-1 Q0,2.5 -33.5,-1 Z',
  };
  const BANG_LINES = {
    straight: 'M0,-37 Q-2,-20 -3,-4 M-14,-32 Q-14,-16 -12,-3 M14,-32 Q14,-16 12,-3 M-26,-22 Q-25,-10 -22,-2 M26,-22 Q25,-10 22,-2',
    airy: 'M0,-37 Q-1,-28 -2,-20 M-16,-30 Q-16,-24 -15,-18 M16,-30 Q16,-24 15,-18',
    side: 'M-18,-34 Q0,-22 16,-5 M-4,-37 Q8,-22 24,-4 M-30,-22 Q-14,-18 -2,-10',
    center: 'M0,-37 Q-10,-24 -24,-12 M0,-37 Q10,-24 24,-12',
    hime: 'M0,-37 L0,-2 M-13,-33 L-12,-2 M13,-33 L12,-2 M-25,-24 L-24,-2 M25,-24 L24,-2',
  };
  const LOCK = {
    long: 'M27,-18 C38,-4 42,24 40,58 Q38,67 34,60 C34,36 32,12 22,-6 Z',
    mid: 'M27,-18 C38,-4 41,20 38,42 Q35,49 32,43 C33,24 30,8 22,-6 Z',
    hime: 'M26,-18 C35,-6 38,14 38,47 L28,47 C29,20 27,4 21,-6 Z',
    short: 'M27,-18 C36,-6 38,8 36,24 Q33,29 31,24 C31,12 28,2 22,-6 Z',
  };
  const RING = 'M-27,-21 Q-14,-31 0,-32 Q14,-31 27,-21 Q14,-26 0,-26.6 Q-14,-26 -27,-21 Z';
  const TORSO = 'M-6,-106 Q0,-103 6,-106 L14,-103 Q19,-101 18.5,-95 C17.5,-89 14.5,-84 12.5,-78 L-12.5,-78 C-14.5,-84 -17.5,-89 -18.5,-95 Q-19,-101 -14,-103 Z';
  const TORSO_L = 'M-6,-106 Q0,-103 6,-106 L15,-103 Q21,-100 20.5,-93 C20,-84 20,-76 19.5,-67 Q0,-63 -19.5,-67 C-20,-76 -20,-84 -20.5,-93 Q-21,-100 -15,-103 Z';
  const SKIRT = {
    a: 'M-12.5,-80 L12.5,-80 C17,-70 23,-60 27,-51 Q14,-46.5 0,-47 Q-14,-46.5 -27,-51 C-23,-60 -17,-70 -12.5,-80 Z',
    puffy: 'M-12.5,-80 L12.5,-80 C22,-72 31,-62 34,-52 Q23,-46 11.5,-49 Q0,-45 -11.5,-49 Q-23,-46 -34,-52 C-31,-62 -22,-72 -12.5,-80 Z',
    short: 'M-18,-71 L18,-71 C21,-65 25,-59 27,-54 Q13.5,-50 0,-50.5 Q-13.5,-50 -27,-54 C-25,-59 -21,-65 -18,-71 Z',
    long: 'M-12.5,-80 L12.5,-80 C17,-60 21,-36 24,-15 Q12,-12 0,-12.5 Q-12,-12 -24,-15 C-21,-36 -17,-60 -12.5,-80 Z',
    sit: 'M-12.5,-80 L12.5,-80 C20,-74 28,-66 32,-58 Q16,-53.5 0,-54.5 Q-16,-53.5 -32,-58 C-28,-66 -20,-74 -12.5,-80 Z',
    sitLong: 'M-12.5,-80 L12.5,-80 C22,-72 30,-62 33,-50 Q16,-46 0,-47 Q-16,-46 -33,-50 C-30,-62 -22,-72 -12.5,-80 Z',
    sitPuffy: 'M-12.5,-80 L12.5,-80 C22,-74 33,-66 38,-56 Q25,-50 12.5,-53 Q0,-49 -12.5,-53 Q-25,-50 -38,-56 C-33,-66 -22,-74 -12.5,-80 Z',
  };
  const OUTFIT = {
    dress: { skirt: 'a', sleeve: 'puff' }, sailor: { skirt: 'a', sleeve: 'short', pleat: true }, hoodie: { skirt: 'short', sleeve: 'long', pleat: true },
    overall: { skirt: 'a', sleeve: 'puff' }, lolita: { skirt: 'puffy', sleeve: 'puff' }, sweater: { skirt: 'long', sleeve: 'long' },
    pajama: { skirt: null, sleeve: 'long' }, apron: { skirt: 'a', sleeve: 'puff' },
  };
  const WHITE = '#fffdf8';

  function limb(ctx, pts, w, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = stroke; ctx.lineWidth = w + 2.2; ctx.stroke();
    ctx.strokeStyle = fill; ctx.lineWidth = w; ctx.stroke();
  }
  function shoe(ctx, x, y, c) {
    ell(ctx, x, y - 4, 6.8, 4.8); fs(ctx, c, ol(c, 0.46), 1.3);
    ell(ctx, x - 2.2, y - 5.6, 2.3, 1.1); fs(ctx, 'rgba(255,255,255,0.5)');
    CT.line(ctx, x - 4, y - 7.4, x + 4, y - 7.4, ol(c, 0.25), 1.3);
  }
  function drawLegs(ctx, L, pose, wp, t, st) {
    const pants = L.outfit === 'pajama';
    const legC = pants ? L.c1 : L.sock === 'tights' ? L.sockC : L.skin;
    const lo = ol(legC, 0.42), sockC = L.sockC;
    const sockTop = (x0, y0, x1, y1, len) => {
      if (pants || L.sock === 'none' || L.sock === 'tights') return;
      const f = Math.min(1, (L.sock === 'knee' ? len : 8) / Math.hypot(x1 - x0, y1 - y0));
      limb(ctx, [x1, y1, x1 + (x0 - x1) * f, y1 + (y0 - y1) * f], 7.8, sockC, ol(sockC, 0.3));
    };
    if (pose === 'bath') return;
    if (pose === 'sit') {
      const sw = st.kick ? Math.sin(t * 2.6 + (st.seed || 0)) * 0.24 : 0;
      for (const s of [-1, 1]) {
        const a = s > 0 ? sw : -sw, kx = s * 9.5, ky = -3;
        const fx = kx + Math.sin(a) * 28, fy = ky + Math.cos(a) * 28;
        limb(ctx, [kx, ky, fx, fy], 7.6, legC, lo);
        sockTop(kx, ky, fx, fy, 22);
        shoe(ctx, fx, fy + 9, L.shoe);
      }
      return;
    }
    for (const s of [-1, 1]) {
      let hx = s * 7, hy = -58, fx = s * 7.6, fy = -9;
      if (pose === 'walk') {
        const lift = Math.max(0, Math.sin(wp + (s > 0 ? Math.PI : 0))) * 7;
        fy -= lift; fx += s * lift * 0.2;
      } else if (pose === 'held') {
        fx += Math.sin(t * 5 + s) * 2.2; fy += 3;
      }
      limb(ctx, [hx, hy, fx, fy], 7.8, legC, lo);
      sockTop(hx, hy, fx, fy, 22);
      shoe(ctx, fx, fy + 9, L.shoe);
    }
  }
  function pleats(ctx, x0, y0, spread, y1, color) {
    ctx.beginPath();
    for (const i of [-3, -2, -1, 0, 1, 2, 3]) {
      ctx.moveTo(i * x0, y0);
      ctx.lineTo(i * spread, y1 + Math.abs(i) * -0.9);
    }
    ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.stroke();
  }
  function lace(ctx, w, yc, ye, c) {
    for (let x = -w; x <= w + 0.1; x += w / 6) {
      ell(ctx, x, yc + (ye - yc) * (x / w) * (x / w) + 1, 4.1, 3.6);
      fs(ctx, c, ol(c, 0.32), 1);
    }
  }
  function miniBow(ctx, x, y, s, c) {
    const o = ol(c, 0.44);
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    fp(ctx, P('M0,0 C-3,-5 -10,-5 -9,0 C-10,5 -3,5 0,0 Z M0,0 C3,-5 10,-5 9,0 C10,5 3,5 0,0 Z'), c, o, 1.1);
    ell(ctx, 0, 0, 2, 2.3); fs(ctx, shade(c, -0.1), o, 1);
    ctx.restore();
  }
  function drawOutfit(ctx, L, sitting, back) {
    const k = L.outfit, c1 = L.c1, c2 = L.c2, sp = OUTFIT[k] || OUTFIT.dress;
    const o1 = ol(c1), o2 = ol(c2), wo = ol('#ead9df', 0.42);
    const skirtC = k === 'hoodie' || k === 'sweater' ? c2 : c1;
    const topC = k === 'sailor' || k === 'overall' ? WHITE : c1;
    const topO = ol(topC, topC === WHITE ? 0.3 : 0.5);
    const so = ol(skirtC);
    // 裙子
    if (sp.skirt || sitting) {
      const key = sitting ? (sp.skirt === 'long' ? 'sitLong' : sp.skirt === 'puffy' ? 'sitPuffy' : 'sit') : sp.skirt;
      const yb = sitting ? -54 : key === 'long' ? -13 : -48;
      const hw = sitting ? (key === 'sitPuffy' ? 38 : 32) : key === 'puffy' ? 34 : key === 'long' ? 24 : 27;
      if (k === 'lolita') lace(ctx, hw - 1, yb + 3, yb - 3, c2);
      const skC = k === 'pajama' ? c1 : skirtC;
      fp(ctx, P(SKIRT[key]), CT.lg(ctx, 0, -82, 0, yb, [shade(skC, 0.14), shade(skC, -0.07)]), so, 1.5);
      if (sp.pleat) pleats(ctx, 4, -74, 7.6, yb, CT.rgba(ol(skC, 0.6), 0.55));
      if (k === 'lolita') {
        ctx.beginPath(); ctx.moveTo(-hw + 7, yb - 12); ctx.quadraticCurveTo(0, yb - 7, hw - 7, yb - 12);
        ctx.strokeStyle = c2; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.stroke();
      }
      if (k === 'sailor') {
        ctx.beginPath(); ctx.moveTo(-hw + 2, yb - 3.5); ctx.quadraticCurveTo(0, yb + 1, hw - 2, yb - 3.5);
        ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 1.4; ctx.stroke();
      }
      if (k === 'apron' && !back) {
        const aw = sitting ? 21 : 17, ay = sitting ? -56 : -54;
        lace(ctx, aw, ay + 2, ay - 1, WHITE);
        fp(ctx, P('M-12,-80 L12,-80 L' + aw + ',' + ay + ' Q0,' + (ay + 4) + ' -' + aw + ',' + ay + ' Z'), WHITE, wo, 1.2);
      }
    }
    // 上身
    if (k === 'hoodie' && !back) {
      fp(ctx, P('M-16,-103 Q-20,-118 0,-118 Q20,-118 16,-103 Q0,-110 -16,-103 Z'), shade(c1, -0.1), o1, 1.4);
    }
    const tp = k === 'hoodie' || k === 'pajama' ? TORSO_L : TORSO;
    fp(ctx, P(tp), CT.lg(ctx, 0, -106, 0, -70, [shade(topC, 0.1), shade(topC, -0.05)]), topO, 1.5);
    if (back) {
      if (k === 'hoodie') { fp(ctx, P('M-13,-104 Q0,-90 13,-104 Q0,-107 -13,-104 Z'), shade(c1, -0.08), o1, 1.3); }
      if (k === 'sailor') { fp(ctx, P('M-15,-104 L15,-104 L13,-88 L-13,-88 Z'), c1, o1, 1.3); CT.rr(ctx, -11, -92, 22, 1.5, 0.7); fs(ctx, WHITE); }
      if (k === 'overall') { CT.line(ctx, -8, -103, 8, -82, shade(c1, -0.08), 3.4); CT.line(ctx, 8, -103, -8, -82, shade(c1, -0.08), 3.4); }
      if (k === 'apron') { CT.line(ctx, -12, -80, 12, -80, WHITE, 3.2); miniBow(ctx, 0, -80, 1.2, WHITE); }
      if (k === 'dress' || k === 'lolita') miniBow(ctx, 0, -80, 1.1, c2);
      return;
    }
    switch (k) {
      case 'dress':
        CT.rr(ctx, -13.5, -83, 27, 5, 2); fs(ctx, c2, o2, 1.1);
        miniBow(ctx, 0, -80.6, 0.72, c2);
        fp(ctx, P('M-1,-105 Q-9,-107 -13.5,-102.5 Q-12,-96 -5,-96.5 Q-1,-99 -1,-105 Z M1,-105 Q9,-107 13.5,-102.5 Q12,-96 5,-96.5 Q1,-99 1,-105 Z'), c2, o2, 1.2);
        break;
      case 'sailor':
        fp(ctx, P('M-7,-106 L-19,-101 L-14,-88 L0,-84 L14,-88 L19,-101 L7,-106 L0,-93 Z'), c1, ol(c1, 0.4), 1.3);
        ctx.beginPath(); ctx.moveTo(-15.5, -99); ctx.lineTo(-12, -90); ctx.lineTo(0, -87); ctx.lineTo(12, -90); ctx.lineTo(15.5, -99);
        ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.1; ctx.stroke();
        miniBow(ctx, 0, -87.5, 0.95, c2);
        break;
      case 'hoodie':
        fp(ctx, P('M-8,-106 Q0,-96 8,-106 Q0,-101 -8,-106 Z'), shade(c1, -0.14), o1, 1.1);
        CT.line(ctx, -4, -102, -5, -91, WHITE, 1.3); CT.line(ctx, 4, -102, 5, -91, WHITE, 1.3);
        CT.rr(ctx, -11, -80, 22, 10, 4); fs(ctx, shade(c1, -0.06), o1, 1.1);
        break;
      case 'overall':
        CT.line(ctx, -8, -103, -9, -96, c1, 3.6); CT.line(ctx, 8, -103, 9, -96, c1, 3.6);
        fp(ctx, P('M-11,-97 L11,-97 L12.5,-79 L-12.5,-79 Z'), c1, o1, 1.3);
        ell(ctx, -7.6, -94, 1.8, 1.8); fs(ctx, c2, o2, 0.8); ell(ctx, 7.6, -94, 1.8, 1.8); fs(ctx, c2, o2, 0.8);
        CT.rr(ctx, -6, -91, 12, 7, 2); fs(ctx, shade(c1, -0.07), o1, 0.9);
        break;
      case 'lolita':
        for (let x = -12; x <= 12.1; x += 4) { ell(ctx, x, -103 + Math.abs(x) * 0.12, 3.1, 2.6); fs(ctx, c2, ol(c2, 0.32), 0.9); }
        CT.rr(ctx, -13.5, -83, 27, 5, 2); fs(ctx, c2, ol(c2, 0.32), 1);
        for (const y of [-94, -89]) { ell(ctx, 0, y, 1.5, 1.5); fs(ctx, c2, ol(c2, 0.32), 0.8); }
        miniBow(ctx, 0, -98.5, 1.0, c2);
        break;
      case 'sweater':
        CT.rr(ctx, -7.5, -111, 15, 8.6, 3.4); fs(ctx, shade(c1, 0.05), o1, 1.3);
        ctx.beginPath();
        for (const x of [-12, -8, -4, 0, 4, 8, 12]) { ctx.moveTo(x, -101); ctx.lineTo(x * 0.9, -82); }
        ctx.strokeStyle = CT.rgba(o1, 0.28); ctx.lineWidth = 1; ctx.stroke();
        CT.rr(ctx, -13.5, -82, 27, 4.4, 2); fs(ctx, shade(c1, -0.1), o1, 1);
        break;
      case 'pajama':
        fp(ctx, P('M-1,-105 Q-9,-107 -13,-102.5 Q-11,-97 -5,-97.5 Q-1,-99 -1,-105 Z M1,-105 Q9,-107 13,-102.5 Q11,-97 5,-97.5 Q1,-99 1,-105 Z'), c2, o2, 1.1);
        ctx.fillStyle = CT.rgba(c2, 0.9);
        for (const d of [[-9, -91], [8, -93], [0, -85], [-12, -76], [11, -77], [-3, -73], [5, -80]]) { ctx.beginPath(); ctx.arc(d[0], d[1], 1.7, 0, 7); ctx.fill(); }
        for (const y of [-96, -89, -82, -75]) { ctx.beginPath(); ctx.arc(0, y, 1.1, 0, 7); ctx.fillStyle = shade(c1, -0.2); ctx.fill(); }
        break;
      case 'apron':
        CT.line(ctx, -8.5, -104, -9, -95, WHITE, 2.6); CT.line(ctx, 8.5, -104, 9, -95, WHITE, 2.6);
        fp(ctx, P('M-9.5,-96 Q0,-98 9.5,-96 L12,-79 L-12,-79 Z'), WHITE, wo, 1.2);
        CT.heartPath(ctx, 0, -89, 3); fs(ctx, c1);
        CT.rr(ctx, -13.5, -82, 27, 3.8, 1.8); fs(ctx, WHITE, wo, 0.9);
        fp(ctx, P('M-1,-105 Q-9,-107 -12.5,-103 Q-11,-98 -5,-98.5 Q-1,-100 -1,-105 Z M1,-105 Q9,-107 12.5,-103 Q11,-98 5,-98.5 Q1,-100 1,-105 Z'), WHITE, wo, 1.1);
        break;
      default: break;
    }
  }
  function armPoints(s, armPose, wp, t, walking, hand) {
    const sx = s * 15.6, sy = -101;
    let ex = s * 20, ey = -88, hx = s * 21.8, hy = -74;
    if (armPose === 'wave' && s > 0) { ex = 27; ey = -113; hx = 29 + Math.sin(t * 11) * 3.4; hy = -128; }
    else if (armPose === 'up') { ex = s * 25; ey = -115; hx = s * 25 + Math.sin(t * 9 + s) * 1.6; hy = -131; }
    else if (armPose === 'hold') { ex = s * 21; ey = -89; hx = s * 9; hy = -87; }
    else if (armPose === 'play') { ex = s * 21; ey = -90; hx = s * 13; hy = -87 + Math.sin(t * 15 + s * 2) * 1.8; }
    else if (armPose === 'hips') { ex = s * 25; ey = -89; hx = s * 14; hy = -80; }
    else if (armPose === 'heart') { ex = s * 23; ey = -92; hx = s * 5; hy = -94; }
    else if (walking) {
      const a = Math.sin(wp + (s > 0 ? 0 : Math.PI)) * 0.34;
      hx += Math.sin(a) * 26; hy -= Math.abs(Math.sin(a)) * 3; ex += Math.sin(a) * 11;
    }
    return [sx, sy, ex, ey, hx, hy];
  }
  function drawArms(ctx, L, st, pose, wp, t, phase) {
    const sp = OUTFIT[L.outfit] || OUTFIT.dress;
    const armPose = st.arm || (pose === 'held' ? 'up' : 'down');
    const slC = L.outfit === 'sailor' || L.outfit === 'overall' ? WHITE : L.c1;
    const skinOL = mix(L.skin, '#a0525a', 0.42);
    const so = ol(slC, slC === WHITE ? 0.3 : 0.48);
    for (const s of [-1, 1]) {
      const a = armPoints(s, armPose, wp, t, pose === 'walk');
      if (phase === 0) {
        if (sp.sleeve === 'long') {
          limb(ctx, a, 7.4, shade(slC, -0.02), so);
          const dx = a[2] - a[4], dy = a[3] - a[5], n = Math.hypot(dx, dy) || 1;
          limb(ctx, [a[4] + (dx / n) * 3, a[5] + (dy / n) * 3, a[4] + (dx / n) * 4, a[5] + (dy / n) * 4], 7.8, shade(slC, -0.12), so);
        } else {
          limb(ctx, a, 6.2, L.skin, skinOL);
          if (sp.sleeve === 'short') {
            limb(ctx, [a[0], a[1], a[0] + (a[2] - a[0]) * 0.8, a[1] + (a[3] - a[1]) * 0.8], 8.6, slC, so);
            if (L.outfit === 'sailor') limb(ctx, [a[0] + (a[2] - a[0]) * 0.78, a[1] + (a[3] - a[1]) * 0.78, a[0] + (a[2] - a[0]) * 0.82, a[1] + (a[3] - a[1]) * 0.82], 8.6, L.c1, so);
          } else {
            ell(ctx, a[0] + s * 0.8, a[1] + 2, 7.6, 6.6); fs(ctx, slC, so, 1.4);
            ell(ctx, a[0] - s * 1.4, a[1] + 0.2, 3, 2); fs(ctx, 'rgba(255,255,255,0.3)');
          }
        }
      } else {
        ell(ctx, a[4], a[5], 4, 4); fs(ctx, L.skin, skinOL, 1.2);
      }
    }
  }
  function drawHeld(ctx, kind, t) {
    ctx.save(); ctx.translate(0, -86);
    switch (kind) {
      case 'book':
        CT.rr(ctx, -13, -9, 26, 16, 2); fs(ctx, '#8fb8ff', '#5b7fb8', 1.3);
        ctx.fillStyle = WHITE; ctx.fillRect(-11, -7, 10.4, 12); ctx.fillRect(0.6, -7, 10.4, 12);
        CT.line(ctx, -9, -4, -3, -4, '#c8bfd0', 0.9); CT.line(ctx, -9, -1, -3, -1, '#c8bfd0', 0.9); CT.line(ctx, 3, -4, 9, -4, '#c8bfd0', 0.9);
        break;
      case 'can':
        fp(ctx, P('M-11,-8 L9,-8 L10,8 L-12,8 Z'), '#7cc6a4', '#4d8d72', 1.3);
        fp(ctx, P('M-11,-2 L-23,-11 L-26,-8 L-12,4 Z'), '#7cc6a4', '#4d8d72', 1.2);
        ctx.beginPath(); ctx.arc(10, 0, 6, -1.5, 1.5); ctx.strokeStyle = '#4d8d72'; ctx.lineWidth = 2; ctx.stroke();
        break;
      case 'pan':
        CT.line(ctx, 10, 2, 28, -4, '#6a5a58', 3);
        ell(ctx, 0, 2, 14, 5); fs(ctx, '#5a5560', '#3d3a44', 1.3);
        ell(ctx, -1, 1, 6, 2.2); fs(ctx, '#ffd977');
        break;
      case 'cup':
        CT.rr(ctx, -7, -6, 13, 13, 3); fs(ctx, '#fffdf8', '#c8a8b0', 1.3);
        ctx.beginPath(); ctx.arc(7, 0, 3.6, -1.4, 1.4); ctx.strokeStyle = '#c8a8b0'; ctx.lineWidth = 1.6; ctx.stroke();
        CT.rr(ctx, -5.6, -5, 10, 3, 1.4); fs(ctx, '#b97a56');
        break;
      case 'brush':
        CT.line(ctx, -2, 4, 14, -14, '#c08850', 2.6); ell(ctx, 16, -17, 3.4, 4.6, 0.7); fs(ctx, '#f27a93');
        break;
      case 'snack':
        ell(ctx, 0, 0, 8.6, 8.6); fs(ctx, '#e6b673', '#b98352', 1.3);
        for (const d of [[-3, -2], [3, 2], [2, -4], [-4, 3]]) { ell(ctx, d[0], d[1], 1.1, 1.1); fs(ctx, '#6a463a'); }
        break;
      default: break;
    }
    ctx.restore();
  }

  // ---------- 脸 ----------
  function openEye(ctx, L, side, style, lookX, lashC) {
    const ec = L.eye;
    let rx = 7.4, ry = 9.2, oy = 0;
    if (style === 'gentle') { ry = 8; oy = 1.2; }
    if (style === 'cat') { rx = 7; ry = 8.8; oy = 0.2; }
    ell(ctx, 0, oy, rx, ry); ctx.fillStyle = '#fff'; ctx.fill();
    ctx.save(); ctx.clip();
    const irisX = lookX * side - 0.3 * side;
    const g = ctx.createLinearGradient(0, oy - ry, 0, oy + ry);
    g.addColorStop(0, mix(ec, '#1a0d24', 0.68)); g.addColorStop(0.45, ec); g.addColorStop(1, mix(ec, '#ffffff', 0.62));
    ell(ctx, irisX, oy + 0.9, rx - 0.7, ry - 0.4); ctx.fillStyle = g; ctx.fill();
    ell(ctx, irisX, oy + 1.8, 3.2, 4.4); ctx.fillStyle = mix(ec, '#160a20', 0.78); ctx.fill();
    ell(ctx, irisX, oy + 6, 4.6, 2.4); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fill();
    ctx.fillStyle = 'rgba(40,20,50,0.16)'; ctx.fillRect(-rx - 1, oy - ry - 1, rx * 2 + 2, 3.4);
    const hx = -3 * side;
    if (style === 'star') {
      CT.starPath(ctx, irisX, oy + 1.2, 4.4, 1.9, 5); ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fill();
      ell(ctx, hx * 1.1, oy - 4.2, 1.8, 2); ctx.fill();
    } else {
      ell(ctx, hx, oy - 3.4, 2.7, 3); ctx.fillStyle = '#fff'; ctx.fill();
      ell(ctx, -hx * 0.85, oy + 3.8, 1.3, 1.4); ctx.fill();
      if (style === 'sparkle') {
        CT.sparkle(ctx, -hx * 0.7, oy - 3.6, 3.2, '#fff');
        ell(ctx, hx * 0.5, oy + 5, 0.9, 0.9); ctx.fill();
      }
    }
    ctx.restore();
    ctx.strokeStyle = lashC; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    if (style === 'gentle') { ctx.moveTo(-8.4, oy - 3.6); ctx.quadraticCurveTo(-2, oy - 9.4, 4, oy - 8.2); ctx.quadraticCurveTo(7.8, oy - 7.2, 9.6, oy - 2.4); }
    else if (style === 'cat') { ctx.moveTo(-8.2, oy - 4.6); ctx.quadraticCurveTo(-3, oy - 10.6, 3, oy - 10.2); ctx.quadraticCurveTo(8, oy - 9.8, 10.6, oy - 8.8); }
    else { ctx.moveTo(-8.2, oy - 2.6); ctx.quadraticCurveTo(-6, oy - 10.4, -0.6, oy - 10.6); ctx.quadraticCurveTo(6.4, oy - 10.8, 9.6, oy - 2.8); }
    ctx.lineWidth = 2.5; ctx.stroke();
    ctx.beginPath();
    if (style === 'cat') { ctx.moveTo(9.6, oy - 8.8); ctx.lineTo(13.4, oy - 11.6); }
    else { ctx.moveTo(9, oy - 5.2); ctx.lineTo(11.4, oy - 5.6); }
    ctx.lineWidth = 1.4; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-4.4, oy + ry + 0.1); ctx.quadraticCurveTo(0.5, oy + ry + 1.2, 5, oy + ry - 0.7);
    ctx.strokeStyle = CT.rgba(lashC, 0.32); ctx.lineWidth = 1; ctx.stroke();
  }
  function drawFace(ctx, L, st, pose, fx) {
    const expr = pose === 'sleep' ? 'sleep' : st.expr || 'normal';
    const closed = st.blink || expr === 'sleep';
    const happy = expr === 'happy' || expr === 'love';
    const lashC = mix(L.hair, '#3a2030', 0.66);
    const blushK = expr === 'shy' || expr === 'love' ? 0.8 : happy ? 0.62 : 0.46;
    if (L.blush) {
      for (const s of [-1, 1]) {
        const bx = s * 21.5 + fx * 0.7, by = 26;
        const g = ctx.createRadialGradient(bx, by, 0, bx, by, 9.5);
        g.addColorStop(0, 'rgba(255,128,150,' + blushK + ')'); g.addColorStop(1, 'rgba(255,128,150,0)');
        ctx.save(); ctx.translate(0, by); ctx.scale(1, 0.62); ctx.translate(0, -by);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(bx, by, 9.5, 0, 7); ctx.fill();
        ctx.restore();
      }
    }
    if (expr === 'shy') {
      for (const s of [-1, 1]) for (const i of [0, 1, 2]) CT.line(ctx, s * 21 + fx * 0.7 + (i - 1) * 3.4 - 1, 28, s * 21 + fx * 0.7 + (i - 1) * 3.4 + 1, 24.6, 'rgba(240,100,125,0.6)', 0.9);
    }
    for (const s of [-1, 1]) {
      ctx.save();
      ctx.translate(s * 14.5 + fx, 13);
      ctx.scale(s, 1);
      ctx.strokeStyle = lashC; ctx.lineCap = 'round'; ctx.lineWidth = 2.4;
      if (expr === 'love' && !closed) {
        CT.heartPath(ctx, 0, 0, 6); fs(ctx, '#ff6f91', mix('#ff6f91', INK, 0.4), 1.1);
      } else if (happy) {
        ctx.beginPath(); ctx.moveTo(-7.4, 4); ctx.quadraticCurveTo(0, -6, 7.4, 4); ctx.stroke();
      } else if (closed) {
        ctx.beginPath(); ctx.moveTo(-7.6, 0); ctx.quadraticCurveTo(0, 5.4, 7.6, 0); ctx.stroke();
        ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(7, 0.8); ctx.lineTo(10, -1.2); ctx.stroke();
      } else {
        openEye(ctx, L, s, L.eyes, (st.face || 0) * 1.1, lashC);
      }
      ctx.restore();
    }
    ell(ctx, fx * 0.9, 25, 0.9, 0.6); fs(ctx, 'rgba(205,120,110,0.65)');
    ctx.save(); ctx.translate(fx * 0.9, 33);
    const m = expr === 'sleep' ? 'tiny' : expr === 'surprise' ? 'o' : happy ? 'open' : expr === 'shy' ? 'pout' : L.mouth;
    const mc = '#b84a60';
    if (m === 'smile') { fp(ctx, P('M-3.9,-0.6 Q0,3.2 3.9,-0.6'), null, mc, 1.5); }
    else if (m === 'open') {
      fp(ctx, P('M-5,-1.4 Q0,8 5,-1.4 Q0,0.2 -5,-1.4 Z'), '#c8485e', mc, 1.1);
      ell(ctx, 0, 3.1, 2.4, 1.4); fs(ctx, '#ff93a4');
    } else if (m === 'cat') { fp(ctx, P('M-5.6,-1 Q-2.8,2.8 0,0 Q2.8,2.8 5.6,-1'), null, mc, 1.4); }
    else if (m === 'o') { ell(ctx, 0, 1, 2.2, 2.7); fs(ctx, '#c8485e', mc, 1); }
    else if (m === 'pout') { fp(ctx, P('M-2.2,-1.8 Q1.8,-0.7 -0.6,0.7 Q1.8,2 -2.2,3.1'), null, mc, 1.4); }
    else { fp(ctx, P('M-1.8,0 Q0,1.2 1.8,0'), null, mc, 1.3); }
    ctx.restore();
  }

  // ---------- 头发与饰品 ----------
  function drawTail(ctx, side, ang, fill, stroke) {
    ctx.save(); ctx.scale(side, 1);
    ctx.translate(34, -24); ctx.rotate(ang * side); ctx.translate(-34, 24);
    fp(ctx, P(TAIL), fill, stroke, 1.6);
    fp(ctx, P(TAIL_LINE), null, CT.rgba(stroke, 0.4), 1);
    ctx.restore();
  }
  function drawBackHair(ctx, L, fill, stroke, sway) {
    ctx.lineJoin = 'round';
    const b = L.back;
    if (b === 'buns') {
      for (const s of [-1, 1]) {
        ell(ctx, s * 27, -41, 14.5, 14.5); fs(ctx, fill, stroke, 1.6);
        ctx.beginPath(); ctx.arc(s * 27, -41, 8.5, 0.4, 3.6); ctx.strokeStyle = CT.rgba(stroke, 0.45); ctx.lineWidth = 1; ctx.stroke();
      }
    }
    if (b === 'pony') {
      ctx.save(); ctx.translate(14, -40); ctx.rotate(sway * 0.9); ctx.translate(-14, 40);
      fp(ctx, P(PONY), fill, stroke, 1.6);
      ctx.restore();
    }
    fp(ctx, P(BACK[b] || BACK.long), fill, stroke, 1.6);
    if (b === 'twin') { drawTail(ctx, 1, sway, fill, stroke); drawTail(ctx, -1, sway, fill, stroke); }
  }
  function tieDot(ctx, x, y, c) { ell(ctx, x, y, 4.4, 4.4); fs(ctx, c, ol(c, 0.44), 1.1); ell(ctx, x - 1.2, y - 1.2, 1.3, 1.3); fs(ctx, 'rgba(255,255,255,0.6)'); }
  function drawBraid(ctx, L, headY, sway, fill, stroke) {
    const n = 7;
    for (let i = 0; i < n; i++) {
      const cx = 29 + Math.sin(i * 0.9) * 1.4 + sway * 8 * (i / n), cy = headY + 36 + i * 9.4;
      ell(ctx, cx, cy, 7.6 - i * 0.34, 6.4, i % 2 ? 0.5 : -0.5);
      fs(ctx, fill, stroke, 1.3);
    }
    const ex = 29 + sway * 8, ey = headY + 36 + n * 9.4;
    fp(ctx, P('M' + (ex - 4.4) + ',' + (ey - 4) + ' L' + (ex + 4.4) + ',' + (ey - 4) + ' L' + (ex + 2.6) + ',' + (ey + 8) + ' L' + ex + ',' + (ey + 5) + ' L' + (ex - 2.6) + ',' + (ey + 8) + ' Z'), fill, stroke, 1.2);
    tieDot(ctx, ex, ey - 4.6, L.accC);
  }
  function bow(ctx, x, y, s, rot, c) {
    const o = ol(c, 0.42);
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    fp(ctx, P('M-1,2 L-8,16 L-3,14 L-1,18 Z M1,2 L8,16 L3,14 L1,18 Z'), shade(c, -0.07), o, 1.2);
    fp(ctx, P('M0,0 C-6,-11 -18,-10 -17,0 C-18,10 -6,11 0,0 Z M0,0 C6,-11 18,-10 17,0 C18,10 6,11 0,0 Z'), c, o, 1.4);
    fp(ctx, P('M-3,0 C-7,-4 -12,-4 -12,0 C-12,4 -7,4 -3,0 Z M3,0 C7,-4 12,-4 12,0 C12,4 7,4 3,0 Z'), shade(c, -0.1));
    ell(ctx, -9, -4.6, 3.4, 1.5, -0.3); fs(ctx, 'rgba(255,255,255,0.45)');
    ell(ctx, 0, 0, 3.8, 4.4); fs(ctx, shade(c, 0.1), o, 1.2);
    ctx.restore();
  }
  function earsBack(ctx, L, t) {
    const c = L.accC, o = ol(c, 0.42);
    if (L.acc === 'catEars') {
      for (const s of [-1, 1]) {
        ctx.save(); ctx.scale(s, 1);
        fp(ctx, P('M12,-32 Q16,-51 24,-59 Q33,-48 38,-31 Z'), c, o, 1.5);
        fp(ctx, P('M18,-35 Q20,-46 24,-51.5 Q29,-44 32,-35 Z'), '#ffbfcf');
        ctx.restore();
      }
    } else if (L.acc === 'bunny') {
      for (const s of [-1, 1]) {
        ctx.save(); ctx.scale(s, 1); ctx.translate(15, -34); ctx.rotate(0.13 + Math.sin(t * 2 + s) * 0.03); ctx.translate(-15, 34);
        fp(ctx, P('M7,-34 C1,-60 6,-94 15,-94 C24,-94 27,-60 23,-34 Z'), c, o, 1.5);
        fp(ctx, P('M11.5,-38 C8,-60 11,-84 15,-84 C20,-84 21,-60 19,-38 Z'), '#ffbfcf');
        ctx.restore();
      }
    }
  }
  function accFront(ctx, L) {
    const c = L.accC, o = ol(c, 0.42);
    switch (L.acc) {
      case 'bow': bow(ctx, -23, -29, 0.85, -0.42, c); break;
      case 'flower':
        for (let i = 0; i < 5; i++) { const a = (i * Math.PI * 2) / 5 - 1.57; ell(ctx, 25 + Math.cos(a) * 5, -22 + Math.sin(a) * 5, 4.2, 4.2); fs(ctx, c, o, 1); }
        ell(ctx, 25, -22, 2.8, 2.8); fs(ctx, '#ffe27a', '#d8a848', 0.9);
        break;
      case 'beret':
        fp(ctx, P('M-30,-27 C-37,-45 -10,-54 11,-52 C33,-50 42,-38 33,-25 C20,-31 -14,-33 -30,-27 Z'), CT.lg(ctx, 0, -54, 0, -25, [shade(c, 0.14), shade(c, -0.08)]), o, 1.5);
        CT.rr(ctx, 3, -56.5, 5, 6, 2); fs(ctx, shade(c, -0.1), o, 1.1);
        ell(ctx, -8, -44, 11, 3.2, -0.2); fs(ctx, 'rgba(255,255,255,0.28)');
        break;
      case 'star':
        CT.starPath(ctx, 25, -21, 7.4, 3.5, 5, 0.2); fs(ctx, c, o, 1.2);
        CT.starPath(ctx, 32, -11, 3.8, 1.8, 5, -0.2); fs(ctx, c, o, 0.9);
        break;
      case 'band':
        fp(ctx, P('M-35,-5 C-41,-46 41,-46 35,-5'), null, o, 5.8);
        fp(ctx, P('M-35,-5 C-41,-46 41,-46 35,-5'), null, c, 3.8);
        break;
      case 'crown':
        fp(ctx, P('M-13,-35 L-14,-47 L-7,-41 L0,-52 L7,-41 L14,-47 L13,-35 Q0,-38 -13,-35 Z'), CT.lg(ctx, 0, -52, 0, -34, [shade(c, 0.3), c]), o, 1.3);
        ell(ctx, 0, -41.5, 2, 2); fs(ctx, '#ff8fb1', '#c85878', 0.8);
        ell(ctx, -8, -38.8, 1.3, 1.3); fs(ctx, '#8fd9f8'); ell(ctx, 8, -38.8, 1.3, 1.3); fs(ctx, '#8fd9f8');
        break;
      default: break;
    }
  }
  function drawGlasses(ctx, fx) {
    const c = '#6a4a5a';
    for (const s of [-1, 1]) {
      ell(ctx, s * 14.5 + fx, 13, 10.4, 10.4); fs(ctx, 'rgba(255,255,255,0.1)', c, 1.5);
      CT.line(ctx, s * 24.6 + fx, 10, s * 33 + fx * 0.3, 7, c, 1.3);
      ctx.beginPath(); ctx.arc(s * 14.5 + fx, 13, 8, -2.4, -1.6); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.4; ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(-4.2 + fx, 11); ctx.quadraticCurveTo(fx, 8.6, 4.2 + fx, 11); ctx.strokeStyle = c; ctx.lineWidth = 1.4; ctx.stroke();
  }

  // ---------- 主绘制 ----------
  // st: { t, pose: stand|walk|sit|bath|sleep|held, walkPhase, face(-1..1), back, blink, expr, arm, hold, hop, kick, tilt, seed }
  CT.drawChar = function (ctx, L, st) {
    st = st || {};
    const t = st.t || 0, pose = st.pose || 'stand', wp = st.walkPhase || 0, seed = st.seed || 0;
    const walking = pose === 'walk', sitting = pose === 'sit' || pose === 'bath', lying = pose === 'sleep';
    const breath = Math.sin(t * 2.1 + seed);
    const fx = (st.face || 0) * 3.3;
    const dy = sitting ? SIT_DY : 0;
    const hair = L.hair, hairOL = ol(hair, 0.34), skinOL = mix(L.skin, '#a0525a', 0.42);
    const sway = Math.sin(t * 1.7 + seed) * 0.045 + (walking ? Math.sin(wp) * 0.09 : 0) - (st.face || 0) * 0.07;
    const tilt = (st.tilt || 0) + (walking ? Math.sin(wp) * 0.018 : Math.sin(t * 0.9 + seed) * 0.014);
    ctx.save();
    ctx.lineJoin = 'round';
    if (lying) ctx.translate(0, -HC - 8); // 睡觉时原点就是枕头上的头部中心
    ctx.translate(0, (walking ? -Math.abs(Math.sin(wp)) * 3.2 : 0) + (st.hop || 0));
    const headY = HC + dy + breath * 0.5;
    const hairFill = (c) => CT.lg(ctx, 0, -46, 0, 118, [shade(c, 0.18), c, shade(c, -0.15)]);

    if (st.back) {
      drawLegs(ctx, L, pose, wp, t, st);
      ctx.save(); ctx.translate(0, dy + breath * 0.25);
      drawOutfit(ctx, L, sitting, true);
      drawArms(ctx, L, st, pose, wp, t, 0);
      drawArms(ctx, L, st, pose, wp, t, 1);
      ctx.restore();
      ctx.save(); ctx.translate(0, headY); ctx.rotate(tilt);
      earsBack(ctx, L, t);
      const hf = hairFill(hair);
      if (L.back === 'pony') { fp(ctx, P(BACK.pony), hf, hairOL, 1.6); ctx.save(); ctx.rotate(sway * 0.5); fp(ctx, P(PONY_BACK), hf, hairOL, 1.6); ctx.restore(); tieDot(ctx, 0, -33, L.accC); }
      else {
        if (L.back === 'buns') for (const s of [-1, 1]) { ell(ctx, s * 27, -41, 14.5, 14.5); fs(ctx, hf, hairOL, 1.6); }
        fp(ctx, P(BACK[L.back] || BACK.long), hf, hairOL, 1.6);
        if (L.back === 'twin') { drawTail(ctx, 1, sway, hf, hairOL); drawTail(ctx, -1, sway, hf, hairOL); tieDot(ctx, 34, -25, L.accC); tieDot(ctx, -34, -25, L.accC); }
      }
      fp(ctx, P(RING), 'rgba(255,255,255,0.3)');
      ctx.restore();
      if (L.back === 'braid') { ctx.save(); ctx.translate(-29, 0); const hf2 = CT.lg(ctx, 0, headY, 0, headY + 110, [hair, shade(hair, -0.12)]); drawBraid(ctx, L, headY, sway, hf2, hairOL); ctx.restore(); }
      ctx.save(); ctx.translate(0, headY); accFront(ctx, L); ctx.restore();
      ctx.restore();
      return;
    }

    // 后发
    ctx.save(); ctx.translate(-fx * 0.35, headY); ctx.rotate(tilt);
    drawBackHair(ctx, L, hairFill(hair), hairOL, sway);
    ctx.restore();

    if (!lying) drawLegs(ctx, L, pose, wp, t, st);

    // 身体
    ctx.save(); ctx.translate(0, dy + breath * 0.25);
    ctx.save();
    // 脖子
    CT.rr(ctx, -5.2, -118, 10.4, 15, 3); fs(ctx, shade(L.skin, -0.05), skinOL, 1.2);
    ctx.restore();
    drawOutfit(ctx, L, sitting, false);
    if (!lying) {
      drawArms(ctx, L, st, pose, wp, t, 0);
      if (st.hold) drawHeld(ctx, st.hold, t);
      drawArms(ctx, L, st, pose, wp, t, 1);
    }
    ctx.restore();

    if (L.back === 'braid') {
      ctx.save(); ctx.translate(-fx * 0.2, 0);
      drawBraid(ctx, L, headY, sway, CT.lg(ctx, 0, headY + 30, 0, headY + 110, [hair, shade(hair, -0.12)]), hairOL);
      ctx.restore();
    }

    // 头
    ctx.save(); ctx.translate(0, headY); ctx.rotate(tilt);
    const skinG = ctx.createRadialGradient(0, 8, 8, 0, 14, 44);
    skinG.addColorStop(0, shade(L.skin, 0.12)); skinG.addColorStop(1, mix(L.skin, '#ffb5a6', 0.16));
    fp(ctx, P(FACE), skinG, skinOL, 1.5);
    earsBack(ctx, L, t);
    drawFace(ctx, L, st, pose, fx);

    ctx.save(); ctx.translate(fx * 0.42, 0);
    const b = BANGS[L.bangs] ? L.bangs : 'straight';
    ctx.save(); ctx.clip(P(FACE)); ctx.translate(0, 3.4); ctx.fillStyle = 'rgba(150,70,90,0.13)'; ctx.fill(P(BANGS[b])); ctx.restore();
    const hf = hairFill(hair);
    const lock = b === 'hime' ? 'hime' : L.back === 'long' || L.back === 'wavy' || L.back === 'twin' ? 'long' : L.back === 'bob' || L.back === 'braid' ? 'mid' : 'short';
    for (const s of [-1, 1]) { ctx.save(); ctx.scale(s, 1); fp(ctx, P(LOCK[lock]), hf, hairOL, 1.5); ctx.restore(); }
    ctx.save(); ctx.translate(0, -2.6);
    fp(ctx, P(BANGS[b]), hf, CT.rgba(hairOL, 0.8), 1.4);
    fp(ctx, P(BANG_LINES[b]), null, CT.rgba(hairOL, 0.26), 0.9);
    ctx.restore();
    fp(ctx, P(RING), 'rgba(255,255,255,0.38)');
    if (L.back === 'twin') { tieDot(ctx, 34, -25, L.accC); tieDot(ctx, -34, -25, L.accC); }
    if (L.back === 'pony') tieDot(ctx, 15, -38, L.accC);
    // 额头露出来的刘海才画眉毛，齐刘海会盖住
    if (b !== 'straight' && b !== 'hime') {
      ctx.globalAlpha = 0.46;
      for (const s of [-1, 1]) {
        const by = -3.4 - (st.expr === 'surprise' ? 2 : 0);
        ctx.save(); ctx.translate(s * 15 + fx * 0.6, by); ctx.scale(s, 1);
        fp(ctx, P('M-5,-0.4 Q0,-2 5.4,1.2'), null, mix(hair, '#3a2030', 0.42), 1.1);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
    accFront(ctx, L);
    ctx.restore();
    if (L.glasses) drawGlasses(ctx, fx);
    ctx.restore();

    ctx.restore();
  };

  // 画到一块小画布上：full 全身，head 只要头像（捏人选项按钮用）
  CT.charThumb = function (cv, look, opts) {
    opts = opts || {};
    const ctx = cv.getContext('2d'), w = cv.width, h = cv.height;
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    if (opts.mode === 'head') {
      const s = Math.min(w, h) / 118;
      ctx.translate(w / 2, h / 2 + s * 4);
      ctx.scale(s, s);
      ctx.translate(0, -HC);
    } else {
      const s = Math.min(w / 140, h / 226);
      ctx.translate(w / 2, h - 6 * s);
      ctx.scale(s, s);
    }
    CT.drawChar(ctx, look, opts.st || { t: opts.t || 0.5 });
    ctx.restore();
  };
  CT.CHAR_H = 200;
})(window.CT);
