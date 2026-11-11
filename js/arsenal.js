/* ============================================================
   arsenal.js — ARSENAL (PC: teclado + mouse)
   Raridades (Comum → Lendária), inventário de armas, equipar/
   trocar/desequipar, LOJA com compra e reroll, venda com
   confirmação e fusão de armas IGUAIS (mesmo id, mesma raridade
   → raridade seguinte). Tudo integrado ao dinheiro do jogo
   (g.money) e às armas reais de g.p.weapons — nada de sistema
   paralelo: as instâncias do arsenal SÃO as armas da partida.
   ============================================================ */
window.VS = window.VS || {};

VS.Arsenal = (function () {
  const D = VS.DATA;
  const U = VS.U;

  /* ============================================================
     RARIDADES — cada tier muda os atributos de verdade:
     dmg = dano, cd = recarga (menor = melhor), size = áreas
     (raio/comprimento de espada, len de raios, maxR de anéis).
     Comum vale exatamente como antes (multiplicadores 1), então
     o balanceamento já existente é preservado.
     ============================================================ */
  const RARITIES = [
    { id: 'comum',    name: 'Comum',    color: '#9aa4b2', dmg: 1.00, cd: 1.00, size: 1.00, price: 30 },
    { id: 'incomum',  name: 'Incomum',  color: '#63e6a0', dmg: 1.25, cd: 0.94, size: 1.05, price: 60 },
    { id: 'rara',     name: 'Rara',     color: '#56b6ff', dmg: 1.50, cd: 0.88, size: 1.10, price: 115 },
    { id: 'epica',    name: 'Épica',    color: '#b14bff', dmg: 1.85, cd: 0.82, size: 1.15, price: 195 },
    { id: 'lendaria', name: 'Lendária', color: '#ffcc4d', dmg: 2.30, cd: 0.75, size: 1.20, price: 320 }
  ];

  /* ---------------- estado da sessão ---------------- */
  const inv = [];                  /* {uid, id, rar, level} — NÃO equipadas */
  let uid = 1;
  let stock = [];                  /* ofertas da loja: {id, rar} */
  let tab = 'banco';               /* 'banco' | 'loja' */
  let isOpenNow = false;
  let wasPause = false;            /* abriu por cima da tela de pausa? */
  let pendingSell = null;          /* uid aguardando confirmação de venda */
  const el = {};

  const G = () => VS.Game;
  const rarAt = (i) => RARITIES[Math.max(0, Math.min(4, i | 0))];
  const depth = () => Math.max(1, G().depth || 1);

  /* ============================================================
     STATS + PREÇOS
     ============================================================ */
  function statsFor(w, def, lv) {
    const id = (w && w.id) || (def && def.id) || 'espada';
    def = def || D.def(id);
    if (!def) return null;
    const s = D.statsFor(def, lv !== undefined ? lv : ((w && w.level) || 1));
    const R = rarAt(w ? w.rar : 0);
    if (R.dmg !== 1) s.dmg *= R.dmg;
    if (R.cd !== 1 && s.cd) s.cd = Math.max(0.08, s.cd * R.cd);
    if (R.size !== 1) {
      if (s.radius) s.radius *= R.size;
      if (s.len) s.len *= R.size;
      if (s.maxR) s.maxR *= R.size;
      if (s.width) s.width *= R.size;
    }
    return s;
  }

  function priceMul() { return 1 + Math.min(2, (depth() - 1) * 0.085); }
  function price(rarIdx, id) {
    return Math.max(12, Math.round(rarAt(rarIdx).price * (D.isFusion(id) ? 1.55 : 1) * priceMul()));
  }
  function sellPrice(rarIdx, id) { return Math.max(8, Math.round(price(rarIdx, id) * 0.45)); }
  function rerollCost() { return 8 + (depth() - 1) * 3; }

  /* sorteio de raridade: fica melhor conforme a profundidade e a sorte */
  function rollRar(dep, luck) {
    const d = Math.max(0, (dep || 1) - 1);
    const lk = Math.max(0, luck || 0);
    let tot = 0;
    const wts = RARITIES.map((R, i) => {
      let w = [100, 34, 13, 3.2, 0.5][i];
      if (i === 0) w *= Math.pow(0.97, d);
      else w *= (1 + [0, 0.04, 0.07, 0.09, 0.11][i] * d) * (1 + lk * 0.04);
      tot += w;
      return w;
    });
    let r = Math.random() * tot;
    for (let i = 0; i < wts.length; i++) { r -= wts[i]; if (r <= 0) return i; }
    return 0;
  }

  /* ============================================================
     INVENTÁRIO / EQUIPE
     ============================================================ */
  function pushInv(id, rarIdx, lv) {
    const def = D.def(id);
    if (!def) return null;
    const t = {
      uid: uid++,
      id: id,
      rar: Math.max(0, Math.min(4, rarIdx | 0)),
      level: Math.max(1, Math.min(def.max, lv || 1))
    };
    inv.push(t);
    return t;
  }

  function bindRun() {
    inv.length = 0;
    stock.length = 0;
    uid = 1;
    isOpenNow = false;
    wasPause = false;
    pendingSell = null;
    if (G()) G().arsenalOpen = false;
  }

  function invSnapshot() {
    return inv.map(t => ({ id: t.id, rar: t.rar, lv: t.level }));
  }

  function restore(list) {
    bindRun();
    if (!Array.isArray(list)) return;
    for (const t0 of list) {
      if (t0 && D.def(t0.id)) pushInv(t0.id, t0.rar, t0.lv);
    }
  }

  /* arma equipada garantindo os campos do arsenal (rar/uid retroativos) */
  function ensureFields(w) {
    if (!w.uid) w.uid = 10000 + (uid++);
    if (typeof w.rar !== 'number') w.rar = 0;
    return w;
  }

  function findInv(itemUid) {
    for ( let i = 0; i < inv.length; i++) if (inv[i].uid === itemUid) return i;
    return -1;
  }
  function findEquipped(itemUid) {
    const ws = G().p ? G().p.weapons : [];
    for (let i = 0; i < ws.length; i++) if ((ws[i].uid || 0) === itemUid) return i;
    return -1;
  }

  function equipIdxFree() {
    const p = G().p;
    return !!p && p.weapons.length < p.slots;
  }

  function equipInv(itemUid) {
    const i = findInv(itemUid);
    if (i < 0) { deny('Essa arma não está mais no inventário'); return false; }
    if (!equipIdxFree()) { deny('Slots cheios! Guarde ou venda uma arma equipada'); return false; }
    const t = inv.splice(i, 1)[0];
    const p = G().p;
    p.weapons.push({
      id: t.id, level: t.level, cd: U.rand(0, 0.4), stats: null,
      rar: t.rar, uid: t.uid
    });
    SFX().buy();
    toast('⚔️ EQUIPADA: ' + rarAt(t.rar).name + ' ' + D.def(t.id).name, 2000);
    render();
    return true;
  }

  function unequip(itemUid) {
    const i = findEquipped(itemUid);
    if (i < 0) { deny('Essa arma não está equipada'); return false; }
    const w = G().p.weapons.splice(i, 1)[0];
    inv.push({ uid: w.uid || (uid++), id: w.id, rar: w.rar || 0, level: w.level });
    SFX().buy();
    toast('🎒 Guardada no inventário: ' + D.def(w.id).name, 2000);
    render();
    return true;
  }

  /* trocar: equipa uma do inventário no lugar de uma equipada
     (a equipada desce pro inventário — nada se perde) */
  function swap(itemUid, slotIdx) {
    const p = G().p;
    if (!p) return false;
    const i = slotIdx | 0;
    const w = p.weapons[i];
    const invI = findInv(itemUid);
    if (!w || invI < 0) { deny('Troca inválida'); return false; }
    const t = inv.splice(invI, 1)[0];
    p.weapons[i] = { id: t.id, level: t.level, cd: U.rand(0, 0.4), stats: null, rar: t.rar, uid: t.uid };
    inv.push({ uid: w.uid || (uid++), id: w.id, rar: w.rar || 0, level: w.level });
    SFX().buy();
    toast('⚔️ ' + D.def(t.id).name + ' equipada — ' + D.def(w.id).name + ' guardada', 2200);
    render();
    return true;
  }

  /* ============================================================
     COMPRA / VENDA / FUSÃO
     ============================================================ */
  function payUp(cost) {
    if (G().money < cost) {
      deny('🪙 Moedas insuficientes! (' + fmt(G().money) + '/' + cost + ')');
      return false;
    }
    G().money -= cost;
    return true;
  }
  function earn(amt) {
    G().money += amt;
    G().goldTotal = (G().goldTotal || 0) + amt;
  }

  function rollStock() {
    stock.length = 0;
    /* mesma fonte dos BAÚS (D.allWeapons): o arsenal não é mais restrito
       que o resto do jogo. Fusões não se vendem — nascem de fusões. */
    const base = D.allWeapons().filter(d => !D.isFusion(d.id));
    const bag = base.slice().sort(() => Math.random() - 0.5);
    for (let i = 0; i < 6 && i < bag.length; i++) {
      stock.push({ id: bag[i].id, rar: rollRar(depth(), G().p ? G().p.luck : 0) });
    }
    return true;
  }

  function canShop() {
    const g = G();
    return !!g.p && !g.p.dead && (g.state === 'play' || g.state === 'pause');
  }

  function buy(offerIdx) {
    if (!canShop()) return false;
    const off = stock[offerIdx];
    if (!off) { deny('Oferta vendida ou inexistente'); return false; }
    const def = D.def(off.id);
    if (!def) { deny('Arma indisponível'); return false; }
    const custo = price(off.rar, off.id);
    if (!payUp(custo)) return false;
    stock.splice(offerIdx, 1);
    const t = pushInv(off.id, off.rar, 1);
    let onde = '🎒 no inventário';
    if (equipIdxFree()) { equipInv(t.uid); onde = '⚔️ já equipada!'; }
    SFX().buy();
    toast('🛠 COMPRADO: ' + rarAt(t.rar).name + ' ' + def.icon + ' ' + def.name + ' — ' + onde, 2600);
    persist();
    render();
    return true;
  }

  function reroll() {
    if (!canShop()) return false;
    const c = rerollCost();
    if (!payUp(c)) return false;
    rollStock();
    SFX().coin();
    toast('🎲 Ofertas rerolled por 🪙 ' + c, 1800);
    persist();
    render();
    return true;
  }

  function itemLabel(t) { return rarAt(t.rar).name + ' ' + D.def(t.id).name + ' (Nv ' + t.level + ')'; }

  /* valor de venda do uid (pro botão e pro modal) */
  function saleValue(itemUid) {
    let i = findInv(itemUid);
    if (i >= 0) return sellPrice(inv[i].rar, inv[i].id);
    i = findEquipped(itemUid);
    if (i < 0) return 0;
    const w = G().p.weapons[i];
    return sellPrice(w.rar || 0, w.id);
  }

  function askSell(itemUid) {
    const v = saleValue(itemUid);
    if (v <= 0) { deny('Não dá para vender isso'); return false; }
    pendingSell = { uid: itemUid, val: v };
    renderConfirm();
    SFX().buy();
    return true;
  }

  function cancelSell() {
    pendingSell = null;
    renderConfirm();
    render();
  }

  function confirmSell() {
    const ps = pendingSell;
    pendingSell = null;
    if (!ps) return false;
    const val = ps.val;                       /* trava o valor do modal */
    let desc = '';
    let i = findInv(ps.uid);
    if (i >= 0) {
      desc = itemLabel(inv[i]);
      inv.splice(i, 1);
    } else {
      i = findEquipped(ps.uid);
      if (i < 0) { deny('A arma já não existe'); render(); return false; }
      const w = G().p.weapons.splice(i, 1)[0];
      desc = D.def(w.id).name + ' (equipada)';
    }
    earn(val);
    SFX().coin();
    toast('🪙 + ' + val + ' — VENDIDO: ' + desc, 2400);
    persist();
    renderConfirm();
    render();
    return true;
  }

  /* fusão de IGUAIS: mesmo id + mesma raridade → raridade seguinte.
     O nível da nova é o maior dos dois (nada se perde). A fundida
     entra no slot do parceiro quando ele é equipado e no slot da
     origem quando ela é equipada — nenhum slot ou arma é perdido.
     Os índices são recalculados por UID a cada remoção: nunca
     remove o item errado quando o array muda de comprimento. */
  function removeInvU(u) {
    const i = findInv(u);
    return i >= 0 ? inv.splice(i, 1)[0] : null;
  }
  function removeEqU(u) {
    const i = findEquipped(u);
    return i >= 0 ? G().p.weapons.splice(i, 1)[0] : null;
  }
  function mkFus(id, rar, level) {
    return { id: id, level: level, cd: U.rand(0, 0.3), stats: null, rar: rar, uid: (uid++) };
  }
  function merge(itemUid) {
    if (!canShop()) return false;
    let src = null;
    let srcInvI = findInv(itemUid);
    let srcEqI = -1;
    if (srcInvI >= 0) src = inv[srcInvI];
    else {
      srcEqI = findEquipped(itemUid);
      if (srcEqI >= 0) src = G().p.weapons[srcEqI];
    }
    if (!src) { deny('Arma não encontrada'); return false; }
    ensureFields(src);
    if (src.rar >= 4) { deny('Lendária é o máximo — já não dá pra fundir'); return false; }
    const srcUid = src.uid;

    /* parceiro: prefere INVENTÁRIO; se não tiver, uma equipada */
    let pUid = 0, pInInv = false;
    for (let k = 0; k < inv.length; k++) {
      if (inv[k].uid === srcUid) continue;
      if (inv[k].id === src.id && inv[k].rar === src.rar) { pUid = inv[k].uid; pInInv = true; break; }
    }
    if (pUid === 0) {
      const ws = G().p.weapons;
      for (let k = 0; k < ws.length; k++) {
        ensureFields(ws[k]);
        if (ws[k].uid === srcUid) continue;
        if (ws[k].id === src.id && ws[k].rar === src.rar) { pUid = ws[k].uid; pInInv = false; break; }
      }
    }
    if (pUid === 0) {
      deny('Sem segunda arma IGUAL (id e raridade) pra fundir');
      return false;
    }

    const pId = src.id, srcRar = src.rar;
    const srcLevel = src.level;
    let partner = pInInv ? removeInvU(pUid) : (findEquipped(pUid) >= 0 ? G().p.weapons[findEquipped(pUid)] : null);
    if (!partner) { deny('A arma parceiro sumiu'); return false; }
    const newLevel = Math.max(srcLevel, partner.level);

    /* consome as DUAS pela arma certa (por uid) e decide onde nasce */
    const srcDoInv = !!removeInvU(srcUid);
    const srcSlotI = srcDoInv ? -1 : findEquipped(srcUid);

    if (!pInInv) {
      const ws = G().p.weapons;
      const pi = findEquipped(pUid);
      if (pi >= 0) ws[pi] = mkFus(pId, srcRar + 1, newLevel);   /* no slot do parceiro */
      if (!srcDoInv) removeEqU(srcUid);                        /* consome a origem */
    } else if (srcDoInv) {
      pushInv(pId, srcRar + 1, newLevel);                      /* pro inventário */
    } else if (srcSlotI >= 0) {
      G().p.weapons[srcSlotI] = mkFus(pId, srcRar + 1, newLevel);   /* no slot da origem */
    }

    const nr = rarAt(srcRar + 1);
    SFX().fusion();
    const nome = D.def(pId).name;
    toast('🔮 FUSÃO DE ARMAS: ' + D.def(pId).icon + ' ' + nome + ' agora é ' + nr.name.toUpperCase() + ' (Nv ' + newLevel + ')!', 3200);
    persist();
    render();
    return true;
  }

  /* par igual existe pra este uid? (pro botão FUNDIR ficar ligado) */
  function mergeable(itemUid) {
    let src = null, srcInv = false;
    let i = findInv(itemUid);
    if (i >= 0) { src = inv[i]; srcInv = true; }
    else {
      i = findEquipped(itemUid);
      if (i >= 0) { src = ensureFields(G().p.weapons[i]); }
    }
    if (!src) return false;
    if (src.rar >= 4) return false;
    for (let k = 0; k < inv.length; k++) {
      if (srcInv && k === i) continue;
      if (inv[k].id === src.id && inv[k].rar === src.rar) return true;
    }
    const ws = G().p.weapons;
    for (let k = 0; k < ws.length; k++) {
      if (!srcInv && k === i) continue;
      const w = ws[k];
      if ((w.uid || 0) === src.uid) continue;
      w.rar = w.rar || 0;
      if (w.id === src.id && w.rar === src.rar) return true;
    }
    return false;
  }

  function deny(msg) { toast('🚫 ' + msg, 1800); SFX().deny(); }
  function toast(m, t) { if (VS.UI) VS.UI.toast(m, t || 2000); }
  function SFX() { return VS.Audio.SFX; }
  function persist() { if (G().saveWorld) G().saveWorld(); }
  function fmt(v) {
    return String(Math.max(0, Math.floor(v + 1e-6))).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  /* ============================================================
     ABRIR / FECHAR — respeita o fluxo de pausa: abrir congela o
     jogo (state 'pause'); fechar volta exatamente para onde estava
     (play ou a própria tela de pausa).
     ============================================================ */
  function isOpen() { return isOpenNow; }
  function canOpen() {
    const g = G();
    if (!g || !g.p || g.p.dead) return false;
    return g.state === 'play' || g.state === 'pause';
  }
  function open() {
    if (isOpenNow || !canOpen() || !el.arsenal) return false;
    const g = G();
    wasPause = g.state === 'pause';
    isOpenNow = true;
    g.state = 'pause';                     /* congela ondas, inimigos e tudo */
    g.arsenalOpen = true;
    if (!stock.length) rollStock();
    if (VS.UI) VS.UI.hideAll();
    el.arsenal.classList.remove('hidden');
    setTab('banco');
    render();
    SFX().buy();
    return true;
  }
  function close() {
    if (!isOpenNow) return false;
    isOpenNow = false;
    pendingSell = null;
    el.confirm.classList.add('hidden');
    el.arsenal.classList.add('hidden');
    const g = G();
    g.arsenalOpen = false;
    if (wasPause && VS.UI) { VS.UI.show('pause'); }   /* era pausa: volta pra pausa */
    else { g.state = 'play'; if (VS.UI) VS.UI.hideAll(); }
    return true;
  }

  function setTab(t) {
    tab = t;
    el.tabBank.classList.toggle('on', t === 'banco');
    el.tabShop.classList.toggle('on', t === 'loja');
    el.bankView.classList.toggle('hidden', t !== 'banco');
    el.shopView.classList.toggle('hidden', t !== 'loja');
  }

  /* ============================================================
     TELA (DOM) — construída na seção #arsenal do index.html
     ============================================================ */
  function init() {
    el.arsenal = document.getElementById('arsenal');
    if (!el.arsenal) return;
    el.headMoney = document.getElementById('arsMoney');
    el.headGems = document.getElementById('arsGems');
    el.headSlots = document.getElementById('arsSlots');
    el.close = document.getElementById('arsClose');
    el.tabBank = document.getElementById('arsTabBank');
    el.tabShop = document.getElementById('arsTabShop');
    el.bankView = document.getElementById('arsBankView');
    el.shopView = document.getElementById('arsShopView');
    el.gridEq = document.getElementById('arsEquipped');
    el.gridInv = document.getElementById('arsInv');
    el.shop = document.getElementById('arsShop');
    el.infoEq = document.getElementById('arsSlotInfo');
    el.infoInv = document.getElementById('arsInvInfo');
    el.infoShop = document.getElementById('arsRerollCost');
    el.btnReroll = document.getElementById('arsReroll');
    el.confirm = document.getElementById('arsConfirm');
    el.confTitle = document.getElementById('arsConfTitle');
    el.confDesc = document.getElementById('arsConfDesc');
    el.confOk = document.getElementById('arsConfOk');
    el.confNo = document.getElementById('arsConfNo');

    el.close.onclick = () => close();
    el.tabBank.onclick = () => setTab('banco');
    el.tabShop.onclick = () => setTab('loja');
    el.btnReroll.onclick = () => reroll();
    el.confOk.onclick = () => confirmSell();
    el.confNo.onclick = () => cancelSell();
    el.arsenal.addEventListener('pointerdown', (e) => {
      if (e.target === el.arsenal) close();          /* clique fora fecha */
    });
    onGridActions(el.gridEq);
    onGridActions(el.gridInv);
    onGridActions(el.shop);
  }

  /* delegação de cliques nos grids: data-act + data-uid */
  function onGridActions(grid) {
    if (!grid || !grid.addEventListener) return;
    grid.addEventListener('click', (ev) => {
      const b = ev.target && ev.target.closest ? ev.target.closest('[data-act]') : null;
      if (!b) return;
      const act = b.getAttribute('data-act');
      const uid0 = parseInt(b.getAttribute('data-uid'), 10) || 0;
      if (!uid0) return;
      if (act === 'equip') equipInv(uid0);
      else if (act === 'unequip') unequip(uid0);
      else if (act === 'swap') swap(uid0, parseInt(b.getAttribute('data-slot'), 10) || 0);
      else if (act === 'sell') askSell(uid0);
      else if (act === 'merge') merge(uid0);
      else if (act === 'buy') buy(parseInt(b.getAttribute('data-offer'), 10) || 0);
    });
  }

  function headRow() {
    const g = G();
    if (el.headMoney) el.headMoney.textContent = fmt(g ? g.money : 0);
    if (el.headGems) el.headGems.textContent = fmt(g && g.meta ? g.meta.gems : 0);
    const p = g ? g.p : null;
    if (el.headSlots && p) el.headSlots.textContent = '⚔️ ' + p.weapons.length + '/' + p.slots + ' slots';
    if (el.infoShop) el.infoShop.textContent = String(rerollCost());
  }

  /* linhas de atributos da arma (com raridade aplicada) */
  function statRows(def, s) {
    const out = [];
    out.push(['⚔ Dano', fmt(s.dmg)]);
    if (def.stats.cd) out.push(['⏱ Cadência', s.cd.toFixed(2) + 's']);
    out.push(['✦ Golpes', String(s.count || 1)]);
    const area = s.maxR || s.radius || s.len;
    if (area) out.push(['◎ Área', fmt(area)]);
    else if (s.speed && s.life) out.push(['◎ Alcance', fmt(s.speed * s.life)]);
    if (s.pierce) out.push(['➶ Perfura', String(s.pierce)]);
    if (def.stats.spread !== undefined) out.push(['🎯 Precisão', '±' + Math.round(def.stats.spread * 57.3) + '° leque']);
    const eff = [];
    if (def.stats.burn) eff.push('queima');
    if (def.stats.poison) eff.push('veneno');
    if (def.stats.slow) eff.push('lentidão');
    if (def.stats.freeze) eff.push('congela');
    if (def.stats.heal) eff.push(' '+Math.round(def.stats.heal*100)+'% de vida ao acertar');
    if (def.stats.knock) eff.push('empurra');
    if (def.stats.pull) eff.push('suga');
    if (def.stats.chain) eff.push('raio em cadeia' + ' x' + s.chain);
    if (def.stats.boom) eff.push('explode ao acertar');
    if (def.stats.field) eff.push('chão em chamas');
    if (def.stats.cloud) eff.push('nuvem venenosa');
    if (def.stats.lifesteal) out.push(['🩸 Vampirismo', 'drena vida']);
    if (def.stats.homing) eff.push('persegue alvo');
    if (def.stats.boomerang) eff.push('boomerang');
    if (def.stats.turretDmg) eff.push('torre atira junto');
    if (eff.length) out.push(['✨ Efeitos', eff.join(' · ')]);
    return out;
  }

  function cardHtml(opts) {
    const def = D.def(opts.id);
    if (!def) return '';
    const R = rarAt(opts.rar);
    const sdef = statsFor({ id: opts.id, rar: opts.rar, level: opts.level }, def, opts.level);
    const rows = statRows(def, sdef).map(r =>
      `<i class="astat"><b>${r[0]}</b><span>${r[1]}</span></i>`).join('');
    const buttons = (opts.acts || []).map(a => {
      /* swap aponta para a ARMA DO INVENTÁRIO (tpl.uid) + slot alvo */
      const uid = a.tpl ? a.tpl.uid : opts.uid;
      return `<button class="abtn ${a.cls || ''}" data-act="${a.act}" data-uid="${uid}"` +
        (a.tpl ? ` data-slot="${a.tpl.slot}"` : '') +
        (a.offer !== undefined ? ` data-offer="${a.offer}"` : '') +
        (a.disabled ? ' disabled' : '') + `>${a.label}</button>`;
    }).join('');
    const foot = opts.foot || '';
    const cmp = opts.cmp || '';
    return `<div class="acard ${opts.cls || ''}" style="--rar:${R.color}">` +
      `<div class="a-strip"></div>` +
      `<div class="a-head"><span class="a-ico">${def.icon}</span>` +
      `<div class="a-names"><b class="a-name">${def.name}</b>` +
      `<span class="a-rarity" style="color:${R.color}">${R.name}</span>` +
      `<span class="a-level">Nível ${opts.level}</span></div></div>` +
      `<div class="a-stats">${rows}</div>` +
      (cmp ? `<div class="a-cmp">${cmp}</div>` : '') +
      (foot ? `<div class="a-foot">${foot}</div>` : '') +
      `<div class="abtn-row">${buttons}</div></div>`;
  }

  /* comparação da oferta com a(s) mesma(s) já equipada(s) */
  function compareLine(offer) {
    const p = G().p;
    if (!p) return '';
    for (const w of p.weapons) {
      if (w.id !== offer.id) continue;
      const sEq = statsFor(w, null, w.level);
      const sOf = statsFor({ id: offer.id, rar: offer.rar, level: 1 }, null, 1);
      const pd = Math.round((sOf.dmg / Math.max(1, sEq.dmg) - 1) * 100);
      const cdW = sEq.cd && sOf.cd ? Math.round((sOf.cd / sEq.cd - 1) * 100) : 0;
      return `⚔️ vs equipada Nv${w.level}: dano ${pd >= 0 ? '+' : ''}${pd}%` +
        (cdW ? ` · recarga ${cdW > 0 ? '+' : ''}${cdW}%` : '');
    }
    return '';
  }

  function renderEquipped() {
    const g = G(), p = g ? g.p : null;
    if (!p) return;
    el.gridEq.innerHTML = '';
    const total = Math.max(p.weapons.length, p.slots);
    for (let i = 0; i < total; i++) {
      const w = p.weapons[i];
      const wrap = document.createElement('div');
      if (!w) {
        wrap.className = 'acard empty';
        wrap.style.setProperty('--rar', '#5a4f74');
        wrap.innerHTML = `<div class="a-head"><span class="a-ico">➕</span>` +
          `<div class="a-names"><b class="a-name">Slot livre</b>` +
          `<span class="a-rarity">vazio</span></div></div>` +
          `<div class="a-note">Equipe uma arma do inventário abaixo</div>`;
        el.gridEq.appendChild(wrap);
        continue;
      }
      ensureFields(w);
      const acts = [];
      if (mergeable(w.uid)) acts.push({ act: 'merge', label: '🔮 FUNDIR', cls: 'mag' });
      acts.push({ act: 'unequip', label: '🎒 GUARDAR' });
      acts.push({ act: 'sell', label: 'VENDER', cls: 'warn' });
      /* troca rápida: até 3 opções do inventário para entrar neste slot */
      for (let k = 0; k < Math.min(3, inv.length); k++) {
        const t = inv[k];
        acts.push({
          act: 'swap', cls: 'swap', tpl: { uid: t.uid, slot: i },
          label: '↔ ' + D.def(t.id).icon + ' Nv' + t.level
        });
      }
      wrap.innerHTML = cardHtml({
        id: w.id, rar: w.rar, level: w.level, uid: w.uid, cls: 'equip', acts,
        foot: 'Venda: <b>🪙 ' + sellPrice(w.rar || 0, w.id) + '</b>'
      });
      el.gridEq.appendChild(wrap.children[0] || wrap);
    }
    if (el.infoEq) el.infoEq.textContent = `${p.weapons.length}/${p.slots} · ${inv.length} no inventário`;
  }

  function renderInv() {
    el.gridInv.innerHTML = '';
    if (!inv.length) {
      const d = document.createElement('div');
      d.className = 'acard empty wide';
      d.innerHTML = `<div class="a-head"><span class="a-ico">🧺</span>` +
        `<div class="a-names"><b class="a-name">Inventário vazio</b>` +
        `<span class="a-rarity">compre na LOJA ou funda armas iguais</span></div></div>`;
      el.gridInv.appendChild(d);
      if (el.infoInv) el.infoInv.textContent = '';
      return;
    }
    for (let i = 0; i < inv.length; i++) {
      const t = inv[i];
      const acts = [];
      if (mergeable(t.uid)) acts.push({ act: 'merge', label: '🔮 FUNDIR', cls: 'mag' });
      acts.push({ act: 'equip', label: '⚔️ EQUIPAR' });
      acts.push({ act: 'sell', label: 'VENDER', cls: 'warn' });
      const d = document.createElement('div');
      d.innerHTML = cardHtml({
        id: t.id, rar: t.rar, level: t.level, uid: t.uid, acts,
        foot: 'Venda: <b>🪙 ' + sellPrice(t.rar, t.id) + '</b>'
      });
      el.gridInv.appendChild(d.children[0]);
    }
    if (el.infoInv) el.infoInv.textContent = inv.length + ' arma(s)';
  }

  function renderShop() {
    el.shop.innerHTML = '';
    for (let i = 0; i < stock.length; i++) {
      const offer = stock[i];
      const def = D.def(offer.id);
      if (!def) continue;
      const custo = price(offer.rar, offer.id);
      const off = custo > G().money;
      const acts = [{ act: 'buy', label: '🪙 COMPRAR ' + custo, offer: i, disabled: off, cls: off ? '' : 'gold' }];
      const d = document.createElement('div');
      d.innerHTML = cardHtml({
        id: offer.id, rar: offer.rar, level: 1, uid: (100000 + i), acts, cls: 'shop',
        foot: 'Venda depois por: <b>🪙 ' + sellPrice(offer.rar, offer.id) + '</b>',
        cmp: compareLine(offer)
      });
      el.shop.appendChild(d.children[0] || d);
    }
  }

  function renderConfirm() {
    if (!el.confirm) return;
    if (!pendingSell) { el.confirm.classList.add('hidden'); return; }
    el.confirm.classList.remove('hidden');
    if (el.confDesc) el.confDesc.innerHTML =
      'Vender por <b>🪙 ' + pendingSell.val + '</b>? Esta ação não tem volta nesta partida.';
  }

  function render() {
    if (!el.arsenal || !el.arsenal.classList) return;
    headRow();
    renderEquipped();
    renderInv();
    renderShop();
    renderConfirm();
  }

  return {
    init, open, close, isOpen, canOpen,
    statsFor, price, sellPrice, rerollCost, rollStock,
    buy, reroll, equipInv, unequip, swap, askSell, confirmSell, cancelSell, merge, mergeable,
    invSnapshot, restore, bindRun,
    setTab, render,
    /* hooks dos testes +surto */
    _inv: inv, _stock: stock, _add: pushInv, _rarities: RARITIES, _fmt: fmt
  };
})();
