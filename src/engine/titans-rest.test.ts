import { describe, expect, it } from 'vitest';
import { COLLECTIBLE, getCard } from '../cards/registry';
import { TITANS_REST_OVERRIDES } from '../cards/titans-rest';
import { TITANS_ANOMALIES } from '../cards/anomalies';
import { Game } from './game';
import type { PlayerId } from './state';
const FILLER = 'CS2_182';
function game() {
  const g = Game.create({ decks: [Array(30).fill(FILLER), Array(30).fill(FILLER)], classes: ['MAGE','PRIEST'], names: ['A','B'], ai:[true,true], seed:42, first:0 });
  g.apply({type:'mulligan',player:0,replace:[]}); g.apply({type:'mulligan',player:1,replace:[]});
  for (const p of g.s.players) { p.hand=[]; p.mana=p.maxMana=10; p.hero.hp=p.hero.maxHp=1000; }
  return g;
}
function give(g: Game, id: string) { const h=g.newHandCard(id);g.me.hand.push(h);return h; }
function play(g: Game,id: string,target?:number,option?:number) { g.me.mana=100; const h=give(g,id); expect(g.apply({type:'play',handUid:h.uid,target,option}),id).toBe(true);return h; }
function put(g:Game,id=FILLER,owner:PlayerId=0) {const m=g.makeMinion(owner,id);g.s.players[owner].board.push(m);g.recalcAuras();return m;}
function turn(g:Game) {g.apply({type:'endTurn'});g.apply({type:'endTurn'});}

describe('泰坦完整卡庫',()=>{
  it('收錄所有 183 張與 20 種異常的資料',()=>{
    expect(COLLECTIBLE.filter(c=>c.set===1858)).toHaveLength(183);
    for(const id of TITANS_ANOMALIES) expect(getCard(id).text.length).toBeGreaterThan(0);
  });
  for(const c of COLLECTIBLE.filter(c=>c.set===1858 && TITANS_REST_OVERRIDES[c.id])) {
    for(let option=0;option<(c.chooseOne?.length??1);option++) it(`${c.id} ${c.nameEn} 選項 ${option} 可執行並結束回合`,()=>{
      const g=game();const ally=put(g);put(g,FILLER,1);ally.hp--;
      give(g,FILLER);give(g,'CS2_029');
      const h=give(g,c.id);g.me.mana=100;
      const req=c.chooseOne?.[option]?.target??c.target;
      const target=req?g.validTargets(req,0,c.type==='SPELL').find(uid=>uid!==h.uid):undefined;
      expect(g.apply({type:'play',handUid:h.uid,target,option}),c.id).toBe(true);
      if(g.s.phase==='play') {g.apply({type:'endTurn'});g.apply({type:'endTurn'});}
      expect(g.s.phase).not.toBe('mulligan');
    });
  }
});

describe('泰坦跨回合與數值規則',()=>{
  it('希芙根據施放過的不同學派持續增加法術傷害',()=>{
    const g=game();play(g,'TTN_071');expect(g.spellDamage(0)).toBe(1);
    play(g,'CS2_029',g.s.players[1].hero.uid);expect(g.spellDamage(0)).toBe(2);
    play(g,'CS2_029',g.s.players[1].hero.uid);expect(g.spellDamage(0)).toBe(2);
    expect(g.costOf(g.me,give(g,'TTN_085'))).toBe(4);
  });
  it('霍迪爾只將之後三個打出的手下變為 8/8',()=>{
    const g=game();play(g,'TTN_752');for(let i=0;i<4;i++)play(g,FILLER);
    expect(g.me.board.slice(1).map(m=>[g.atkOf(m),m.hp])).toEqual([[8,8],[8,8],[8,8],[4,5]]);
  });
  it('歐丁將後續護甲變成當回合攻擊力，跨回合仍有效',()=>{
    const g=game();play(g,'TTN_811');play(g,'TTN_930');expect(g.me.hero.armor).toBe(5);expect(g.atkOf(g.me.hero)).toBe(5);
    turn(g);expect(g.atkOf(g.me.hero)).toBe(0);play(g,'TTN_930');expect(g.atkOf(g.me.hero)).toBe(5);
  });
  it('幼苗只在自己的回合開始時計數，並保留費用加成',()=>{
    const g=game(),h=give(g,'TTN_950');h.costMod=-1;
    turn(g);expect(h.cardId).toBe('TTN_950');turn(g);expect(h.cardId).toBe('TTN_950t3');expect(h.costMod).toBe(-1);
    const lotus=give(g,'TTN_930');turn(g);turn(g);expect(lotus.cardId).toBe('TTN_930');turn(g);expect(lotus.cardId).toBe('TTN_930t');
  });
  it('星界自動機更新所有存活複製，沉默會移除自身加成',()=>{
    const g=game();play(g,'TTN_401');play(g,'TTN_401');play(g,'TTN_401');expect(g.me.board.map(m=>[g.atkOf(m),m.hp])).toEqual([[3,4],[3,4],[3,4]]);
    play(g,'CS2_203',g.me.board[0].uid);expect(g.atkOf(g.me.board[0])).toBe(1);
  });
  it('土靈依之前召喚次數獲得 2/2，較早的土靈不追溯變大',()=>{
    const g=game();play(g,'TTN_900t');play(g,'TTN_900t');play(g,'TTN_900t');expect(g.me.board.map(m=>[g.atkOf(m),m.hp])).toEqual([[2,2],[4,4],[6,6]]);
  });
  it('嚴寒凍結鎖住對手剛抽到的牌直到其下個回合結束',()=>{
    const g=game();play(g,'TTN_744');const cards=[...g.s.players[1].hand];g.apply({type:'endTurn'});
    for(const h of cards)expect(g.canPlay(h.uid).ok).toBe(false);
    g.apply({type:'endTurn'});g.apply({type:'endTurn'});g.me.mana=100;for(const h of cards)expect(g.canPlay(h.uid).ok).toBe(true);
  });
  it('導電複製到原目標的兩側，效果只消耗一次',()=>{
    const g=game();const left=put(g,FILLER,1),mid=put(g,FILLER,1),right=put(g,FILLER,1);
    play(g,'YOG_522');play(g,'CS2_024',mid.uid);expect([left.hp,mid.hp,right.hp]).toEqual([2,2,2]);
    play(g,'CS2_024',mid.uid);expect([left.hp,mid.hp,right.hp]).toEqual([2,-1,2]);
  });
  it('星穹射擊只強化下一個法術，跨回合保留',()=>{
    const g=game();play(g,'YOG_082',g.s.players[1].hero.uid);expect(g.spellDamage(0)).toBe(2);turn(g);
    const hp=g.s.players[1].hero.hp;play(g,'CS2_024',g.s.players[1].hero.uid);expect(g.s.players[1].hero.hp).toBe(hp-5);expect(g.spellDamage(0)).toBe(0);
  });
  it('禁果消耗剩餘法力；伊歐娜信徒讓兩個選項使用相同數量',()=>{
    const g=game();const h=give(g,'YOG_529');g.me.mana=7;expect(g.apply({type:'play',handUid:h.uid,option:1})).toBe(true);expect(g.me.hero.armor).toBe(14);expect(g.me.mana).toBe(0);
    play(g,'TTN_503');const both=give(g,'YOG_529');g.me.mana=6;g.apply({type:'play',handUid:both.uid,option:0});expect(g.atkOf(g.me.hero)).toBe(6);expect(g.me.hero.armor).toBe(26);
  });
  it('銳鱗最後套用最低兩點費用，包含幸運幣與降費牌',()=>{
    const g=game();put(g,'TTN_924',1);const h=give(g,'GAME_005');h.costMod=-5;expect(g.costOf(g.me,h)).toBe(2);
  });
  it('瞬光閃電只在下個自己的回合降低所有自然法術',()=>{
    const g=game();play(g,'TTN_830');const h=give(g,'TTN_830');expect(g.costOf(g.me,h)).toBe(2);turn(g);expect(g.costOf(g.me,h)).toBe(1);turn(g);expect(g.costOf(g.me,h)).toBe(2);
  });
  it('薩鋼托維爾在受到致命攻擊前抽牌',()=>{
    const g=game();const t=put(g,'TTN_711',1);t.hp=1;const a=put(g);a.sleeping=false;const before=g.s.players[1].hand.length;
    expect(g.apply({type:'attack',attacker:a.uid,target:t.uid})).toBe(true);expect(g.s.players[1].hand.length).toBe(before+1);
  });
  it('柯洛剛恩在戰鬥傷害前抓走手下，亡語只歸還仍留在手中的卡',()=>{
    const g=game();play(g,'TTN_330');const k=g.me.board[0],enemy=put(g,FILLER,1);
    expect(g.apply({type:'attack',attacker:k.uid,target:enemy.uid})).toBe(true);expect(k.hp).toBe(10);const held=g.me.hand.find(h=>h.cardId===FILLER)!;expect(held).toBeDefined();
    play(g,'EX1_622',k.uid);expect(g.s.players[1].hand.some(h=>h.uid===held.uid)).toBe(true);
  });
});

describe('異常與永久規則',()=>{
  it('丘加利在開局擲一次機率，20 種異常皆可出現且雙方同時生效',()=>{
    const seen=new Set<string>();let none=0;
    for(let seed=1;seed<=500;seed++) {
      const deck=['YOG_530',...Array(29).fill(FILLER)];
      const g=Game.create({decks:[deck,Array(30).fill(FILLER)],classes:['MAGE','PRIEST'],names:['A','B'],ai:[true,true],seed,first:0});
      const id=g.s.anomalies?.[0];if(!id){none++;continue;}seen.add(id);
      if(id==='TTN_002t24') for(const p of g.s.players)expect(p.hero.maxHp).toBe(35);
      if(id==='TTN_002t1')expect(g.s.players[0].heroPower.id).toBe('HERO_08bp2');
      if(id==='TTN_002t50')for(const p of g.s.players)expect(p.hand.some(h=>h.cardId==='TTN_922')).toBe(true);
      if(id==='TTN_002t32')for(const p of g.s.players)expect(p.hand.every(h=>h.costMod===-1)).toBe(true);
    }
    expect(seen.size).toBe(20);expect(none).toBeGreaterThan(150);expect(none).toBeLessThan(350);
  });
  it('回合末未用完法力的抽牌、幸運幣與隨機生命加成皆生效',()=>{
    const g=game();g.s.anomalies=['TTN_002t15','TTN_002t20','TTN_002t30'];const m=put(g),before=g.me.hand.length;
    g.apply({type:'endTurn'});expect(g.s.players[0].hand.length).toBe(before+2);expect(g.s.players[0].hand.some(h=>h.cardId==='GAME_005')).toBe(true);expect(m.hp).toBe(6);
  });
  it('扭曲現實只在本回合第一張牌洗入複製，保留手牌加成',()=>{
    const g=game();g.s.anomalies=['TTN_002t21'];const h=give(g,FILLER);h.atkBuff=2;const n=g.me.deck.length;
    g.apply({type:'play',handUid:h.uid});play(g,FILLER);expect(g.me.deck.length).toBe(n+1);expect(g.me.deck.some(h=>h.atkBuff===2 && !h.starting)).toBe(true);
  });
  it('黑爾雅賦予對手永不消失的瘟疫，抽到後重新洗入',()=>{
    const g=game();play(g,'TTN_850');const p=g.s.players[1];expect(p.unendingPlagues).toBe(true);
    p.deck=[g.newHandCard(FILLER),g.newHandCard('TTN_450t')];const hp=p.hero.hp;g.apply({type:'endTurn'});
    expect(p.hero.hp).toBeLessThan(hp);expect(p.deck.some(h=>h.cardId==='TTN_450t')).toBe(true);
  });
  it('符文裝飾只洗入兩張指定法術複製，抽到時施放並補抽',()=>{
    const g=game();play(g,'TTN_845');const copies=g.me.deck.filter(h=>h.castWhenDrawn);expect(copies).toHaveLength(2);expect(copies[0].cardId).toBe(copies[1].cardId);
    expect(getCard(copies[0].cardId).cost).toBeLessThanOrEqual(3);
    // 固定為不需目標的抽牌效果，驗證獨立的「抽到時施放」附魔。
    const h=g.newHandCard('GAME_005');h.castWhenDrawn=true;g.me.deck=[g.newHandCard(FILLER),h];turn(g);expect(g.me.hand.some(h=>h.cardId==='GAME_005')).toBe(false);expect(g.me.hand.some(h=>h.cardId===FILLER)).toBe(true);
  });
  it('卓頓每回合只複製第一張抽到的法術，優先以敵人為目標',()=>{
    const g=game();play(g,'TTN_842');g.me.deck=[g.newHandCard('CS2_029'),g.newHandCard('CS2_029')];const hp=g.s.players[1].hero.hp;
    turn(g);expect(g.s.players[1].hero.hp).toBe(hp-6);const before=g.s.players[1].hero.hp;play(g,'TTN_085');expect(g.s.players[1].hero.hp).toBe(before);
  });
});
