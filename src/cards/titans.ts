// 泰坦與鍛造：能力卡只作為操作選項，不是手牌、戰吼或施放的法術。
import { IGNIS_BASES, IGNIS_KEYWORDS, IGNIS_EFFECTS, ignisOption } from './ignis';
import type { Override } from './overrides';
import type { Ability, Effect, TargetReq } from '../engine/types';

const play = (...effects: Effect[]): Ability[] => [{ on: { k: 'play' }, effects }];
const fn = (name: string, args?: Record<string, unknown>): Effect => ({ e: 'custom', fn: name, args });
const self = { t: 'self' as const };
const chosen = { t: 'chosen' as const };
const anyChar: TargetReq = { filter: { type: 'character', side: 'any' } };
const anyMinion: TargetReq = { filter: { type: 'minion', side: 'any' } };
const enemyMinion: TargetReq = { filter: { type: 'minion', side: 'enemy' } };
const others = { t: 'all' as const, filter: { type: 'minion' as const, side: 'friendly' as const, excludeSelf: true } };
const enemies = { t: 'all' as const, filter: { type: 'minion' as const, side: 'enemy' as const } };
const summon = (card: string, count = 1): Effect => ({ e: 'summon', card, count, who: 'self' });
const draw = (count: number): Effect => ({ e: 'draw', count, who: 'self' });
const hit = (amount: number, spell = false): Effect => ({ e: 'damage', target: chosen, amount, spell });
const split = (spell = false): Effect => ({ e: 'splitDamage', amount: 5, filter: { type: 'minion', side: 'enemy' }, spell });
const buff = (atk: number, hp: number): Effect => ({ e: 'buff', target: self, atk, hp });
const titan = (ids: string[], after: Effect[] = [], rest: Override = {}): Override => ({ titan: ids, titanAfter: after, ...rest, tokens: [...ids, ...(rest.tokens ?? [])] });
const forged = (into: string, base: Override): Override => ({ ...base, forge: { into }, tokens: [...(base.tokens ?? []), into] });

export const TITANS_OVERRIDES: Record<string, Override> = {
  TTN_077: { magnetic: true, keywords: ['FREEZE_ON_DAMAGE'] },
  TTN_087: { magnetic: true, magneticBeasts: true, keywords: ['RUSH'] },
  TTN_471: { magnetic: true, keywords: ['CLEAVE'] },
  TTN_700: { magnetic: true, abilities: [{ on: { k: 'deathrattle' }, effects: [{ e: 'summonRandom', pool: { type: 'MINION', cost: 8, anyClass: true }, count: 1, who: 'self' }] }] },
  TTN_716: { abilities: play(fn('ttnMagneticMechs')) },
  TTN_719: { abilities: play(fn('ttnSparkbots', { count: 3 })), tokens: Array.from({ length: 8 }, (_, i) => `TTN_719t${i || ''}`) },
  TTN_732: { flags: ['inventomatic'] },
  TTN_734: { magnetic: true, abilities: [{ on: { k: 'deathrattle' }, effects: [fn('ttnMechaLeaper')] }] },
  TTN_852: { magnetic: true, abilities: [{ on: { k: 'attack', subject: 'self', after: true }, effects: [{ e: 'handBuff', atk: 1, hp: 1, scope: 'random' }] }] },
  TTN_860: { abilities: play(fn('ttnSparkbots', { count: 1 })), tokens: Array.from({ length: 8 }, (_, i) => `TTN_719t${i || ''}`) },
  TTN_906: { abilities: [{ on: { k: 'deathrattle' }, effects: [fn('ttnRepairbot')] }] },
  TTN_921: { magnetic: true, abilities: [{ on: { k: 'attack', subject: 'self' }, effects: [{ e: 'addCard', card: 'GAME_005', count: 1, who: 'self' }] }], tokens: ['GAME_005'] },
  TTN_923: { magnetic: true, stealthOneTurn: true },

  TTN_075: titan(['TTN_075t', 'TTN_075t2', 'TTN_075t3']),
  TTN_075t: { target: anyChar, abilities: play(fn('ttnNorgannon', { kind: 'damage' })) },
  TTN_075t2: { abilities: play(fn('ttnNorgannon', { kind: 'tax' })) },
  TTN_075t3: { abilities: play(fn('ttnNorgannon', { kind: 'secrets' })) },

  TTN_092: titan(['TTN_092t1', 'TTN_092t2', 'TTN_092t3'], [], { abilities: play({ e: 'equip', card: 'TTN_092t' }), tokens: ['TTN_092t', 'TTN_092e2t'] }),
  TTN_092t1: { abilities: play(fn('ttnWeapon', { kind: 'draw' })) },
  TTN_092t2: { abilities: play(fn('ttnWeapon', { kind: 'summon' })) },
  TTN_092t3: { abilities: play(fn('ttnWeapon', { kind: 'immune' })) },

  TTN_415: titan(['TTN_415t', 'TTN_415t2', 'TTN_415t3'], [fn('ttnKhazgoroth')]),
  TTN_415t: { abilities: play(buff(2, 2), { e: 'draw', count: 1, who: 'self', pool: { type: 'WEAPON' } }) },
  TTN_415t2: { abilities: play(buff(5, 0), { e: 'heroAttack', amount: 5 }) },
  TTN_415t3: { abilities: play(buff(0, 5), { e: 'armor', amount: 5 }) },

  TTN_429: titan(['TTN_429t', 'TTN_429t2', 'TTN_429t3'], [{ e: 'discover', pool: { type: 'MINION', rarity: 'LEGENDARY', anyClass: true, allowTitans: true } }]),
  TTN_429t: { target: anyMinion, abilities: play(fn('ttnAmanthulCopy')) },
  TTN_429t2: { target: enemyMinion, abilities: play(fn('ttnRemoveTwo')) },
  TTN_429t3: { abilities: play(fn('coOskSummon6')) },

  TTN_721: titan(['TTN_721t', 'TTN_721t1', 'TTN_721t2']),
  TTN_721t: { abilities: play(fn('ttnVoltron', { kind: 'damage' })) },
  TTN_721t1: { abilities: play(fn('ttnVoltron', { kind: 'draw' })) },
  TTN_721t2: { abilities: play(fn('ttnVoltron', { kind: 'elusive' })) },

  TTN_737: titan(['TTN_737t', 'TTN_737t3', 'TTN_737t1'], [fn('ttnPrimusDiscover')], { tokens: ['TTN_737t2'] }),
  TTN_737t: { target: enemyMinion, abilities: play(fn('coOskDestroy')) },
  TTN_737t3: { abilities: play(fn('ttnPrimusFrost')) },
  TTN_737t1: { abilities: play(summon('TTN_737t2', 2)) },

  TTN_800: titan(['TTN_800t', 'TTN_800t2', 'TTN_800t3'], [], { auras: [{ scope: 'firstSpellDiscount', cost: 3 }] }),
  TTN_800t: { abilities: play(fn('coOskBlast')) },
  TTN_800t2: { target: { filter: { type: 'minion', side: 'any', excludeSelf: true } }, abilities: play(hit(20)) },
  TTN_800t3: { abilities: play({ e: 'draw', count: 3, who: 'self', pool: { overload: true } }) },

  TTN_858: titan(['TTN_858t1', 'TTN_858t2', 'TTN_858t3'], [], { keywords: ['TAUNT'], flags: ['amitusDamageCap'] }),
  TTN_858t1: { abilities: play(fn('coOskDraw2')) },
  TTN_858t2: { abilities: play({ e: 'buff', target: others, atk: 2, hp: 2 }) },
  TTN_858t3: { abilities: play({ e: 'setStats', target: enemies, atk: 2, hp: 2 }) },

  TTN_862: titan(['TTN_862t1', 'TTN_862t2', 'TTN_862t3'], [], {
    auras: [{ scope: 'leftFriendly', keywords: ['RUSH'] }, { scope: 'rightFriendly', keywords: ['LIFESTEAL'] }], tokens: ['TTN_862t4'],
  }),
  TTN_862t1: { abilities: play({ e: 'discover', pool: { type: 'MINION', hasDeathrattle: true } }, { e: 'costMod', amount: -3, scope: 'it' }) },
  TTN_862t2: { abilities: play(fn('coHandCost', { n: 2 })) },
  TTN_862t3: { abilities: play(summon('TTN_862t4', 4)) },

  TTN_903: titan(['TTN_903t', 'TTN_903t2', 'TTN_903t3'], [summon('TTN_903t4')], { tokens: ['TTN_903t4'] }),
  TTN_903t: { abilities: play(fn('drawUntil', { n: 10, current: true })) },
  TTN_903t2: { abilities: play({ e: 'fullHeal', target: { t: 'hero', side: 'friendly' } }) },
  TTN_903t3: { abilities: play({ e: 'mana', kind: 'refresh', amount: 100 }) },

  TTN_960: titan(['TTN_960t2', 'TTN_960t3', 'TTN_960t4'], [], { abilities: play(fn('ttnOpenPortal')), tokens: ['TTN_960t', 'TTN_960t5', 'TTN_960t6'] }),
  // 永久物占一個戰場位置，不能攻擊、被指定或被一般全場效果移除。
  TTN_960t: { permanent: true, health: 1, keywords: ['DORMANT', 'CANT_ATTACK'], noCorpse: true, abilities: [{ on: { k: 'turnEnd', whose: 'mine' }, effects: [fn('ttnPortalSummon')] }] },
  TTN_960t2: { abilities: play(fn('ttnPortal', { kind: 'remove' })) },
  TTN_960t3: { abilities: play(fn('ttnPortal', { kind: 'infernal' })) },
  TTN_960t4: { abilities: play(fn('ttnPortal', { kind: 'buff' })) },

  YOG_516: titan(['YOG_516t', 'YOG_516t2', 'YOG_516t3'], [fn('castRandomSpell'), fn('castRandomSpell')], { tokens: ['YOG_514'] }),
  YOG_516t: { target: enemyMinion, abilities: play({ e: 'steal', target: chosen }) },
  YOG_516t2: { abilities: play(fn('coOskForce')) },
  YOG_516t3: { abilities: play(fn('ttnTendrilHand')) },
  YOG_514: { abilities: play(fn('ttnTendril')) },
  YOG_515: { abilities: play({ e: 'addCard', card: 'YOG_514', count: 2, who: 'self' }), tokens: ['YOG_514'] },
  YOG_517: { abilities: [{ on: { k: 'turnEnd', whose: 'mine' }, effects: [{ e: 'addCard', card: 'YOG_514', count: 1, who: 'self' }] }], tokens: ['YOG_514'] },
  YOG_523: { keywords: ['TAUNT'], abilities: [{ on: { k: 'deathrattle' }, effects: [{ e: 'addCard', card: 'YOG_514', count: 2, who: 'self' }] }], tokens: ['YOG_514'] },

  TTN_039: forged('TTN_039t', { abilities: play({ e: 'addRandom', pool: { type: 'SPELL', spellSchool: 'HOLY', anyClass: true }, count: 1, who: 'self' }) }),
  TTN_039t: { abilities: play({ e: 'addRandom', pool: { type: 'SPELL', spellSchool: 'HOLY', anyClass: true }, count: 1, who: 'self' }, { e: 'heal', target: { t: 'hero', side: 'friendly' }, amount: 6 }) },
  TTN_042: forged('TTN_042t', { keywords: ['RUSH'] }),
  TTN_042t: { keywords: ['RUSH'] },
  TTN_076: forged('TTN_076t', { abilities: play({ e: 'discover', pool: { type: 'SPELL' } }) }),
  TTN_076t: { abilities: play({ e: 'discover', pool: { type: 'SPELL' } }, { e: 'costMod', amount: -3, scope: 'it' }) },
  TTN_302: forged('TTN_302t', { abilities: play(fn('ttnTraps', { count: 1 })) }),
  TTN_302t: { abilities: play(fn('ttnTraps', { count: 2 })) },
  TTN_430: forged('TTN_430t', { abilities: play(fn('ttnCreation', { copies: 1 })) }),
  TTN_430t: { abilities: play(fn('ttnCreation', { copies: 2 })) },
  TTN_457: forged('TTN_457t', { target: { ...anyChar, optional: true, when: { c: 'corpses', n: 3 } }, abilities: play({ e: 'spendCorpses', amount: 3, then: [hit(3)] }) }),
  TTN_457t: { target: { ...anyChar, optional: true }, abilities: play({ e: 'gainCorpses', amount: 3 }, hit(3)) },
  TTN_458: forged('TTN_458t', { abilities: play(split()) }),
  TTN_458t: { keywords: ['LIFESTEAL'], abilities: play(split()) },
  TTN_477: forged('TTN_477t1', { target: anyChar, abilities: play(hit(3, true), { e: 'addRandom', pool: { type: 'SPELL' }, count: 1, who: 'self' }) }),
  TTN_477t1: { target: anyChar, abilities: play(hit(3, true), { e: 'addRandom', pool: { type: 'SPELL' }, count: 1, who: 'self' }, hit(3, true), { e: 'addRandom', pool: { type: 'SPELL' }, count: 1, who: 'self' }) },
  TTN_490: forged('TTN_490t', { abilities: play(fn('ttnDiscardImps')), tokens: ['TTN_960t6'] }),
  TTN_490t: { abilities: play(fn('ttnDiscardImps', { forged: true })), tokens: ['TTN_960t6'] },
  TTN_724: forged('TTN_724t', { keywords: ['TAUNT'] }),
  TTN_724t: { keywords: ['TAUNT'], forge: { into: 'TTN_724t', discount: 2 } },
  TTN_729: { flags: ['meltedMaker'] },
  TTN_751: { abilities: play(fn('ttnIgnis')), tokens: [...IGNIS_BASES, ...IGNIS_KEYWORDS, ...IGNIS_EFFECTS.flatMap((e) => [0, 1, 2].map((tier) => ignisOption(e, tier)))] },
  TTN_730: forged('TTN_730t', { abilities: [{ on: { k: 'turnEnd', whose: 'mine' }, effects: [{ e: 'summonCopy', target: self, count: 1 }] }] }),
  TTN_730t: { magnetic: true, abilities: [{ on: { k: 'turnEnd', whose: 'mine' }, effects: [{ e: 'summonCopy', target: self, count: 1 }] }] },
  TTN_753: forged('TTN_753t', { target: anyMinion, abilities: play(hit(5, true)) }),
  TTN_753t: { target: anyMinion, abilities: play(hit(5, true), split(true)) },
  TTN_801: forged('TTN_801t', { abilities: [{ on: { k: 'spellCast', side: 'friendly', school: 'NATURE' }, effects: [fn('ttnStormElemental')] }], tokens: ['TTN_801t1'] }),
  TTN_801t: { abilities: [{ on: { k: 'spellCast', side: 'friendly', school: 'NATURE' }, effects: [fn('ttnStormElemental', { rush: true })] }], tokens: ['TTN_801t2'] },
  TTN_855t: forged('TTN_855', { abilities: play(fn('ttnTyrsTears', { count: 3 })) }),
  TTN_855: { abilities: play(fn('ttnTyrsTears', { count: 4 })) },
  TTN_865: forged('TTN_865t', { abilities: play(draw(2)) }),
  TTN_865t: { abilities: play(fn('ttnWeight'), draw(2)) },
  TTN_951: forged('TTN_951t', { abilities: play(fn('ttnEmbrace')) }),
  TTN_951t: { abilities: play(fn('ttnEmbrace', { forged: true })) },
  YOG_502: forged('YOG_502t', { abilities: play({ e: 'damage', target: { t: 'all', filter: { type: 'minion' } }, amount: { dyn: 'armor' }, spell: true }) }),
  YOG_502t: { abilities: play({ e: 'armor', amount: 3 }, { e: 'damage', target: { t: 'all', filter: { type: 'minion' } }, amount: { dyn: 'armor' }, spell: true }) },
  YOG_525: forged('YOG_525t', { abilities: play({ e: 'handBuff', atk: 1, hp: 1, scope: 'all' }) }),
  YOG_525t: { abilities: play({ e: 'handBuff', atk: 2, hp: 2, scope: 'all' }) },
};

// 伊格尼斯的選項卡與三種武器基底。
for (const id of IGNIS_BASES) TITANS_OVERRIDES[id] = {};
for (const [id, keyword] of [['TTN_060t3', 'POISONOUS'], ['TTN_060t4', 'LIFESTEAL'], ['TTN_060t5', 'WINDFURY'], ['TTN_060t6', 'CLEAVE']] as const) {
  TITANS_OVERRIDES[id] = { keywords: [keyword] };
}
TITANS_OVERRIDES.TTN_060t9 = { flags: ['immuneAttacking'] };
for (const tier of [0, 1, 2]) {
  const after = (...effects: Effect[]): Ability[] => [{ on: { k: 'attack', subject: 'friendlyHero', after: true }, effects }];
  TITANS_OVERRIDES[ignisOption(7, tier)] = { abilities: [{ on: { k: 'deathrattle' }, effects: [{ e: 'damage', target: { t: 'all', filter: { type: 'character', side: 'enemy' } }, amount: [1, 2, 4][tier] }] }] };
  TITANS_OVERRIDES[ignisOption(8, tier)] = { abilities: after({ e: 'armor', amount: [2, 4, 8][tier] }) };
  TITANS_OVERRIDES[ignisOption(10, tier)] = { abilities: after({ e: 'summonRandom', pool: { type: 'MINION', cost: [2, 4, 8][tier], anyClass: true }, count: 1, who: 'self' }) };
  TITANS_OVERRIDES[ignisOption(12, tier)] = { target: { ...anyChar, optional: true }, abilities: play(hit([2, 4, 6][tier])) };
  TITANS_OVERRIDES[ignisOption(13, tier)] = { abilities: after(draw(tier + 1)) };
}

for (const [i, keyword] of (['DIVINE_SHIELD', 'TAUNT', 'RUSH', 'WINDFURY', 'POISONOUS', 'ELUSIVE', 'REBORN', 'LIFESTEAL'] as const).entries()) {
  TITANS_OVERRIDES[`TTN_719t${i || ''}`] = { magnetic: true, keywords: [keyword] };
}
