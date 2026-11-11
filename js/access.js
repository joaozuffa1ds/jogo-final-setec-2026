/* ============================================================
   access.js  —  menu de acessibilidade

   Fica num save separado (vs_acess_v1) que NÃO é apagado pelo
   código de wipe do criador: tamanho de fonte e volume não
   podem sumir porque a pessoa resetou o progresso do jogo.

   O jogo não lê o VS.Access direto nos loops quentes: no apply()
   os valores são copiados para VS.Game.acc, que é só um objeto
   com números (leitura barata dentro do update).
   ============================================================ */
window.VS = window.VS || {};

VS.Access = (function () {
  /* não começa com "vs2d" de propósito: o wipe() do save.js apaga
     tudo com esse prefixo e isso aqui é preferência, não progresso */
  const KEY = 'vs_acess_v1';

  const DEFAULTS = {
    /* áudio */
    volume: 100,
    /* conforto visual */
    shake: 100,          /* 0 = sem tremor, 50 = pela metade, 100 = normal */
    flash: true,         /* false = tira as piscadas da tela */
    particles: 100,      /* 0 = sem fagulhas */
    /* leitura */
    damageNum: false,    /* mostra o número de todo golpe */
    highlight: false,    /* contorno grosso em volta de cada bicho */
    uiScale: 100,        /* 100 / 115 / 130 */
    /* jogabilidade */
    damageTaken: 100,    /* 50 / 75 / 100 */
    knockback: true,     /* false = não sai do lugar ao apanhar */
    aimAssist: false,    /* mira de muito mais longe */
    enemySpeed: 100,     /* 70 / 85 / 100 */
    /* desempenho */
    quality: 'auto'      /* 'auto' | 'high' | 'low' */
  };

  let s = Object.assign({}, DEFAULTS);

  /* ---------------- persistência ---------------- */
  function disponivel() {
    try {
      localStorage.setItem('__a', '1');
      localStorage.removeItem('__a');
      return true;
    } catch (e) { return false; }
  }

  function load() {
    if (!disponivel()) return;
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const o = JSON.parse(raw);
      for (const k in DEFAULTS) {
        if (o[k] === undefined) continue;
        /* so aceita o tipo do padrão: evita save corrompido
           deixando o jogo com volume "abc" ou shake null */
        if (typeof o[k] !== typeof DEFAULTS[k]) continue;
        s[k] = o[k];
      }
    } catch (e) { }
  }

  function save() {
    if (!disponivel()) return;
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { }
  }

  /* ---------------- api ---------------- */
  function get(k) { return s[k]; }
  function all() { return s; }

  function set(k, v) {
    if (!(k in DEFAULTS)) return false;
    if (s[k] === v) return true;
    s[k] = v;
    save();
    apply();
    return true;
  }

  function reset() {
    s = Object.assign({}, DEFAULTS);
    save();
    apply();
  }

  /* ---------------- aplicar no jogo ----------------
     Tudo que muda de verdade é feito aqui, num lugar só. */
  function apply() {
    const A = window.VS ? VS.Audio : null;
    const U = window.VS ? VS.U : null;
    const G = window.VS ? VS.Game : null;

    if (A) A.setVolume(s.volume / 100);
    if (U) U.setShakeScale(s.shake / 100);

    if (G && G.acc) {
      G.acc.shake = s.shake / 100;
      G.acc.flash = s.flash;
      G.acc.particles = s.particles / 100;
      G.acc.damageNum = s.damageNum;
      G.acc.highlight = s.highlight;
      G.acc.damageTaken = s.damageTaken / 100;
      G.acc.knockback = s.knockback;
      G.acc.aim = s.aimAssist ? 1200 : 460;
      G.acc.enemySpeed = s.enemySpeed / 100;
      /* qualityLock 0 = deixa o motor medir sozinho */
      G.acc.qualityLock = s.quality === 'high' ? 1 : s.quality === 'low' ? 0.45 : 0;
      if (G.perf) {
        if (G.acc.qualityLock) G.perf.quality = G.acc.qualityLock;
      }
    }

    /* a interface inteira cresce junto (canvas incluído) */
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.style.setProperty('--ui', String(s.uiScale / 100));
    }

    /* o canvas precisa de mais pixels quando a tela é ampliada,
       senão a imagem fica borrada (o resize() olha o --ui) */
    if (G && G.resize) G.resize();
  }

  return { DEFAULTS, load, save, get, set, all, reset, apply, KEY };
})();