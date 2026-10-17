import { describe, expect, it } from 'vitest';
import { COLLECTIBLE, getCard } from '../cards/registry';
import { PARADISE_DRINKS } from '../cards/paradise';
import { PARADISE_TOURS } from '../cards/paradise-pools';
import { cardAllowed, touristClasses, validateDeck } from '../game/decks';
import { Game } from './game';
import type { PlayerId } from './state';
const FILLER = 'CS2_182';
function game(ai = true) {
  const g = Game.create({
    decks: [Array(30).fill(FILLER), Array(30).fill(FILLER)],
    classes: ['MAGE', 'PRIEST'],
    names: ['A', 'B'],
    ai: [ai, ai],
    seed: 42,
    first: 0,
  });
  g.apply({ type: 'mulligan', player: 0, replace: [] });
  g.apply({ type: 'mulligan', player: 1, replace: [] });
  for (const p of g.s.players) {
    p.hand = [];
    p.mana = p.maxMana = 10;
    p.hero.hp = p.hero.maxHp = 1000;
  }
  return g;
}
function give(g: Game, id: string) {
  const h = g.newHandCard(id);
  g.me.hand.push(h);
  return h;
}
function play(g: Game, id: string, target?: number) {
  g.me.mana = 100;
  const h = give(g, id);
  expect(g.apply({ type: 'play', handUid: h.uid, target }), id).toBe(true);
  return h;
}
function put(g: Game, id = FILLER, owner: PlayerId = 0) {
  const m = g.makeMinion(owner, id);
  g.s.players[owner].board.push(m);
  g.recalcAuras();
  return m;
}
function turn(g: Game) {
  expect(g.apply({ type: 'endTurn' })).toBe(true);
  expect(g.apply({ type: 'endTurn' })).toBe(true);
}

describe('天堂島卡庫與遊客組牌', () => {
  it('完整收錄 183 張、13 位遊客與 6 種三杯飲料', () => {
    expect(COLLECTIBLE.filter((c) => c.set === 1905)).toHaveLength(183);
    expect(COLLECTIBLE.filter((c) => c.set === 1905 && c.tourist)).toHaveLength(13);
    for (const id of PARADISE_DRINKS) expect(getCard(id).abilities?.length).toBeGreaterThan(0);
  });
  it('遊客只開放目的職業的天堂島非遊客卡，不開放舊卡或第三職業', () => {
    expect(cardAllowed(getCard('VAC_916'), 'MAGE', false)).toBe(false);
    expect(cardAllowed(getCard('VAC_916'), 'MAGE', false, ['VAC_424'])).toBe(true);
    expect(cardAllowed(getCard('VAC_507'), 'MAGE', false, ['VAC_424'])).toBe(false);
    expect(cardAllowed(getCard('CS2_093'), 'MAGE', false, ['VAC_424'])).toBe(false);
    expect(cardAllowed(getCard('VAC_335'), 'MAGE', false, ['VAC_424', 'VAC_507'])).toBe(false);
    expect(touristClasses(['VAC_424', 'WORK_063'], 'MAGE').sort()).toEqual(['PALADIN', 'ROGUE']);
  });
  it('合法遊客牌組可通過驗證，移除遊客後外職卡變為不合法', () => {
    const neutral = COLLECTIBLE.filter((c) => c.cardClass === 'NEUTRAL' && !c.runes)
      .slice(0, 28)
      .map((c) => c.id);
    const deck = { id: 'test', name: '遊客', heroClass: 'MAGE' as const, freeform: false, cards: ['VAC_424', 'VAC_916', ...neutral] };
    expect(validateDeck(deck).ok).toBe(true);
    deck.cards[0] = COLLECTIBLE.find((c) => c.cardClass === 'MAGE' && !deck.cards.includes(c.id))!.id;
    expect(validateDeck(deck).errors.some((s) => s.includes('不屬於'))).toBe(true);
  });
  for (const c of COLLECTIBLE.filter((c) => c.set === 1905))
    it(`${c.id} ${c.nameEn} 可打出並結算回合`, () => {
      const g = game(),
        ally = put(g);
      ally.hp--;
      put(g, FILLER, 1);
      give(g, FILLER);
      give(g, 'CS2_029');
      const h = give(g, c.id);
      g.me.mana = 100;
      const req = c.target,
        target = req ? g.validTargets(req, 0, c.type === 'SPELL').find((uid) => uid !== h.uid) : undefined;
      expect(g.apply({ type: 'play', handUid: h.uid, target }), c.id).toBe(true);
      if (g.s.phase === 'play') {
        g.apply({ type: 'endTurn' });
        g.apply({ type: 'endTurn' });
      }
    });
});

describe('天堂島共用機制', () => {
  it('飲料每杯付費，喝完三杯不再補牌，新杯不繼承單卡降費', () => {
    const g = game(),
      h = give(g, 'VAC_323');
    h.costMod = -1;
    g.me.mana = 10;
    g.apply({ type: 'play', handUid: h.uid });
    expect(g.me.mana).toBe(9);
    expect(g.me.hand[0].cardId).toBe('VAC_323t');
    expect(g.me.hand[0].costMod).toBe(0);
    g.apply({ type: 'play', handUid: g.me.hand[0].uid });
    expect(g.me.hand[0].cardId).toBe('VAC_323t2');
    g.apply({ type: 'play', handUid: g.me.hand[0].uid });
    expect(g.me.hand).toHaveLength(0);
    expect(g.s.players[1].hero.hp).toBe(997);
  });
  it('被反制的飲料不產生下一杯', () => {
    const g = game();
    g.s.players[1].secrets = [{ uid: 9999, cardId: 'EX1_287' }];
    play(g, 'VAC_323');
    expect(g.me.hand).toHaveLength(0);
    expect(g.s.players[1].hero.hp).toBe(1000);
  });
  it('神聖啤酒可賦予英雄聖盾，免疫期間不消耗聖盾', () => {
    const g = game();
    play(g, 'VAC_916', g.me.hero.uid);
    expect(g.me.hero.divineShield).toBe(true);
    g.me.hero.immune = true;
    play(g, 'CS2_008', g.me.hero.uid);
    expect(g.me.hero.divineShield).toBe(true);
    g.me.hero.immune = false;
    play(g, 'CS2_008', g.me.hero.uid);
    expect(g.me.hero.hp).toBe(1000);
    expect(g.me.hero.divineShield).toBe(false);
  });
  it('海息酒杯依官方標籤不接受法術傷害加成', () => {
    const g = game();
    put(g, 'CS2_052');
    const m = put(g, FILLER, 1);
    play(g, 'VAC_520');
    expect(m.hp).toBe(3);
  });
  it('飲料讓玩家選擇手牌中的手下，保留其他手牌', () => {
    const g = game(false);
    const a = give(g, FILLER),
      b = give(g, 'CS2_200');
    const drink = give(g, 'VAC_338');
    g.apply({ type: 'play', handUid: drink.uid });
    expect(g.s.pendingChoice?.options).toEqual([FILLER, 'CS2_200']);
    g.apply({ type: 'choose', index: 1 });
    expect([a.atkBuff, a.hpBuff]).toEqual([0, 0]);
    expect([b.atkBuff, b.hpBuff]).toEqual([2, 1]);
  });
  it('選三次可重複選，並在選完後結算', () => {
    const g = game(false),
      h = give(g, 'WORK_025');
    g.apply({ type: 'play', handUid: h.uid });
    for (let i = 0; i < 3; i++) {
      expect(g.s.pendingChoice?.options).toHaveLength(2);
      g.apply({ type: 'choose', index: 0 });
    }
    expect(g.atkOf(g.me.board[0])).toBe(8);
    expect(g.me.board[0].hp).toBe(1);
  });
  it('星夜沉眠的三次回復法力不超過法力上限', () => {
    const g = game(false),
      h = give(g, 'VAC_907');
    g.me.mana = 10;
    g.apply({ type: 'play', handUid: h.uid });
    for (let i = 0; i < 3; i++) g.apply({ type: 'choose', index: 2 });
    expect(g.me.mana).toBe(10);
  });
  it('傳單在自己的回合翻面，兩面交替並保留費用加成', () => {
    const g = game(),
      h = give(g, 'WORK_017');
    h.costMod = -1;
    g.apply({ type: 'endTurn' });
    expect(h.cardId).toBe('WORK_017');
    g.apply({ type: 'endTurn' });
    expect(h.cardId).toBe('WORK_017t');
    expect(h.costMod).toBe(-1);
    turn(g);
    expect(h.cardId).toBe('WORK_017');
  });
  it('永久冰凍不自然解除，沉默可移除永久規則', () => {
    const g = game();
    play(g, 'VAC_328');
    const m = g.me.board[0];
    expect(m.frozen).toBe(true);
    turn(g);
    turn(g);
    expect(m.frozen).toBe(true);
    play(g, 'CS2_203', m.uid);
    turn(g);
    expect(m.frozen).toBe(false);
  });
  it('新高度提高法力上限並增加空水晶', () => {
    const g = game();
    g.me.maxMana = 10;
    play(g, 'VAC_949');
    expect(g.manaCap(g.me)).toBe(13);
    expect(g.me.maxMana).toBe(11);
    turn(g);
    expect(g.me.maxMana).toBe(12);
  });
  it('什錦果仁只在下一個自己的回合暫時增加水晶，並遵守上限', () => {
    const g = game();
    g.me.maxMana = 4;
    play(g, 'VAC_508');
    turn(g);
    expect(g.me.maxMana).toBe(7);
    turn(g);
    expect(g.me.maxMana).toBe(6);
  });
  it('地點啟用計數、管家護甲與重新開放都生效', () => {
    const g = game();
    put(g, 'VAC_956');
    play(g, 'VAC_522');
    const loc = g.me.locations![0];
    g.apply({ type: 'location', uid: loc.uid });
    expect(g.me.locationsUsed).toBe(1);
    expect(g.me.hero.armor).toBe(3);
    expect(loc.cooldown).toBe(2);
    play(g, 'GAME_005');
    expect(loc.cooldown).toBe(0);
    expect(g.costOf(g.me, give(g, 'VAC_439'))).toBe(8);
  });
  it('地點與手下共用七個戰場位置', () => {
    const g = game();
    play(g, 'VAC_522');
    for (let i = 0; i < 6; i++) put(g);
    expect(g.canPlay(give(g, FILLER).uid).ok).toBe(false);
  });
  it('萊妮莎依實際支付費用施放兩次，產生兩份後續飲料並觸發兩次法術事件', () => {
    const g = game();
    play(g, 'VAC_507');
    play(g, 'VAC_323');
    expect(g.s.players[1].hero.hp).toBe(998);
    expect(g.me.hand.filter((h) => h.cardId === 'VAC_323t')).toHaveLength(2);
    expect(g.me.castHistory?.filter((id) => id === 'VAC_323')).toHaveLength(2);
  });
  it('暗髓讓打出的亡語手下死亡，亡語觸發兩次', () => {
    const g = game();
    play(g, 'VAC_503');
    const h = give(g, FILLER);
    play(g, 'WORK_015');
    expect(g.me.board.map((m) => m.cardId)).toEqual(['VAC_503']);
    expect(h.costMod).toBe(-12);
  });
  it('艾蘭娜只在己方回合把英雄傷害轉給敵人', () => {
    const g = game();
    play(g, 'VAC_501');
    play(g, 'CS2_008', g.me.hero.uid);
    expect(g.me.hero.hp).toBe(1000);
    expect(g.s.players[1].hero.hp).toBe(999);
    g.apply({ type: 'endTurn' });
    play(g, 'CS2_008', g.s.players[0].hero.uid);
    expect(g.s.players[0].hero.hp).toBe(999);
  });
  it('維斯塔三個己方回合後重放期間法術', () => {
    const g = game();
    play(g, 'VAC_519');
    play(g, 'CS2_029', g.s.players[1].hero.uid);
    turn(g);
    turn(g);
    expect(g.s.players[1].hero.hp).toBe(994);
    turn(g);
    expect(g.s.players[1].hero.hp).toBeLessThanOrEqual(988);
  });
  it('藥劑混合師使用九種一費材料，成品具備兩種效果', () => {
    const g = game(false);
    const h = give(g, 'VAC_523');
    g.apply({ type: 'play', handUid: h.uid });
    const first = g.s.pendingChoice!.options;
    g.apply({ type: 'choose', index: 0 });
    expect(g.s.pendingChoice!.options).not.toContain(first[0]);
    g.apply({ type: 'choose', index: 0 });
    const potion = g.me.hand.find((h) => h.cardId === 'VAC_523t')!;
    expect(potion.potion).toHaveLength(2);
    expect(g.handDef(potion).abilities).toHaveLength(2);
    expect(g.handDef(potion).cost).toBe(1);
  });
  it('賽佛瑞斯各旅行團只從固定卡池取兩張卡', () => {
    for (let i = 0; i < 3; i++) {
      const g = game(false),
        h = give(g, 'WORK_027');
      g.apply({ type: 'play', handUid: h.uid });
      g.apply({ type: 'choose', index: i });
      const pool = PARADISE_TOURS[['Modest', 'Extravagant', 'Hectic'][i]];
      expect(g.me.hand).toHaveLength(2);
      for (const c of g.me.hand) expect(pool).toContain(c.cardId);
    }
  });
  it('克蕾絲依持有期間的兩種不同學派變成正確版本', () => {
    const g = game(),
      h = give(g, 'VAC_449');
    play(g, 'CS2_029', g.s.players[1].hero.uid);
    expect(h.cardId).toBe('VAC_449');
    play(g, 'CS2_024', g.s.players[1].hero.uid);
    expect(h.cardId).toBe('VAC_449t6');
  });
  it('麥芽飲第二杯可以追溯為同名法術供潮池幼生發現', () => {
    const g = game(),
      p = give(g, 'VAC_304');
    play(g, 'VAC_323');
    const h = g.me.hand.find((h) => h.cardId === 'VAC_323t')!;
    g.apply({ type: 'play', handUid: h.uid });
    play(g, 'GAME_005');
    expect(p.heldSpells).toHaveLength(3);
    g.apply({ type: 'play', handUid: p.uid });
    expect(g.me.hand.some((h) => ['VAC_323', 'VAC_323t', 'GAME_005'].includes(h.cardId))).toBe(true);
  });
});

describe('天堂島特殊卡片互動', () => {
  it('命運牌會跟著牌堆頂變化，抽走頂牌後立刻更新', () => {
    const g = game();
    g.me.deck = [g.newHandCard('CS2_029'), g.newHandCard(FILLER)];
    play(g, 'VAC_420');
    const fortunes = g.me.hand.filter((h) => h.fortune);
    expect(fortunes).toHaveLength(2);
    expect(fortunes.every((h) => h.cardId === FILLER)).toBe(true);
    play(g, 'VAC_907');
    expect(fortunes.every((h) => h.cardId === 'VAC_420t')).toBe(true);
  });
  it('發球高手每次增加攻擊力都讓最高費手牌減費一次', () => {
    const g = game();
    play(g, 'VAC_920');
    const m = g.me.board[0],
      h = give(g, 'VAC_934');
    play(g, 'VAC_917t', m.uid);
    expect(h.costMod).toBe(-1);
    play(g, 'VAC_917t', m.uid);
    expect(h.costMod).toBe(-2);
  });
  it('沙灘魔堡戰鬥後保留剩餘生命成為地點，啟用後帶突襲回場', () => {
    const g = game(),
      friend = put(g);
    play(g, 'VAC_923');
    const castle = g.me.board.find((m) => m.cardId === 'VAC_923')!,
      enemy = put(g, FILLER, 1);
    expect(g.apply({ type: 'attack', attacker: castle.uid, target: enemy.uid })).toBe(true);
    const loc = g.me.locations![0];
    expect(loc.cardId).toBe('VAC_923t');
    expect(loc.durability).toBe(4);
    expect(g.apply({ type: 'location', uid: loc.uid, target: friend.uid })).toBe(true);
    expect(g.me.locations).toHaveLength(0);
    expect(g.atkOf(friend)).toBe(7);
    const restored = g.me.board.find((m) => m.cardId === 'VAC_923')!;
    expect(restored.hp).toBe(3);
    expect(g.hasKw(restored, 'RUSH')).toBe(true);
  });
  it('黑麥斬斧將第一片麵包後面的手下裝進三明治並召喚原加成手下', () => {
    const g = game();
    play(g, 'VAC_525');
    const h = give(g, FILLER);
    h.atkBuff = 3;
    play(g, 'VAC_525');
    const sandwich = g.me.hand.find((h) => h.cardId === 'VAC_525t2')!;
    expect(sandwich.packed?.map((h) => h.cardId)).toContain(FILLER);
    g.apply({ type: 'play', handUid: sandwich.uid });
    expect(g.atkOf(g.me.board[0])).toBe(7);
  });
  it('行李箱移走牌堆頂兩張，打開時保留原卡費用變化', () => {
    const g = game();
    const a = g.newHandCard('CS2_029'),
      b = g.newHandCard(FILLER);
    a.costMod = -2;
    g.me.deck = [a, b];
    play(g, 'VAC_935');
    expect(g.me.deck).toHaveLength(0);
    const bag = g.me.hand[0];
    g.apply({ type: 'play', handUid: bag.uid });
    expect(g.me.hand.map((h) => h.cardId)).toEqual([FILLER, 'CS2_029']);
    expect(g.me.hand[1].costMod).toBe(-2);
  });
  it('尤多拉需要打出三張外職牌才發現兩份戰利品', () => {
    const g = game();
    play(g, 'VAC_464');
    g.me.eudoraProgress = 0;
    for (let i = 0; i < 3; i++) play(g, 'VAC_323');
    expect(g.me.eudoraProgress).toBeUndefined();
    expect(g.me.hand.filter((h) => h.cardId.startsWith('VAC_464t')).length).toBe(2);
  });
  it('真的護符給自己、假的給敵人，假抽牌護符只棄掉本次抽到的牌', () => {
    const g = game();
    play(g, 'VAC_959');
    expect(g.me.hand[0].cardId).toMatch(/VAC_959t\d+t$/);
    expect(g.s.players[1].hand[0].cardId).toBe(g.me.hand[0].cardId.slice(0, -1));
    g.me.hand = [];
    const old = give(g, 'CS2_029');
    play(g, 'VAC_959t09');
    expect(g.me.hand).toContain(old);
    expect(g.me.hand).toHaveLength(2);
  });
  it('最後期限在起手手牌也具有暫時，回合結束時消失', () => {
    const deck = Array(30).fill('WORK_007');
    const g = Game.create({
      decks: [deck, Array(30).fill(FILLER)],
      classes: ['WARLOCK', 'PRIEST'],
      names: ['A', 'B'],
      ai: [true, true],
      seed: 1,
      first: 0,
    });
    g.apply({ type: 'mulligan', player: 0, replace: [] });
    g.apply({ type: 'mulligan', player: 1, replace: [] });
    expect(g.me.hand.every((h) => h.temporary)).toBe(true);
    g.apply({ type: 'endTurn' });
    expect(g.s.players[0].hand).toHaveLength(0);
  });
});

describe('暗髓的亡語範圍', () => {
  it('也讓武器亡語觸發兩次', () => {
    const g = game();
    play(g, 'VAC_503');
    play(g, 'VAC_330');
    play(g, 'CS2_106');
    expect(g.me.hand.filter(h => getCard(h.cardId).nameEn === 'The Coin')).toHaveLength(2);
  });
  it('手動觸發的手下亡語也執行兩次', () => {
    const g = game();
    play(g, 'VAC_503');
    const m = put(g, 'WORK_018');
    play(g, 'ICC_052', m.uid);
    expect(g.me.board.filter(m => m.cardId === 'WORK_018t')).toHaveLength(4);
    expect(g.me.board).toContain(m);
  });
});
