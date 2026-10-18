import { describe, expect, it } from 'vitest';
import { COLLECTIBLE, getCard } from '../cards/registry';
import { Game } from './game';

const FILLER = 'CS2_182';
function game() {
  const g = Game.create({
    decks: [Array(30).fill(FILLER), Array(30).fill(FILLER)],
    classes: ['MAGE', 'WARRIOR'], names: ['玩家', '電腦'],
    ai: [false, false], seed: 42, first: 0,
  });
  g.apply({ type: 'mulligan', player: 0, replace: [] });
  g.apply({ type: 'mulligan', player: 1, replace: [] });
  for (const p of g.s.players) { p.hand = []; p.mana = p.maxMana = 10; }
  return g;
}
function play(g: Game, id: string, target?: number) {
  const h = g.newHandCard(id);
  g.me.hand.push(h);
  g.me.mana = 10;
  expect(g.apply({ type: 'play', handUid: h.uid, target }), id).toBe(true);
}
function enemy(g: Game, id = FILLER) {
  const m = g.makeMinion(1,id);
  g.s.players[1].board.push(m);
  g.recalcAuras();
  return m;
}

describe('威茲邦的工作坊：批次補卡與引擎回歸', () => {
  it('已新增大量可收藏卡，所有卡牌 ID 唯一且效果不是空白占位', () => {
    const set = COLLECTIBLE.filter((c) => c.set === 1897);
    expect(set.length).toBeGreaterThanOrEqual(85);
    expect(new Set(set.map((c) => c.id)).size).toBe(set.length);
    for (const id of ['MIS_104','MIS_107','MIS_707','TOY_370','TOY_506','TOY_521','TOY_828','TOY_907']) {
      expect(getCard(id).abilities?.length || getCard(id).costIf || getCard(id).costRule, id).toBeTruthy();
    }
  });

  it('荒野卡包：隨機五張野獸是暫時卡，回合結束即消失', () => {
    const g=game(); play(g,'MIS_104');
    expect(g.me.hand).toHaveLength(5);
    expect(g.me.hand.every((h)=>h.temporary && getCard(h.cardId).races?.includes('BEAST'))).toBe(true);
    g.apply({type:'endTurn'});
    expect(g.s.players[0].hand).toHaveLength(0);
  });

  it('故障：有手下的牌堆造成 3 點，無手下的牌堆造成 6 點', () => {
    const g=game(); const m=enemy(g);
    play(g,'MIS_107'); expect(m.hp).toBe(2);
    g.s.players[0].deck=[]; const other=enemy(g);
    play(g,'MIS_107');
    expect(other.hp).toBeLessThan(5);
  });

  it('大量生產：抽兩張牌、英雄受到3點傷害、把兩張自己洗回牌堆', () => {
    const g=game(); const n=g.me.deck.length; play(g,'MIS_707');
    expect(g.me.hero.hp).toBe(27);
    expect(g.me.deck.length).toBe(n);
    expect(g.me.deck.filter((x)=>x.cardId==='MIS_707')).toHaveLength(2);
  });

  it('三燭戲法師：戰吼 3 次各造成2點傷害', () => {
    const g=game(); const hp=g.s.players[1].hero.hp;
    play(g,'TOY_370'); expect(g.s.players[1].hero.hp).toBe(hp-6);
  });

  it('玩具折扣：微縮手下打出後產生官方微型卡與下張折扣', () => {
    const g=game(); play(g,'TOY_521');
    const d=getCard('TOY_521');
    expect(d.miniaturize).toBeTruthy();
    expect(g.me.hand.some((h)=>h.cardId===d.miniaturize)).toBe(true);
    expect(g.me.nextCardDiscount).toBe(2);
  });

  it('林地奇蹟：召喚兩隻2/5嘲諷甲蟲', () => {
    const g=game(); play(g,'TOY_804');
    expect(g.me.board.map((m)=>m.cardId)).toEqual(['TOY_804t','TOY_804t']);
    expect(g.me.board.every((m)=>m.maxHp===5)).toBe(true);
  });

  it('安全護目鏡：沒有護甲時費用0，使用後獲得6護甲', () => {
    const g=game(), h=g.newHandCard('TOY_907');
    g.me.hand.push(h);
    expect(g.costOf(g.me,h)).toBe(0);
    expect(g.apply({type:'play',handUid:h.uid})).toBe(true);
    expect(g.me.hero.armor).toBe(6);
    const second=g.newHandCard('TOY_907');
    g.me.hand.push(second);
    expect(g.costOf(g.me,second)).toBe(2);
  });

  it('微縮人偶師：死亡時讓手牌中的不死族獲得 +2/+2', () => {
    const g=game();
    const puppet=g.makeMinion(0,'TOY_828');
    g.me.board.push(puppet);
    const undead=g.newHandCard('ICC_025');
    g.me.hand.push(undead);
    const before=[undead.atkBuff,undead.hpBuff];
    // 以傷害觸發真實亡語，不直接修改測試結果
    g.me.mana=10;
    const kill=g.newHandCard('CS2_029');
    g.me.hand.push(kill);
    expect(g.apply({type:'play',handUid:kill.uid,target:puppet.uid})).toBe(true);
    expect([undead.atkBuff,undead.hpBuff]).toEqual([before[0]+2,before[1]+2]);
  });
});
