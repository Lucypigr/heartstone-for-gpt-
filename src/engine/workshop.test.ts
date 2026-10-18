import { describe, expect, it } from 'vitest';
import { COLLECTIBLE, getCard } from '../cards/registry';
import { Game } from './game';

const FILLER = 'CS2_182';

function game() {
  const g = Game.create({
    decks: [Array(30).fill(FILLER), Array(30).fill(FILLER)],
    classes: ['PALADIN', 'DRUID'], names: ['玩家', '對手'],
    ai: [false, false], seed: 42, first: 0,
  });
  g.apply({ type: 'mulligan', player: 0, replace: [] });
  g.apply({ type: 'mulligan', player: 1, replace: [] });
  for (const p of g.s.players) {
    p.hand = [];
    p.mana = p.maxMana = 10;
  }
  return g;
}

function play(g: Game, id: string) {
  const hc = g.newHandCard(id);
  g.me.hand.push(hc);
  g.me.mana = 10;
  expect(g.apply({ type: 'play', handUid: hc.uid }), id).toBe(true);
}

describe('威茲邦的工作坊：微縮與巨大化', () => {
  it('4 張正式卡可收藏，衍生版本不可收藏，官方 ID 不重複', () => {
    const originals = ['TOY_811', 'TOY_340', 'TOY_307', 'MIS_300'];
    const tokens = ['TOY_811t', 'TOY_340t1', 'TOY_307t', 'MIS_300t'];
    for (const id of originals) {
      expect(getCard(id).collectible, id).toBe(true);
      expect(COLLECTIBLE.some((c) => c.id === id), id).toBe(true);
    }
    for (const id of tokens) {
      expect(getCard(id).collectible, id).toBe(false);
      expect(COLLECTIBLE.some((c) => c.id === id), id).toBe(false);
    }
    expect(getCard('TOY_811').miniaturize).toBe('TOY_811t');
    expect(getCard('MIS_300').gigantify).toBe('MIS_300t');
  });

  it('打出雌虎玩偶，在原位置生成 1 費 1/1 微型版，仍保有聖盾、衝刺與生命竊取', () => {
    const g = game();
    const left = g.newHandCard(FILLER);
    const orig = g.newHandCard('TOY_811');
    const right = g.newHandCard(FILLER);
    g.me.hand.push(left, orig, right);
    expect(g.apply({ type: 'play', handUid: orig.uid })).toBe(true);
    expect(g.me.hand.map((h) => h.cardId)).toEqual([FILLER, 'TOY_811t', FILLER]);
    const mini = getCard('TOY_811t');
    expect([mini.cost, mini.attack, mini.health]).toEqual([1, 1, 1]);
    expect(mini.keywords).toEqual(expect.arrayContaining(['RUSH', 'LIFESTEAL', 'DIVINE_SHIELD']));
    play(g, 'TOY_811t');
    expect(g.me.hand.some((h) => h.cardId === 'TOY_811t')).toBe(false);
    expect(g.me.board.filter((m) => m.cardId === 'TOY_811t')).toHaveLength(1);
  });

  it('巨大化產生 8 費 8/8，巨型版出牌不會再複製', () => {
    const g = game();
    play(g, 'MIS_300');
    expect(g.me.hand.filter((h) => h.cardId === 'MIS_300t')).toHaveLength(1);
    const giant = getCard('MIS_300t');
    expect([giant.cost, giant.attack, giant.health]).toEqual([8, 8, 8]);
    expect(giant.keywords).toEqual(expect.arrayContaining(['ELUSIVE', 'LIFESTEAL', 'TAUNT']));
    play(g, 'MIS_300t');
    expect(g.me.hand.filter((h) => h.cardId === 'MIS_300t')).toHaveLength(0);
  });

  it('只召喚原版而非打出時，不會微縮', () => {
    const g = game();
    g.me.board.push(g.makeMinion(0, 'TOY_811'));
    expect(g.me.hand.some((h) => h.cardId === 'TOY_811t')).toBe(false);
  });

  it('懷舊學徒第一次施法才 +2/+2，第二次不能再次觸發', () => {
    const g = game();
    play(g, 'TOY_340');
    const m = g.me.board.find((x) => x.cardId === 'TOY_340')!;
    const hero = g.s.players[1].hero;
    const cast = () => {
      const hc = g.newHandCard('CS2_029');
      g.me.hand.push(hc);
      g.me.mana = 10;
      expect(g.apply({ type: 'play', handUid: hc.uid, target: hero.uid })).toBe(true);
    };
    cast();
    expect(g.atkOf(m)).toBe(4);
    expect(m.maxHp).toBe(5);
    cast();
    expect(g.atkOf(m)).toBe(4);
    expect(m.maxHp).toBe(5);
  });

  it('香甜陣雪元素原版與微型版保有戰吼，隨機冰霜法術屬於暫時卡', () => {
    const g = game();
    play(g, 'TOY_307');
    const generated = g.me.hand.filter((h) => h.temporary);
    expect(g.me.hand.some((h) => h.cardId === 'TOY_307t')).toBe(true);
    expect(generated).toHaveLength(2);
    expect(generated.every((h) => getCard(h.cardId).spellSchool === 'FROST')).toBe(true);
    play(g, 'TOY_307t');
    expect(g.me.hand.filter((h) => h.temporary)).toHaveLength(4);
    expect(g.me.hand.some((h) => h.cardId === 'TOY_307t')).toBe(false);
    expect(g.apply({ type: 'endTurn' })).toBe(true);
    expect(g.s.players[0].hand.some((h) => h.temporary)).toBe(false);
  });
});
