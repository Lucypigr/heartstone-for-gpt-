import type { Override } from './overrides';
import type { Ability, Effect, TargetReq } from '../engine/types';
const play = (...effects: Effect[]): Ability[] => [{ on: { k: 'play' }, effects }];
const dr = (...effects: Effect[]): Ability[] => [{ on: { k: 'deathrattle' }, effects }];
const end = (...effects: Effect[]): Ability[] => [{ on: { k: 'turnEnd', whose: 'mine' }, effects }];
const fn = (name: string, args?: Record<string, unknown>): Effect => ({ e: 'custom', fn: `vac${name}`, args });
const chosen = { t: 'chosen' as const };
const minion: TargetReq = { filter: { type: 'minion', side: 'any' } };
const anyChar: TargetReq = { filter: { type: 'character', side: 'any' } };
const hit = (amount: number): Effect => ({ e: 'damage', target: chosen, amount, spell: true });
const summon = (card: string, count = 1): Effect => ({ e: 'summon', card, count, who: 'self' });
const draw = (count: number): Effect => ({ e: 'draw', count, who: 'self' });
export const PARADISE_DRINKS = ['VAC_323', 'VAC_338', 'VAC_404', 'VAC_520', 'VAC_916', 'VAC_951'];
export const PARADISE_OVERRIDES: Record<string, Override> = {
  VAC_336: { tourist: 'WARLOCK', abilities: play({ e: 'discover', pool: { type: 'HERO', past: true, otherClass: true } }) },
  VAC_340: { tourist: 'DRUID', keywords: ['TAUNT'], abilities: end(fn('Hamm')) },
  VAC_413: {
    tourist: 'WARRIOR',
    abilities: [...end({ e: 'addCard', card: 'VAC_413t', count: 1, who: 'self' }), ...dr({ e: 'handBuff', atk: 2, hp: 3, scope: 'all' })],
    tokens: ['VAC_413t'],
  },
  VAC_424: {
    tourist: 'PALADIN',
    abilities: [
      {
        on: { k: 'spellCast', side: 'friendly' },
        effects: [
          { e: 'summonRandom', pool: { type: 'MINION', cost: 2, anyClass: true }, count: 1, who: 'self' },
          { e: 'buff', target: { t: 'it' }, keywords: ['DIVINE_SHIELD'] },
        ],
      },
    ],
  },
  VAC_437: { tourist: 'SHAMAN', abilities: play(fn('Buttons')) },
  VAC_450: { tourist: 'DEMONHUNTER', abilities: [{ on: { k: 'minionDied', side: 'friendly' }, effects: [fn('Cookie')] }] },
  VAC_501: { tourist: 'PRIEST' },
  VAC_503: {
    tourist: 'DEATHKNIGHT',
    flags: ['doubleDeathrattle'],
    abilities: [
      {
        on: { k: 'cardPlayed', side: 'friendly', cardType: 'MINION' },
        cond: { c: 'itHasDeathrattle' },
        effects: [{ e: 'destroy', target: { t: 'it' } }],
      },
    ],
  },
  VAC_507: { tourist: 'ROGUE' },
  VAC_519: { tourist: 'MAGE', abilities: play(fn('Vistah')) },
  VAC_957: { tourist: 'HUNTER', target: { ...minion, optional: true }, abilities: play(fn('Voljin')) },
  WORK_013: { tourist: 'HUNTER', abilities: play(fn('Turbulus')) },
  WORK_063: { tourist: 'ROGUE', abilities: play(fn('Skyla')) },
  VAC_328: { keywords: ['TAUNT'], permanentlyFrozen: true },
  VAC_435: { auras: [{ scope: 'firstSpellDiscount', cost: 2 }] },
  VAC_461: { abilities: dr(fn('DrinkServer')), tokens: PARADISE_DRINKS },
  VAC_907: {
    abilities: play(fn('ChooseThrice', { options: ['VAC_907t1', 'VAC_907t2', 'VAC_907t3'] })),
    tokens: ['VAC_907t1', 'VAC_907t2', 'VAC_907t3'],
  },
  VAC_907t1: { abilities: play(draw(2)) },
  VAC_907t2: { abilities: play({ e: 'armor', amount: 5 }) },
  VAC_907t3: { abilities: play({ e: 'mana', kind: 'refresh', amount: 3 }) },
  WORK_025: {
    keywords: ['RUSH', 'TAUNT'],
    abilities: play(fn('ChooseThrice', { options: ['WORK_025a', 'WORK_025b'] })),
    tokens: ['WORK_025a', 'WORK_025b'],
  },
  WORK_025a: { abilities: play({ e: 'buff', target: { t: 'self' }, atk: 2 }) },
  WORK_025b: { abilities: play({ e: 'buff', target: { t: 'self' }, hp: 2 }) },
  WORK_017: {
    handShift: { kind: 'swap', into: 'WORK_017t' },
    target: minion,
    abilities: play({ e: 'buff', target: chosen, keywords: ['IMMUNE'], temp: true }, { e: 'buff', target: chosen, atk: 2, hp: 2 }),
    tokens: ['WORK_017t'],
  },
  WORK_017t: {
    handShift: { kind: 'swap', into: 'WORK_017' },
    target: minion,
    abilities: play({ e: 'silence', target: chosen }, { e: 'buff', target: chosen, atk: -2, hp: -2 }),
  },
  WORK_030: {
    handShift: { kind: 'swap', into: 'WORK_030t' },
    target: minion,
    abilities: play(hit(3), { e: 'freeze', target: { t: 'adjacent', of: 'chosen' } }),
    tokens: ['WORK_030t'],
  },
  WORK_030t: {
    handShift: { kind: 'swap', into: 'WORK_030' },
    target: minion,
    abilities: play(hit(3), { e: 'damage', target: { t: 'adjacent', of: 'chosen' }, amount: 1, spell: true }),
  },
  WORK_050: { handShift: { kind: 'swap', into: 'WORK_050t' }, abilities: play(fn('Brochure', { type: 'MINION' })), tokens: ['WORK_050t'] },
  WORK_050t: { handShift: { kind: 'swap', into: 'WORK_050' }, abilities: play(fn('Brochure', { type: 'SPELL' })) },
  VAC_305: { abilities: play(summon('VAC_305t', 2)), tokens: ['VAC_305t'] },
  VAC_305t: { keywords: ['TAUNT'], abilities: dr({ e: 'armor', amount: 4 }) },
  VAC_518: {
    keywords: ['TAUNT'],
    abilities: dr({ e: 'draw', count: 1, who: 'self', pool: { type: 'MINION', keyword: 'TAUNT' } }, { e: 'costMod', scope: 'it', amount: -2 }),
  },
  VAC_949: { abilities: play(fn('NewHeights')) },
  VAC_950: { keywords: ['RUSH', 'TAUNT'], costIf: { cond: { c: 'maxMana', n: 10 }, cost: 1 } },
  VAC_956: { abilities: [{ on: { k: 'locationUsed', side: 'friendly' }, effects: [{ e: 'armor', amount: 3 }] }] },
  VAC_439: { costRule: { per: 'locationsUsed', amount: 2 } },
  WORK_041: { abilities: dr({ e: 'pendingDiscount', d: { type: 'LOCATION', amount: 2 } }) },
};

// 飲料的每一杯都是獨立法術；施放成功後才補下一杯。
for (const [id, next, last, effects, target, keywords] of [
  ['VAC_323', 'VAC_323t', 'VAC_323t2', [{ e: 'damage', target: { t: 'all', filter: { type: 'character', side: 'enemy' } }, amount: 1, spell: true }]],
  ['VAC_338', 'VAC_338t', 'VAC_338t2', [fn('Muscle')]],
  ['VAC_404', 'VAC_404t1', 'VAC_404t2', [hit(2), { e: 'damage', target: { t: 'hero', side: 'friendly' }, amount: 2, spell: true }], minion],
  ['VAC_520', 'VAC_520t', 'VAC_520t2', [{ e: 'splitDamage', filter: { type: 'minion', side: 'enemy' }, amount: 2, spell: true }]],
  ['VAC_916', 'VAC_916t2', 'VAC_916t3', [fn('DivineBrew')], anyChar],
  ['VAC_951', 'VAC_951t', 'VAC_951t2', [hit(3)], minion, ['LIFESTEAL']],
] as [string, string, string, Effect[], TargetReq?, 'LIFESTEAL'[]?][]) {
  PARADISE_OVERRIDES[id] = {
    target,
    keywords,
    abilities: play(...effects, { e: 'addCard', card: next, count: 1, who: 'self' }),
    tokens: [next, last],
  };
  PARADISE_OVERRIDES[next] = { target, keywords, abilities: play(...effects, { e: 'addCard', card: last, count: 1, who: 'self' }), tokens: [last] };
  PARADISE_OVERRIDES[last] = { target, keywords, abilities: play(...effects) };
}

for (const id of ['VAC_520', 'VAC_520t', 'VAC_520t2']) PARADISE_OVERRIDES[id].immuneToSpellpower = true;
