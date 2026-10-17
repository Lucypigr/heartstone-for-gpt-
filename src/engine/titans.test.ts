import { describe, expect, it } from 'vitest';
import { COLLECTIBLE, getCard, hasCard } from '../cards/registry';
import { IGNIS_BASES, ignisWeaponDef } from '../cards/ignis';
import { Game } from './game';
import { legalActions } from './ai';
import type { Minion, PlayerId } from './state';

const FILLER = 'CS2_182';
function game(ai = true) {
  const g = Game.create({ decks: [Array(30).fill(FILLER), Array(30).fill(FILLER)], classes: ['MAGE', 'PRIEST'], names: ['A', 'B'], ai: [ai, ai], seed: 42, first: 0 });
  g.apply({ type: 'mulligan', player: 0, replace: [] });
  g.apply({ type: 'mulligan', player: 1, replace: [] });
  for (const p of g.s.players) { p.hand = []; p.mana = p.maxMana = 10; }
  return g;
}
function give(g: Game, id: string) {
  const h = g.newHandCard(id);
  g.me.hand.push(h);
  return h;
}
function play(g: Game, id: string, target?: number) {
  g.me.mana = 10;
  const h = give(g, id);
  expect(g.apply({ type: 'play', handUid: h.uid, target }), id).toBe(true);
  return h;
}
function put(g: Game, id: string, owner: PlayerId = 0) {
  const m = g.makeMinion(owner, id);
  g.s.players[owner].board.push(m);
  g.recalcAuras();
  return m;
}
function use(g: Game, m: Minion, ability: string, target?: number) {
  expect(g.apply({ type: 'titan', uid: m.uid, ability, target }), ability).toBe(true);
}
function nextTurn(g: Game) {
  expect(g.apply({ type: 'endTurn' })).toBe(true);
  expect(g.apply({ type: 'endTurn' })).toBe(true);
}
function forge(g: Game, id: string) {
  const h = give(g, id);
  expect(g.apply({ type: 'forge', handUid: h.uid })).toBe(true);
  return h;
}

describe('泰坦共用規則', () => {
  it('包含 11 職業泰坦與尤格薩倫，全部能力有實作與資料', () => {
    const titans = COLLECTIBLE.filter((c) => c.set === 1858 && c.titan);
    expect(titans).toHaveLength(12);
    for (const c of titans) {
      expect(new Set(c.titan).size).toBe(3);
      for (const id of c.titan!) expect(getCard(id).abilities?.length, id).toBeGreaterThan(0);
    }
  });
  it('上場立即用技能、一次後耗盡；用完三招後才可一般攻擊', () => {
    const g = game();
    const m = put(g, 'TTN_075');
    expect(g.canAttack(m.uid)).toBe(false);
    use(g, m, 'TTN_075t2');
    expect(g.canTitan(m.uid, 'TTN_075t')).toBe(false);
    nextTurn(g);
    expect(g.canTitan(m.uid, 'TTN_075t2')).toBe(false);
    use(g, m, 'TTN_075t3');
    nextTurn(g);
    // 第三個能力造成 20 傷害，法術傷害不加成泰坦技能。
    put(g, 'EX1_012');
    use(g, m, 'TTN_075t', g.s.players[1].hero.uid);
    expect(g.s.players[1].hero.hp).toBe(10);
    expect(g.canAttack(m.uid)).toBe(false);
    nextTurn(g);
    expect(g.canAttack(m.uid)).toBe(true);
  });
  it('風怒共用次數，冰凍不能使用；0 攻擊力仍能用技能', () => {
    const g = game();
    const m = put(g, 'TTN_858');
    m.baseAtk = 0;
    m.keywords.push('WINDFURY');
    m.frozen = true;
    expect(g.canTitan(m.uid, 'TTN_858t2')).toBe(false);
    m.frozen = false;
    use(g, m, 'TTN_858t2');
    use(g, m, 'TTN_858t3');
    expect(g.canTitan(m.uid, 'TTN_858t1')).toBe(false);
  });
  it('沉默移除泰坦限制，但不移除本回合召喚疲勞', () => {
    const g = game();
    const m = put(g, 'TTN_075');
    play(g, 'EX1_332', m.uid); // Silence
    expect(m.silenced).toBe(true);
    expect(g.canTitan(m.uid, 'TTN_075t')).toBe(false);
    expect(g.canAttack(m.uid)).toBe(false);
    nextTurn(g);
    expect(g.canAttack(m.uid)).toBe(true);
  });
  it('技能不算出牌／施法／戰吼，不能使用敵方泰坦或任意能力', () => {
    const g = game();
    const m = put(g, 'TTN_903');
    const enemy = put(g, 'TTN_075', 1);
    expect(g.apply({ type: 'titan', uid: enemy.uid, ability: 'TTN_075t2' })).toBe(false);
    expect(g.apply({ type: 'titan', uid: m.uid, ability: 'CS2_029' })).toBe(false);
    const before = [g.me.cardsPlayedThisTurn, g.me.spellsThisTurn];
    use(g, m, 'TTN_903t3');
    expect([g.me.cardsPlayedThisTurn, g.me.spellsThisTurn]).toEqual(before);
    expect(g.me.board.some((x) => x.cardId === 'TTN_903t4')).toBe(true);
  });
  it('複製保留已使用技能，但重生重新獲得三個技能', () => {
    const g = game();
    const m = put(g, 'TTN_075');
    use(g, m, 'TTN_075t2');
    play(g, 'EX1_564', m.uid);
    const copy = g.me.board.find((x) => x !== m && x.cardId === m.cardId)!;
    expect(copy.titanUsed).toEqual(['TTN_075t2']);
    expect(g.canTitan(copy.uid, 'TTN_075t2')).toBe(false);
    expect(g.canTitan(copy.uid, 'TTN_075t')).toBe(true);
    m.keywords.push('REBORN'); m.hp = 1;
    play(g, 'CS2_029', m.uid);
    const reborn = g.me.board.find((x) => x !== copy && x.cardId === m.cardId)!;
    expect(reborn.hp).toBe(1);
    expect(reborn.titanUsed ?? []).toEqual([]);
    expect(g.canTitan(reborn.uid, 'TTN_075t2')).toBe(true);
  });
  it('AI 列出技能和有效目標，阿曼蘇爾不能複製泰坦', () => {
    const g = game();
    const m = put(g, 'TTN_429');
    const other = put(g, FILLER);
    expect(g.titanTargets(m.uid, 'TTN_429t')).toContain(other.uid);
    expect(g.titanTargets(m.uid, 'TTN_429t')).not.toContain(m.uid);
    expect(legalActions(g)).toContainEqual({ type: 'titan', uid: m.uid, ability: 'TTN_429t', target: other.uid });
  });
});

describe('各職業泰坦效果', () => {
  it('阿格拉瑪裝備武器，三種升級保留在武器上', () => {
    const g = game(); play(g, 'TTN_092');
    const m = g.me.board.find((m) => m.cardId === 'TTN_092')!;
    expect(g.me.weapon?.atk).toBe(3);
    use(g, m, 'TTN_092t3');
    expect(g.me.weapon?.atk).toBe(5);
    expect(g.me.weapon?.immuneAttacking).toBe(true);
    nextTurn(g); use(g, m, 'TTN_092t1');
    nextTurn(g); use(g, m, 'TTN_092t2');
    const before = g.me.hand.length;
    expect(g.apply({ type: 'attack', attacker: g.me.hero.uid, target: g.s.players[1].hero.uid })).toBe(true);
    expect(g.me.hand.length).toBe(before + 1);
    expect(g.me.board.some((m) => m.cardId === 'TTN_092e2t')).toBe(true);
  });
  it('卡茲格羅斯技能後免疫強制攻擊，但不多消耗一次技能次數', () => {
    const g = game(); const m = put(g, 'TTN_415'); put(g, FILLER, 1);
    use(g, m, 'TTN_415t2');
    expect(m.hp).toBe(5);
    expect(m.attacks).toBe(1);
    expect(g.me.hero.tempAtk).toBe(5);
    expect(g.s.players[1].board).toHaveLength(0);
  });
  it('阿曼蘇爾移除不觸發亡語，第二個目標由玩家選擇', () => {
    const g = game(false); const m = put(g, 'TTN_429');
    const first = put(g, 'EX1_029', 1); // Leper Gnome
    const second = put(g, FILLER, 1); const third = put(g, 'CS2_189', 1);
    use(g, m, 'TTN_429t2', first.uid);
    expect(g.s.pendingChoice?.options).toEqual([second.cardId, third.cardId]);
    g.apply({ type: 'choose', index: 1 });
    expect(g.s.players[1].board.map((m) => m.uid)).toEqual([second.uid]);
    expect(g.s.players[0].hero.hp).toBe(30);
    expect(g.s.players[1].graveyard).toHaveLength(0);
    expect(g.s.pendingChoice?.title).toContain('發現');
  });
  it('威-07-特-0恩重複作用於另一個友方手下', () => {
    const g = game(); const m = put(g, 'TTN_721'); const buddy = put(g, FILLER);
    use(g, m, 'TTN_721t1');
    expect([g.atkOf(m), m.hp]).toEqual([4, 7]);
    expect([g.atkOf(buddy), buddy.hp]).toEqual([5, 7]);
    expect(g.me.hand).toHaveLength(2);
  });
  it('首領血魄吸取生命；冰霜折扣與法傷跨回合保留且只作用一次', () => {
    const g = game(); const m = put(g, 'TTN_737'); const enemy = put(g, FILLER, 1);
    use(g, m, 'TTN_737t', enemy.uid);
    expect([m.hp, g.me.hero.hp, g.me.hero.maxHp]).toEqual([14, 35, 35]);
    nextTurn(g); use(g, m, 'TTN_737t3'); nextTurn(g);
    const fireball = give(g, 'CS2_029');
    expect(g.costOf(g.me, fireball)).toBe(1);
    expect(g.apply({ type: 'play', handUid: fireball.uid, target: g.s.players[1].hero.uid })).toBe(true);
    expect(g.s.players[1].hero.hp).toBe(21);
    expect(g.spellDamage(0)).toBe(0);
    expect(g.costOf(g.me, give(g, 'CS2_029'))).toBe(4);
  });
  it('高剛納斯每回合第一張法術減費；能力傷害與治療正確', () => {
    const g = game(); const m = put(g, 'TTN_800'); const enemy = put(g, FILLER, 1);
    g.me.hero.hp = 20; m.hp = 2;
    expect(g.costOf(g.me, give(g, 'CS2_029'))).toBe(1);
    use(g, m, 'TTN_800t');
    expect([g.me.hero.hp, m.hp, enemy.hp, g.s.players[1].hero.hp]).toEqual([26, 7, 2, 27]);
  });
  it('阿米特斯將己方手下傷害上限設為 2，沉默後消失', () => {
    const g = game(); const m = put(g, 'TTN_858'); const buddy = put(g, FILLER);
    play(g, 'CS2_029', buddy.uid);
    expect(buddy.hp).toBe(3);
    play(g, 'EX1_332', m.uid);
    play(g, 'CS2_029', buddy.uid);
    expect(g.me.board.includes(buddy)).toBe(false);
  });
  it('阿古斯依位置賦予突襲與吸血，移除後撤回光環', () => {
    const g = game(); const left = put(g, FILLER); const m = put(g, 'TTN_862'); const right = put(g, FILLER);
    expect(g.hasKw(left, 'RUSH')).toBe(true);
    expect(g.hasKw(right, 'LIFESTEAL')).toBe(true);
    expect(g.hasKw(m, 'RUSH')).toBe(false);
    play(g, 'EX1_332', m.uid);
    expect(g.hasKw(left, 'RUSH')).toBe(false);
  });
  it('伊歐娜補滿手牌／生命／法力，每次召喚嘲諷古樹', () => {
    const g = game(); const m = put(g, 'TTN_903');
    use(g, m, 'TTN_903t'); expect(g.me.hand).toHaveLength(10);
    nextTurn(g); g.me.hero.hp = 3; use(g, m, 'TTN_903t2'); expect(g.me.hero.hp).toBe(30);
    nextTurn(g); g.me.mana = 0; use(g, m, 'TTN_903t3'); expect(g.me.mana).toBe(10);
    expect(g.me.board.filter((x) => x.cardId === 'TTN_903t4')).toHaveLength(3);
  });
  it('薩格拉斯永久門占位置，吞噬不觸發亡語，門持續生出強化惡魔', () => {
    const g = game(); play(g, 'TTN_960');
    const m = g.me.board.find((x) => x.cardId === 'TTN_960')!;
    const portal = g.minion(m.titanPortal!)!;
    expect(g.hasKw(portal, 'DORMANT')).toBe(true);
    put(g, 'EX1_029', 1);
    use(g, m, 'TTN_960t2');
    expect(g.me.board).toHaveLength(2);
    expect(g.s.players[1].graveyard).toHaveLength(0);
    nextTurn(g);
    expect(g.me.board.filter((x) => x.cardId === 'TTN_960t6')).toHaveLength(2);
    use(g, m, 'TTN_960t4'); nextTurn(g);
    const upgraded = g.me.board.filter((x) => x.cardId === 'TTN_960t6' && x.maxHp === 4);
    expect(upgraded).toHaveLength(2);
    expect(upgraded.every((x) => g.hasKw(x, 'TAUNT'))).toBe(true);
  });
  it('沒有戰吼召喚的薩格拉斯不能使用別人的傳送門', () => {
    const g = game(); play(g, 'TTN_960'); const m = put(g, 'TTN_960'); const other = put(g, FILLER, 1);
    use(g, m, 'TTN_960t2'); expect(g.s.players[1].board).toContain(other);
  });
});

describe('鍛造', () => {
  it('18 張鍛造卡皆連到不可收藏的升級版', () => {
    const cards = COLLECTIBLE.filter((c) => c.set === 1858 && c.forge);
    expect(cards).toHaveLength(18);
    for (const c of cards) { expect(hasCard(c.forge!.into)).toBe(true); expect(getCard(c.forge!.into).collectible).toBe(false); }
  });
  it('花 2 法力，保留費用／體質加成；不是出牌，也不受滿場影響', () => {
    const g = game(); for (let i = 0; i < 7; i++) put(g, FILLER);
    const h = give(g, 'TTN_042'); h.atkBuff = 2; h.hpBuff = 1; h.costMod = -1;
    g.me.mana = 2;
    const before = g.me.cardsPlayedThisTurn;
    expect(g.apply({ type: 'forge', handUid: h.uid })).toBe(true);
    expect([h.cardId, h.atkBuff, h.hpBuff, h.costMod, g.me.mana]).toEqual(['TTN_042t', 2, 1, -1, 0]);
    expect(g.me.cardsPlayedThisTurn).toBe(before);
    expect(g.me.forgedCards).toBe(1);
    expect(g.apply({ type: 'forge', handUid: h.uid })).toBe(false);
  });
  it('法力不足或對手手牌不能鍛造；AI 能鍛造尚無法打出的高費卡', () => {
    const g = game(); const h = give(g, 'TTN_724'); g.me.mana = 1;
    expect(g.apply({ type: 'forge', handUid: h.uid })).toBe(false);
    g.me.mana = 2;
    expect(legalActions(g)).toContainEqual({ type: 'forge', handUid: h.uid });
    g.me.hand = []; g.s.players[1].hand.push(h);
    expect(g.apply({ type: 'forge', handUid: h.uid })).toBe(false);
  });
  it('風暴巨人可以反覆鍛造減費；熔化塑造者複製升級後加成', () => {
    const g = game(); put(g, 'TTN_729');
    const h = give(g, 'TTN_724'); h.atkBuff = 2;
    for (let i = 0; i < 3; i++) expect(g.apply({ type: 'forge', handUid: h.uid })).toBe(true);
    expect(g.costOf(g.me, h)).toBe(2);
    expect(g.me.mana).toBe(4);
    expect(g.me.hand.map((c) => c.atkBuff)).toEqual([2, 2, 2, 2]);
    expect(new Set(g.me.hand.map((c) => c.uid)).size).toBe(4);
  });
  it('鍛造看守者補血、粉碎者獲得體質', () => {
    const g = game(); g.me.hero.hp = 20;
    const h = forge(g, 'TTN_039'); expect(g.apply({ type: 'play', handUid: h.uid })).toBe(true);
    expect(g.me.hero.hp).toBe(26);
    const giant = forge(g, 'TTN_042'); g.me.mana = 10;
    expect(g.apply({ type: 'play', handUid: giant.uid })).toBe(true);
    const m = g.me.board.find((m) => m.cardId === 'TTN_042t')!;
    expect([g.atkOf(m), m.hp]).toEqual([6, 5]);
  });
  it('造物協定獲得同一張牌兩份複製，不抽走牌堆', () => {
    const g = game(); const deck = g.me.deck.length;
    const h = forge(g, 'TTN_430'); expect(g.apply({ type: 'play', handUid: h.uid })).toBe(true);
    expect(g.me.hand.map((h) => h.cardId)).toEqual([FILLER, FILLER]);
    expect(g.me.deck).toHaveLength(deck);
  });
  it('禮頌者基本版花屍體，鍛造版先獲得屍體再傷害', () => {
    const g = game(); g.me.corpses = 3;
    play(g, 'TTN_457', g.s.players[1].hero.uid); expect(g.me.corpses).toBe(0);
    g.me.mana = 10; const h = forge(g, 'TTN_457');
    expect(g.apply({ type: 'play', handUid: h.uid, target: g.s.players[1].hero.uid })).toBe(true);
    expect(g.me.corpses).toBe(3); expect(g.s.players[1].hero.hp).toBe(24);
  });
  it('處理機器人鍛造後的戰吼有生命竊取', () => {
    const g = game(); g.me.hero.hp = 20; put(g, FILLER, 1);
    const h = forge(g, 'TTN_458'); expect(g.apply({ type: 'play', handUid: h.uid })).toBe(true);
    expect(g.me.hero.hp).toBe(25); expect(g.s.players[1].board).toHaveLength(0);
  });
  it('鍛造熔岩符文傷害與隨機牌各兩次，但只算一張施法', () => {
    const g = game(); const h = forge(g, 'TTN_477');
    expect(g.apply({ type: 'play', handUid: h.uid, target: g.s.players[1].hero.uid })).toBe(true);
    expect(g.s.players[1].hero.hp).toBe(24); expect(g.me.hand).toHaveLength(2); expect(g.me.spellsThisTurn).toBe(1);
  });
  it('風暴勇士基本與鍛造版的衍生物只在鍛造後有突襲', () => {
    const g = game(); put(g, 'TTN_801'); put(g, 'TTN_801t');
    play(g, 'CS2_013'); // Wild Growth, Nature
    const tokens = g.me.board.filter((m) => m.cardId.startsWith('TTN_801t') && m.cardId !== 'TTN_801t');
    expect(tokens).toHaveLength(2);
    expect(tokens.map((m) => g.hasKw(m, 'RUSH')).sort()).toEqual([false, true]);
  });
  it('伊格尼斯未鍛造不製作武器，鍛造後依序選擇三項', () => {
    const g = game(false); play(g, 'TTN_751'); expect(g.s.pendingChoice).toBeNull();
    forge(g, 'TTN_042'); play(g, 'TTN_751');
    expect(g.s.pendingChoice?.options).toEqual(IGNIS_BASES);
    g.apply({ type: 'choose', index: 1 });
    const first = g.s.pendingChoice!.options[0]; g.apply({ type: 'choose', index: 0 });
    const second = g.s.pendingChoice!.options[0]; g.apply({ type: 'choose', index: 0 });
    const weapon = g.me.hand.find((h) => h.ignis)!;
    expect(weapon.ignis).toEqual([first, second]);
    expect(g.handDef(weapon).cost).toBe(5);
    expect(g.handDef(weapon).text).toContain(getCard(first).text);
  });
  it('伊格尼斯武器將關鍵字、戰吼目標及攻擊後效果帶進引擎', () => {
    const g = game(); const w = give(g, 'TTN_060t1'); w.ignis = ['TTN_060t5', 'TTN_060t13t'];
    expect(g.apply({ type: 'play', handUid: w.uid })).toBe(true);
    expect(g.maxAttacks(g.me.hero)).toBe(2);
    for (let i = 0; i < 2; i++) expect(g.apply({ type: 'attack', attacker: g.me.hero.uid, target: g.s.players[1].hero.uid })).toBe(true);
    expect(g.me.hand).toHaveLength(4);
    const def = ignisWeaponDef('TTN_060t', ['TTN_060t3', 'TTN_060t12'], getCard);
    expect(def.target).toBeTruthy();
  });
});

describe('泰坦磁力卡', () => {
  it('吸附野獸的寄生體保留突襲，但一般磁力不能吸附野獸', () => {
    const g = game(); const beast = put(g, 'CS2_172'); // Bloodfen Raptor 3/2
    const h = give(g, 'TTN_087');
    expect(g.apply({ type: 'play', handUid: h.uid, position: 0 })).toBe(true);
    expect(g.me.board).toHaveLength(1);
    expect([g.atkOf(beast), beast.hp]).toEqual([6, 3]);
    expect(g.hasKw(beast, 'RUSH')).toBe(true);
    play(g, 'TTN_077');
    expect(g.me.board).toHaveLength(2);
  });
  it('磁力可以在滿場吸附；不合法的位置不能額外放第八隻', () => {
    const g = game(); const mech = put(g, 'TTN_906'); for (let i = 0; i < 6; i++) put(g, FILLER);
    const h = give(g, 'TTN_077');
    expect(g.canPlay(h.uid).ok).toBe(true);
    expect(g.apply({ type: 'play', handUid: h.uid, position: 7 })).toBe(false);
    expect(g.apply({ type: 'play', handUid: h.uid, position: 0 })).toBe(true);
    expect(g.me.board).toHaveLength(7);
    expect([g.atkOf(mech), mech.hp]).toEqual([3, 6]);
  });
  it('發明機器人只在磁化時強化目標，不在單獨上場時觸發', () => {
    const g = game(); const inventor = put(g, 'TTN_732');
    const h = give(g, 'TTN_087');
    expect(g.apply({ type: 'play', handUid: h.uid, position: 0 })).toBe(true);
    expect([g.atkOf(inventor), inventor.hp]).toEqual([6, 5]);
    const solo = give(g, 'TTN_087');
    expect(g.apply({ type: 'play', handUid: solo.uid, position: 1 })).toBe(true);
    const m = g.me.board.find((m) => m.cardId === 'TTN_087')!;
    expect([g.atkOf(m), m.hp]).toEqual([3, 1]);
  });
  it('X-21 亡語回收吸附的機械，保留自己的原本身分', () => {
    const g = game(); const repair = put(g, 'TTN_906');
    for (const id of ['TTN_077', 'TTN_087']) {
      const h = give(g, id); expect(g.apply({ type: 'play', handUid: h.uid, position: 0 })).toBe(true);
    }
    repair.hp = 1;
    play(g, 'CS2_029', repair.uid);
    expect(g.me.hand.map((h) => h.cardId).sort()).toEqual(['TTN_077', 'TTN_087']);
  });
  it('機械跳蚤把 +2/+2 與同一個亡語傳給另一個機械', () => {
    const g = game(); const leaper = put(g, 'TTN_734'); const mech = put(g, 'TTN_906');
    play(g, 'CS2_029', leaper.uid);
    expect([g.atkOf(mech), mech.hp]).toEqual([3, 5]);
    const next = put(g, 'TTN_732'); mech.hp = 1;
    play(g, 'CS2_029', mech.uid);
    expect([g.atkOf(next), next.hp]).toEqual([4, 5]);
    expect(next.abilities.some((a) => a.on.k === 'deathrattle')).toBe(true);
  });
  it('蜘蛛的一回合潛行吸附後在下個己方回合消失', () => {
    const g = game(); const mech = put(g, 'TTN_906');
    const h = give(g, 'TTN_923'); expect(g.apply({ type: 'play', handUid: h.uid, position: 0 })).toBe(true);
    expect(g.hasKw(mech, 'STEALTH')).toBe(true);
    nextTurn(g);
    expect(g.hasKw(mech, 'STEALTH')).toBe(false);
  });
  it('火花機器人有正確的隨機加成，每張保有磁力', () => {
    const g = game(); play(g, 'TTN_719');
    expect(g.me.hand).toHaveLength(3);
    for (const h of g.me.hand) {
      const d = getCard(h.cardId);
      expect(d.magnetic).toBe(true); expect(d.keywords).toHaveLength(1);
      expect([d.attack, d.health]).toEqual([1, 1]);
    }
    play(g, 'TTN_860'); expect(g.me.hand).toHaveLength(4);
  });
  it('烈焰巨獸產生的兩個磁力機械都獲得減費', () => {
    const g = game(); play(g, 'TTN_716');
    expect(g.me.hand).toHaveLength(2);
    for (const h of g.me.hand) { expect(getCard(h.cardId).magnetic).toBe(true); expect(h.costMod).toBe(-2); }
  });
  it('冰凍與順劈關鍵字在吸附後仍能作用', () => {
    const g = game(); const mech = put(g, 'TTN_906'); mech.sleeping = false;
    const h = give(g, 'TTN_077'); expect(g.apply({ type: 'play', handUid: h.uid, position: 0 })).toBe(true);
    const left = put(g, FILLER, 1); const center = put(g, FILLER, 1); const right = put(g, FILLER, 1);
    const cleave = give(g, 'TTN_471'); expect(g.apply({ type: 'play', handUid: cleave.uid, position: 0 })).toBe(true);
    expect(g.apply({ type: 'attack', attacker: mech.uid, target: center.uid })).toBe(true);
    expect([left.hp, center.hp, right.hp]).toEqual([1, 1, 1]);
    expect([left.frozen, center.frozen, right.frozen]).toEqual([true, true, true]);
  });
});

describe('鍛造卡補充效果', () => {
  it('機械地精導師只讓發現的牌減少 3 費', () => {
    const g = game(); const h = forge(g, 'TTN_076');
    expect(g.apply({ type: 'play', handUid: h.uid })).toBe(true);
    expect(g.me.hand).toHaveLength(1); expect(g.me.hand[0].costMod).toBe(-3);
  });
  it('泰坦鑄造陷阱鍛造後施放兩個不同的獵人秘密', () => {
    const g = game(); g.me.heroClass = 'HUNTER';
    const h = forge(g, 'TTN_302'); expect(g.apply({ type: 'play', handUid: h.uid })).toBe(true);
    expect(g.me.secrets).toHaveLength(2);
    expect(new Set(g.me.secrets.map((s) => s.cardId)).size).toBe(2);
    expect(g.me.secrets.every((s) => getCard(s.cardId).cardClass === 'HUNTER')).toBe(true);
  });
  it('薩格拉斯信徒必須棄掉法術，鍛造後的小鬼為 3/4 嘲諷', () => {
    const g = game(); const h = forge(g, 'TTN_490'); give(g, 'CS2_029');
    expect(g.apply({ type: 'play', handUid: h.uid })).toBe(true);
    expect(g.me.hand).toHaveLength(0);
    const imps = g.me.board.filter((m) => m.cardId === 'TTN_960t6');
    expect(imps).toHaveLength(2);
    for (const m of imps) { expect([g.atkOf(m), m.hp]).toEqual([3, 4]); expect(g.hasKw(m, 'TAUNT')).toBe(true); }
    const empty = game(); play(empty, 'TTN_490'); expect(empty.me.board).toHaveLength(1);
  });
  it('鍛造實驗室建造者吸附後的回合結束會複製整個機械', () => {
    const g = game(); const mech = put(g, 'TTN_906');
    const h = forge(g, 'TTN_730'); expect(g.apply({ type: 'play', handUid: h.uid, position: 0 })).toBe(true);
    expect(g.me.board).toHaveLength(1);
    expect(g.me.board[0]).toBe(mech);
    expect(g.apply({ type: 'endTurn' })).toBe(true);
    expect(g.s.players[0].board).toHaveLength(2);
    for (const m of g.s.players[0].board) expect([g.atkOf(m), m.maxHp]).toEqual([4, 5]);
  });
  it('咆哮烈焰先造成 5 點傷害，擊殺後仍分散額外 5 點傷害', () => {
    const g = game(); const first = put(g, FILLER, 1); const second = put(g, FILLER, 1);
    const h = forge(g, 'TTN_753'); expect(g.apply({ type: 'play', handUid: h.uid, target: first.uid })).toBe(true);
    expect(g.s.players[1].board).toHaveLength(0);
    expect(second.hp).toBe(0);
  });
  it('提爾之淚只復活不同的本職業手下並設為 2/2', () => {
    const g = game(); g.me.heroClass = 'PALADIN';
    g.me.graveyard = ['EX1_362', 'EX1_362', 'EX1_382', FILLER, 'TTN_075'];
    const h = forge(g, 'TTN_855t'); expect(g.apply({ type: 'play', handUid: h.uid })).toBe(true);
    expect(g.me.board.map((m) => m.cardId).sort()).toEqual(['EX1_362', 'EX1_382']);
    for (const m of g.me.board) expect([g.atkOf(m), m.maxHp]).toEqual([2, 2]);
  });
  it('世界的重量鍛造後先補到對手手牌數再抽兩張', () => {
    const g = game(); give(g, FILLER);
    for (let i = 0; i < 5; i++) g.s.players[1].hand.push(g.newHandCard(FILLER));
    const h = forge(g, 'TTN_865'); expect(g.apply({ type: 'play', handUid: h.uid })).toBe(true);
    expect(g.me.hand).toHaveLength(7);
  });
  it('自然之擁鍛造後讓抽到的二選一卡同時具有兩種效果', () => {
    const g = game(); g.me.deck = [g.newHandCard('EX1_160')]; // Power of the Wild
    const h = forge(g, 'TTN_951'); expect(g.apply({ type: 'play', handUid: h.uid })).toBe(true);
    expect(g.me.hand[0].both).toBe(true);
    const buddy = put(g, FILLER); const card = g.me.hand[0];
    expect(g.apply({ type: 'play', handUid: card.uid, option: 0 })).toBe(true);
    expect([g.atkOf(buddy), buddy.maxHp]).toEqual([5, 6]);
    expect(g.me.board).toHaveLength(2);
  });
  it('消毒鍛造後先加 3 護甲再計算全場傷害', () => {
    const g = game(); g.me.hero.armor = 3; put(g, FILLER); put(g, FILLER, 1);
    const h = forge(g, 'YOG_502'); expect(g.apply({ type: 'play', handUid: h.uid })).toBe(true);
    expect(g.me.hero.armor).toBe(6);
    expect(g.me.board).toHaveLength(0); expect(g.s.players[1].board).toHaveLength(0);
  });
  it('肌肉機器人鍛造後只讓手中的手下 +2/+2', () => {
    const g = game(); const minion = give(g, FILLER); const spell = give(g, 'CS2_029');
    const h = forge(g, 'YOG_525'); expect(g.apply({ type: 'play', handUid: h.uid })).toBe(true);
    expect([minion.atkBuff, minion.hpBuff]).toEqual([2, 2]);
    expect([spell.atkBuff, spell.hpBuff]).toEqual([0, 0]);
  });
  it('尤格薩倫使用技能後施放兩個隨機法術', () => {
    const g = game(); const yogg = put(g, 'YOG_516'); const enemy = put(g, FILLER, 1);
    use(g, yogg, 'YOG_516t', enemy.uid);
    expect(yogg.titanUsed).toEqual(['YOG_516t']);
    expect(g.s.log.filter((l) => l.text.includes('再次施放了')).length).toBeGreaterThanOrEqual(2);
  });
  it('混沌觸鬚從 1 費法術開始，下一張顯示升級後的費用', () => {
    const g = game(); const h = give(g, 'YOG_514');
    expect(g.liveDef(0, h)?.text).toContain('1');
    expect(g.apply({ type: 'play', handUid: h.uid })).toBe(true);
    expect(g.me.tendrilSpells).toBe(1);
    expect(g.liveDef(0, give(g, 'YOG_514'))?.text).toContain('2');
  });
});

describe('泰坦機制交互作用', () => {
  it('首領冰霜加成也會被自動施放的秘密消耗', () => {
    const g = game(); const primus = put(g, 'TTN_737');
    use(g, primus, 'TTN_737t3');
    const norgannon = put(g, 'TTN_075');
    use(g, norgannon, 'TTN_075t3');
    expect(g.me.secrets).toHaveLength(1);
    expect(g.me.primusSpellPower).toBeUndefined();
    expect(g.costOf(g.me, give(g, 'CS2_029'))).toBe(4);
  });
  it('攻擊時免疫包含攻擊觸發的陷阱傷害，攻擊完會解除', () => {
    const g = game(); const h = give(g, 'TTN_060t'); h.ignis = ['TTN_060t9', 'TTN_060t8'];
    expect(g.apply({ type: 'play', handUid: h.uid })).toBe(true);
    g.s.players[1].secrets.push({ uid: 99999, cardId: 'EX1_610' });
    expect(g.apply({ type: 'attack', attacker: g.me.hero.uid, target: g.s.players[1].hero.uid })).toBe(true);
    expect(g.me.hero.hp).toBe(30);
    expect(g.me.hero.immune).toBe(false);
    expect(g.s.players[1].secrets).toHaveLength(0);
  });
  it('泰坦技能能指定飄渺手下，卻不能指定敵方潛行或休眠手下', () => {
    const g = game(); const norgannon = put(g, 'TTN_075');
    const target = put(g, FILLER, 1); target.keywords.push('ELUSIVE');
    expect(g.titanTargets(norgannon.uid, 'TTN_075t')).toContain(target.uid);
    target.keywords.push('STEALTH'); expect(g.titanTargets(norgannon.uid, 'TTN_075t')).not.toContain(target.uid);
    target.keywords = ['DORMANT']; expect(g.titanTargets(norgannon.uid, 'TTN_075t')).not.toContain(target.uid);
  });
});

describe('觸鬚之握', () => {
  it('連擊才產生觸鬚，兩次施法各造成 3 點傷害', () => {
    const g = game();
    play(g, 'YOG_526', g.s.players[1].hero.uid);
    expect(g.me.hand).toHaveLength(0);
    play(g, 'YOG_526', g.s.players[1].hero.uid);
    expect(g.me.hand.map((h) => h.cardId)).toEqual(['YOG_514']);
    expect(g.s.players[1].hero.hp).toBe(24);
  });
});

describe('鑄造的法力支出', () => {
  it('會計入手牌持有期間的支出，花光法力也觸發晶脊幼獸', () => {
    const g = game(); const whelp = put(g, 'CATA_130');
    const before = [g.atkOf(whelp), whelp.maxHp];
    const other = give(g, FILLER); const h = give(g, 'TTN_042'); g.me.mana = 2;
    expect(g.apply({ type: 'forge', handUid: h.uid })).toBe(true);
    expect([other.spent, h.spent]).toEqual([2, 2]);
    expect([g.atkOf(whelp), whelp.maxHp]).toEqual(before.map((n) => n + 1));
    expect(g.me.cardsPlayedThisTurn).toBe(0);
  });
});

describe('永久傳送門', () => {
  it('占戰場位置，但不觸發飛刀手或降低海巨人消耗', () => {
    const g = game(); put(g, 'NEW1_019');
    play(g, 'TTN_960');
    expect(g.me.board).toHaveLength(3);
    expect(g.s.players[1].hero.hp).toBe(29);
    expect(g.costOf(g.me, give(g, 'EX1_586'))).toBe(8);
  });
  it('不接受手下光環，也不會被一般毀滅效果移除', () => {
    const g = game(); play(g, 'TTN_960');
    const sargeras = g.me.board.find((m) => m.cardId === 'TTN_960')!;
    const portal = g.minion(sargeras.titanPortal!)!;
    put(g, 'CS2_222'); // Stormwind Champion
    expect([g.atkOf(portal), portal.hp]).toEqual([0, 1]);
    play(g, 'EX1_312'); // Twisting Nether
    expect(g.me.board.map((m) => m.cardId)).toEqual(['TTN_960t']);
    nextTurn(g);
    expect(g.me.board.filter((m) => m.cardId === 'TTN_960t6')).toHaveLength(2);
  });
});
