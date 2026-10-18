// 《威茲邦的工作坊》批次補卡：沿用舊系列的 Overrides → 官方 CardDefs 產生流程。
// 只有已知、可執行的效果才放在此處；卡名、費用、攻防、官方 ID 由 XML 取得。
import type { Override } from './overrides';
import type { Ability, Effect } from '../engine/types';

const play = (...effects: Effect[]): Ability[] => [{ on: { k: 'play' }, effects }];
const death = (...effects: Effect[]): Ability[] => [{ on: { k: 'deathrattle' }, effects }];
const fn = (name: string, args?: Record<string, unknown>): Effect => ({ e: 'custom', fn: 'ws' + name, args });
const hero = { t: 'hero' as const, side: 'friendly' as const };
const allFriends = { t: 'all' as const, filter: { type: 'minion' as const, side: 'friendly' as const } };
const enemy = { t: 'random' as const, filter: { type: 'character' as const, side: 'enemy' as const }, count: 1 };

export const WORKSHOP_REST_OVERRIDES: Record<string, Override> = {
  MIS_026: { abilities: [{ on: { k: 'draw', side: 'friendly' }, effects: [fn('Dorian')] }] },
  MIS_911: { abilities: [{ on: { k: 'attack', subject: 'friendlyHero', after: true },
    effects: [{ e: 'summon', card: 'MIS_911', count: 1, who: 'self' }] }] },
  TOY_000: { keywords: ['TAUNT'], atkIf: { cond: { c: 'opponentTurn' }, atk: 2 } },
  TOY_381: { flags: ['heroPowerAlwaysFree' as any] },
  TOY_529: { abilities: play(fn('Wheel')) },
  TOY_851: { abilities: play(fn('ToyChest')) },
  TOY_884: { abilities: play(fn('CraneGame')) },
  TOY_886: { abilities: play(fn('Endgame')) },
  TOY_894: { target: { filter: { type: 'minion', side: 'any', excludeSelf: true } },
    keywords: ['RUSH'], abilities: play(fn('OrigamiAttack')) },
  TOY_895: { target: { filter: { type: 'minion', side: 'any', excludeSelf: true } },
    keywords: ['TAUNT'], abilities: play(fn('OrigamiHealth')) },
  TOY_896: { target: { filter: { type: 'minion', side: 'any', excludeSelf: true } },
    keywords: ['DIVINE_SHIELD', 'LIFESTEAL'], abilities: play(fn('OrigamiStats')) },
  TOY_897: { abilities: death(fn('Hydra')) },
  TOY_960: { abilities: play(fn('Jepetto')) },
  // 迷你系列：能以既有 DSL 正確執行的卡
  MIS_104: { abilities: play({ e: 'addRandom', pool: { type: 'MINION', race: 'BEAST' }, count: 5, who: 'self', temporary: true }) },
  MIS_107: { abilities: play({ e: 'cond', cond: { c: 'deckNoMinions' },
    then: [{ e: 'splitDamage', filter: { type: 'minion', side: 'enemy' }, amount: 6, spell: true }],
    else: [{ e: 'splitDamage', filter: { type: 'minion', side: 'enemy' }, amount: 3, spell: true }] }) },
  MIS_301: { abilities: play({ e: 'summon', card: 'EX1_158t', count: 1, who: 'self' }, fn('Beanstalk')) },
  MIS_703: { keywords: ['TAUNT'], abilities: play(fn('SetHero15')) },
  MIS_705: { abilities: play({ e: 'addRandom', pool: { type: 'MINION', keyword: 'TAUNT' }, count: 5, who: 'self', temporary: true }) },
  MIS_707: { abilities: play({ e: 'draw', who: 'self', count: 2 },
    { e: 'damage', target: hero, amount: 3, spell: true },
    { e: 'shuffle', card: 'MIS_707', count: 2, who: 'self' }) },
  MIS_708: { abilities: play({ e: 'addRandom', pool: { otherClass: true }, count: 5, who: 'self', temporary: true }) },
  MIS_916: { abilities: play(fn('RockPaperScissors')) },

  TOY_037: { abilities: play(fn('DiscoverCheapSecret')) },
  TOY_046: { abilities: play(fn('DiscoverSevenSeven')) },
  TOY_353: { abilities: play(fn('PatchworkPals')) },
  TOY_370: { abilities: play({ e: 'repeat', times: 3, effects: [{ e: 'damage', target: enemy, amount: 2 }] }) },
  TOY_371: { abilities: play(fn('ManufacturingError')) },
  TOY_374: { abilities: play(fn('SpotDifference')) },
  TOY_375: { target: { filter: { type: 'minion', side: 'enemy' } }, abilities: play(fn('FreezeArmor')) },
  TOY_377: { target: { filter: { type: 'character', side: 'any' } }, abilities: play(fn('FrostCrossStitch')) },
  TOY_380: { keywords: ['TAUNT'], abilities: death({ e: 'summon', card: 'TOY_380t2', count: 1, who: 'self' }),
    tokens: ['TOY_380t2'] },
  TOY_382: { abilities: death({ e: 'addCard', card: 'TOY_382t', count: 2, who: 'self' }), tokens: ['TOY_382t'] },
  TOY_386: { abilities: play({ e: 'cond', cond: { c: 'holding', race: 'DRAGON' }, then: [
    { e: 'handBuff', atk: 1, hp: 1, scope: 'random', race: 'DRAGON' },
    { e: 'buff', target: { t: 'self' }, atk: 1, hp: 1 },
  ] }) },
  TOY_387: { abilities: play(fn('ScaleReplica')) },
  TOY_391: { abilities: play({ e: 'draw', who: 'self', count: 1, pool: { type: 'MINION', minCost: 5 } }) },
  TOY_506: { abilities: play(
    { e: 'summonRandom', pool: { race: 'BEAST', cost: 3, type: 'MINION' }, count: 1, who: 'self' },
    { e: 'summonRandom', pool: { race: 'DRAGON', cost: 3, type: 'MINION' }, count: 1, who: 'self' },
    { e: 'summonRandom', pool: { race: 'ELEMENTAL', cost: 3, type: 'MINION' }, count: 1, who: 'self' },
    { e: 'summonRandom', pool: { race: 'MURLOC', cost: 3, type: 'MINION' }, count: 1, who: 'self' },
  ) },
  TOY_514: { abilities: play(fn('ThistleTea')) },
  TOY_520: { abilities: play(fn('ObserverSecrets')) },
  TOY_521: { abilities: play({ e: 'nextCardDiscount', amount: 2 }) },
  TOY_530: { costRule: { per: 'cardsDrawnThisGame', amount: 1 } },
  TOY_603: { target: { filter: { type: 'minion', side: 'friendly', race: 'MECHANICAL' } }, abilities: play(fn('WreckAndDeck')) },
  TOY_640: { target: { filter: { type: 'minion', side: 'any' } }, abilities: play(fn('WorkshopMishap')) },
  TOY_642: { keywords: ['LIFESTEAL'], abilities: [...play(fn('BallHog')), ...death(fn('BallHog'))] },
  TOY_643: { abilities: play(fn('BlindBox')) },
  TOY_670: { abilities: death({ e: 'summon', card: 'GVG_085', count: 2, who: 'self' }) },
  TOY_716: { abilities: play({ e: 'summon', card: 'GVG_085', count: 1, who: 'self' },
    { e: 'buff', target: allFriends, atk: 1, hp: 2 }) },
  TOY_800: { target: { filter: { type: 'character', side: 'any' } }, abilities: play(fn('SparklingPhial')) },
  TOY_804: { costIf: { cond: { c: 'spellDamage' }, cost: 2 }, abilities: play({ e: 'summon', card: 'TOY_804t', count: 2, who: 'self' }), tokens: ['TOY_804t'] },
  TOY_805: { abilities: play(fn('Ensmallen')) },
  TOY_806: { abilities: play(fn('SkyMother')) },
  TOY_813: { keywords: ['TAUNT'], target: { filter: { type: 'minion', side: 'any' }, optional: true }, abilities: play(fn('Tarim')) },
  TOY_820: { abilities: [{ on: { k: 'turnEnd', whose: 'mine' }, effects: [fn('Animatronic')] }] },
  TOY_828: { keywords: ['TAUNT'], abilities: death({ e: 'handBuff', atk: 2, hp: 2, scope: 'all', race: 'UNDEAD' }) },
  TOY_877: { abilities: play(fn('WishUponStar')) },
  TOY_881: { target: { filter: { type: 'minion', side: 'any', keyword: 'DIVINE_SHIELD' } }, abilities: play({
    e: 'buff', target: { t: 'chosen' }, atk: 2, hp: 3,
  }) },
  TOY_891: { abilities: play({ e: 'cond', cond: { c: 'hasLocation' }, then: [{ e: 'draw', who: 'self', count: 2 }] }) },
  TOY_906: { keywords: ['TAUNT'], abilities: [{ on: { k: 'damaged', subject: 'self' }, effects: [fn('Botface')] }] },
  TOY_907: { costIf: { cond: { c: 'not', cond: { c: 'armor', n: 1 } }, cost: 0 }, abilities: play({ e: 'armor', amount: 6 }) },
  TOY_908: { abilities: death({ e: 'summon', card: 'GVG_110t', count: 2, who: 'self' }) },
  TOY_916: { abilities: play(fn('SketchArtist')) },
};
