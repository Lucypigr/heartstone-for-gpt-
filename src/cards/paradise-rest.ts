import { KAZAKUS_INGREDIENTS } from './kazakus';
import type { Override } from './overrides';
import type { Ability, Effect, TargetReq } from '../engine/types';
const play = (...effects: Effect[]): Ability[] => [{ on: { k: 'play' }, effects }];
const dr = (...effects: Effect[]): Ability[] => [{ on: { k: 'deathrattle' }, effects }];
const end = (...effects: Effect[]): Ability[] => [{ on: { k: 'turnEnd', whose: 'mine' }, effects }];
const fn = (name: string, args?: Record<string, unknown>): Effect => ({ e: 'custom', fn: `vac${name}`, args });
const chosen = { t: 'chosen' as const },
  self = { t: 'self' as const };
const minion: TargetReq = { filter: { type: 'minion', side: 'any' } };
const friendly: TargetReq = { filter: { type: 'minion', side: 'friendly' } };
const enemy: TargetReq = { filter: { type: 'minion', side: 'enemy' } };
const character: TargetReq = { filter: { type: 'character', side: 'any' } };
const enemies = { t: 'all' as const, filter: { type: 'character' as const, side: 'enemy' as const } };
const others = { t: 'all' as const, filter: { type: 'minion' as const, excludeSelf: true } };
const summon = (card: string, count = 1): Effect => ({ e: 'summon', card, count, who: 'self' });
const draw = (count: number): Effect => ({ e: 'draw', count, who: 'self' });
const hit = (amount: number): Effect => ({ e: 'damage', target: chosen, amount, spell: true });
const add = (card: string, count = 1): Effect => ({ e: 'addCard', card, count, who: 'self' });
const coin = add('GAME_005');
export const PARADISE_REST_OVERRIDES: Record<string, Override> = {
  VAC_301: {
    abilities: play({
      e: 'repeat',
      times: { dyn: 'spellSchools', base: 1 },
      effects: [{ e: 'summonRandom', pool: { type: 'MINION', cost: 5, anyClass: true }, count: 1, who: 'self' }],
    }),
  },
  VAC_304: { abilities: play(fn('Pupil')) },
  VAC_308: { abilities: play(fn('SirenSong')) },
  VAC_321: { abilities: [...play({ e: 'shuffle', card: 'VAC_321t', count: 5, who: 'self' }), ...end(fn('Incindius'))], tokens: ['VAC_321t'] },
  VAC_321t: { castsWhenDrawn: true, abilities: play(fn('Eruption')) },
  VAC_324: { target: minion, abilities: play({ e: 'evolve', target: chosen, amount: 1 }, { e: 'summonCopy', target: chosen, count: 1 }) },
  VAC_329: { abilities: play(fn('NaturalTalent')) },
  VAC_332: { abilities: play({ e: 'pendingDiscount', d: { amount: 2, otherClass: true } }) },
  VAC_333: { abilities: play(fn('Conman')) },
  VAC_335: { abilities: play({ e: 'addRandom', pool: { type: 'SPELL', cost: 1, otherClass: true }, count: 2, who: 'self' }) },
  VAC_337: { keywords: ['TRADEABLE', 'TAUNT'], abilities: [{ on: { k: 'drawn' }, effects: [add('VAC_337')] }] },
  VAC_339: { keywords: ['TAUNT'], abilities: end(fn('Muensterosity')), tokens: ['VAC_339t'] },
  VAC_341: { target: { ...enemy, optional: true }, abilities: play(fn('Calamari')) },
  VAC_406: { keywords: ['TAUNT'], abilities: dr(fn('SleepyResident')) },
  VAC_407: { abilities: play(fn('Macaw')) },
  VAC_408: { abilities: play(fn('Birdwatching')) },
  VAC_410: { target: { filter: { type: 'character', side: 'enemy' } }, abilities: play(fn('Fowls')), tokens: ['VAC_410t'] },
  VAC_410t: { flags: ['immuneAttacking'] },
  VAC_414: {
    abilities: play({
      e: 'cond',
      cond: { c: 'heroDamagedThisTurn' },
      then: [{ e: 'damage', target: enemies, amount: 3, spell: true }],
      else: [{ e: 'damage', target: enemies, amount: 2, spell: true }],
    }),
  },
  VAC_415: { abilities: play(fn('Sasquawk')) },
  VAC_416: { target: enemy, abilities: play(fn('DeathRoll')) },
  VAC_417: { target: enemy, abilities: play(fn('Sensory')) },
  VAC_418: { keywords: ['TAUNT'], costRule: { per: 'ownTurnHits', amount: 1 } },
  VAC_420: { abilities: play(fn('Fortunes')), tokens: ['VAC_420t'] },
  VAC_421: { abilities: play(fn('Zookeeper')), tokens: ['VAC_421t'] },
  VAC_423: { keywords: ['TAUNT'], abilities: play(fn('TwilightMedium')) },
  VAC_428: { target: minion, abilities: play(fn('Flow')) },
  VAC_431: { abilities: play(fn('UnderSea')) },
  VAC_432: { abilities: play(fn('ResortValet')) },
  VAC_438: { abilities: play({ e: 'discover', pool: { type: 'LOCATION', anyClass: true } }) },
  VAC_440: {},
  VAC_441: { abilities: [{ on: { k: 'draw', side: 'friendly' }, effects: [fn('PackageDealer')] }] },
  VAC_442: { target: { ...character, optional: true }, abilities: play({ e: 'damage', target: chosen, amount: { dyn: 'elementalStreak' } }) },
  VAC_443: { abilities: play(fn('Surfalopod')) },
  VAC_444: { abilities: play(fn('Overplanner')) },
  VAC_446: { abilities: end(fn('AFKay')) },
  VAC_447: { chargeIfNotStarting: true },
  VAC_449: { handTransformSchools: true, tokens: Array.from({ length: 21 }, (_, i) => `VAC_449t${i || ''}`) },
  VAC_457: { abilities: play(fn('RestInPeace')) },
  VAC_463: {},
  VAC_464: {
    abilities: play(fn('Eudora')),
    tokens: ['VAC_464t', ...Array.from({ length: 31 }, (_, i) => `VAC_464t${i + 1 === 1 ? '' : i + 1}`).filter((id) => id !== 'VAC_464t13')],
  },
  VAC_506: { abilities: play(fn('Lora')) },
  VAC_508: { abilities: play(fn('TrailMix')) },
  VAC_509: { abilities: play(fn('Tsunami')), tokens: ['CS2_033'] },
  VAC_511: { startsDormant: 2, abilities: end(fn('DozingDragon')), tokens: ['VAC_511t'] },
  VAC_512: {
    abilities: [
      { on: { k: 'damaged', subject: 'self' }, effects: [{ e: 'damage', target: { t: 'hero', side: 'friendly' }, amount: { dyn: 'eventAmount' } }] },
    ],
  },
  VAC_521: {
    keywords: ['TAUNT'],
    abilities: play({ e: 'cond', cond: { c: 'holding', type: 'SPELL', minCost: 5 }, then: [{ e: 'summonCopy', target: self, count: 1 }] }),
  },
  VAC_524: { abilities: play(fn('KingTide')) },
  VAC_525: { abilities: [...play(fn('Bread')), ...dr(fn('Bread'))], tokens: ['VAC_525t1', 'VAC_525t2'] },
  VAC_525t1: { unplayable: true },
  VAC_525t2: { abilities: play(fn('Sandwich')) },
  VAC_526: { target: minion, abilities: play(fn('Char')) },
  VAC_527: { keywords: ['RUSH', 'ELUSIVE'], damageCap: 1 },
  VAC_528: { abilities: play(fn('AllYouCanEat')) },
  VAC_529: { abilities: play(fn('Scrapbooking')) },
  VAC_531: { abilities: [{ on: { k: 'summon', side: 'enemy' }, effects: [fn('Bayfin')] }] },
  VAC_532: { abilities: [{ on: { k: 'attack', subject: 'friendlyMinion', after: true }, effects: [fn('Coconut')] }] },
  VAC_533: { abilities: play({ e: 'summon', card: 'VAC_533t', count: 1, who: 'opponent' }), tokens: ['VAC_533t'] },
  VAC_533t: { abilities: dr(fn('Entree')) },
  VAC_558: { costRule: { per: 'spellsOnCharacters', amount: 1 }, abilities: play(summon('VAC_558t', 3)), tokens: ['VAC_558t'] },
  VAC_700: {
    costRule: { per: 'otherClassPlayed', amount: 1 },
    abilities: play({ e: 'destroy', target: { t: 'random', filter: { type: 'minion', side: 'enemy' }, count: 2 } }),
  },
  VAC_701: { abilities: play(fn('Swordshiner')) },
  VAC_702: { abilities: play(fn('Marin')), tokens: ['VAC_702t', 'VAC_702t2', 'VAC_702t3', 'VAC_702t4'] },
  VAC_702t: { abilities: play(fn('Crown')) },
  VAC_702t2: { abilities: play(fn('Goblet')) },
  VAC_702t3: { abilities: play(fn('Wand')) },
  VAC_702t4: { keywords: ['TAUNT'], abilities: play(fn('GoldenKobold')) },
  VAC_917: { abilities: [...play(fn('DrawExtreme', { high: false })), ...dr(fn('DrawExtreme', { high: true }))] },
  VAC_919: { keywords: ['TAUNT'], abilities: play(fn('Lifeguard')) },
  VAC_920: {},
  VAC_921: { abilities: [{ on: { k: 'attack', subject: 'friendlyHero', after: true }, effects: [add('VAC_917t')] }], tokens: ['VAC_917t'] },
  VAC_917t: { target: minion, abilities: play({ e: 'buff', target: chosen, atk: 1, hp: 2 }) },
  VAC_922: { abilities: play(fn('LifesavingAura')), tokens: ['VAC_917t'] },
  VAC_923: {
    keywords: ['RUSH'],
    abilities: [{ on: { k: 'attack', subject: 'self', after: true }, effects: [fn('SancAzel')] }],
    tokens: ['VAC_923t'],
  },
  VAC_923t: { target: friendly, abilities: play(fn('SancAzelReturn')) },
  VAC_924: { abilities: play({ e: 'cond', cond: { c: 'control', race: 'PIRATE' }, then: [fn('Attendant')] }) },
  VAC_925: { abilities: play({ e: 'delayed', turns: 1, effects: [summon('VAC_T_PIRATE', 2)] }) },
  VAC_926: { abilities: play(fn('CliffDive')) },
  VAC_927: { abilities: [{ on: { k: 'attack', subject: 'friendlyMinion', after: true }, effects: [fn('Adrenaline')] }] },
  VAC_928: { abilities: play(draw(3), { e: 'cond', cond: { c: 'not', cond: { c: 'outcast' } }, then: [{ e: 'draw', count: 3, who: 'opponent' }] }) },
  VAC_931: { target: minion, abilities: play(fn('SkirtingDeath')) },
  VAC_932: {},
  VAC_933: { abilities: play({ e: 'shuffle', card: 'VAC_933t', count: 6, who: 'self' }), tokens: ['VAC_933t'] },
  VAC_933t: { castsWhenDrawn: true, abilities: play(summon('VAC_T_PIRATE')) },
  VAC_935: { abilities: play(fn('Suitcase')), tokens: ['VAC_935t', 'VAC_935t2'] },
  VAC_935t: { abilities: play(fn('Unpack')) },
  VAC_935t2: { abilities: play(fn('Unpack')) },
  VAC_936: { minionDamageMultiplier: 8 },
  VAC_938: { abilities: [{ on: { k: 'attack', subject: 'friendlyMinion' }, effects: [fn('Roughhouser')] }] },
  VAC_939: { target: friendly, abilities: play({ e: 'destroy', target: chosen }, draw(3)) },
  VAC_941: { abilities: play(fn('AnnounceDarkness')) },
  VAC_942: { abilities: play({ e: 'buff', target: self, atk: { dyn: 'heroDamageThisTurn' }, hp: { dyn: 'heroDamageThisTurn' } }) },
  VAC_943: { abilities: dr({ e: 'cond', cond: { c: 'not', cond: { c: 'opponentTurn' } }, then: [summon('VAC_943t')] }), tokens: ['VAC_943t'] },
  VAC_943t: { keywords: ['TAUNT'] },
  VAC_944: {
    target: minion,
    abilities: play({
      e: 'buff',
      target: chosen,
      atk: 3,
      hp: 3,
      abilities: [{ on: { k: 'turnStart', whose: 'mine' }, effects: [{ e: 'damage', target: { t: 'hero', side: 'friendly' }, amount: 3 }] }],
    }),
  },
  VAC_945: { abilities: play({ e: 'cond', cond: { c: 'ownTurnDamage', n: 8 }, then: [summon('VAC_945t')] }), tokens: ['VAC_945t'] },
  VAC_945t: { keywords: ['TAUNT'], abilities: dr(fn('Ourobos')) },
  VAC_947: { abilities: [...play({ e: 'buff', target: others, atk: -1, hp: -1 }), ...dr({ e: 'buff', target: others, atk: 1, hp: 1 })] },
  VAC_948: { abilities: play(fn('Hydration')) },
  VAC_952: { target: minion, abilities: play(hit(4), fn('Bonfire')) },
  VAC_953: { abilities: play(fn('RisingWaves')) },
  VAC_954: { abilities: play(fn('Headliner')) },
  VAC_955: { abilities: play(add('VAC_955t')), tokens: ['VAC_955t'] },
  VAC_955t: { handGrow: true, abilities: play(fn('Cheese')) },
  VAC_958: { abilities: dr(fn('Amalgam')) },
  VAC_959: {
    abilities: play(fn('Griftah')),
    tokens: [1, 5, 6, 7, 8, 9, 10].flatMap((n) => [`VAC_959t${String(n).padStart(2, '0')}`, `VAC_959t${String(n).padStart(2, '0')}t`]),
  },
  VAC_960: { abilities: [{ on: { k: 'attack', subject: 'friendlyHero', after: true }, effects: [fn('FishingRod')] }] },
  VAC_961: { abilities: play(fn('PetParrot')) },
  WORK_001: { abilities: play(fn('TrustFall')) },
  WORK_002: { abilities: play(fn('BusyBot')) },
  WORK_004: { abilities: play(fn('Espionage')) },
  WORK_006: { randomDial: true, abilities: play(fn('Robocaller')) },
  WORK_007: { keywords: ['TRADEABLE'], temporaryInHand: true, target: minion, abilities: play({ e: 'destroy', target: chosen }) },
  WORK_008: { abilities: play(fn('FinePrint')) },
  WORK_012: { abilities: play({ e: 'summonRandom', pool: { type: 'MINION', race: 'NAGA', anyClass: true }, count: 7, who: 'self' }) },
  WORK_014: { keywords: ['LIFESTEAL'], target: minion, abilities: play(hit(4), fn('DemonicDeal')) },
  WORK_015: { keywords: ['RUSH'], abilities: dr(fn('Peddler')) },
  WORK_018: { abilities: dr(summon('WORK_018t', 2)), tokens: ['WORK_018t'] },
  WORK_019: { keywords: ['TAUNT'], abilities: [{ on: { k: 'damaged', subject: 'self' }, effects: [coin] }], tokens: ['GAME_005'] },
  WORK_020: { abilities: play(fn('MonkeyBusiness')), tokens: ['EX1_014t'] },
  WORK_021: { abilities: play(fn('ReservedSpot')) },
  WORK_022: { abilities: play({ e: 'heroAttack', amount: 3 }, fn('PunchCard')) },
  WORK_023: { keywords: ['TAUNT'], abilities: [{ on: { k: 'damaged', subject: 'self' }, effects: [{ e: 'armor', amount: 3 }] }] },
  WORK_024: { abilities: play(add('WORK_024t', 2)), tokens: ['WORK_024t'] },
  WORK_024t: { keywords: ['TAUNT'], handStatGrow: { atk: 1, hp: 1 } },
  WORK_026: { abilities: play(fn('Burndown')) },
  WORK_027t1: {},
  WORK_027t2: {},
  WORK_027t3: {},
  WORK_031: { abilities: play(fn('Envoy')) },
  WORK_032: { abilities: play({ e: 'cond', cond: { c: 'heroDamagedThisTurn' }, then: [{ e: 'summonCopy', target: self, count: 1 }] }) },
  WORK_040: { abilities: [{ on: { k: 'draw', side: 'any' }, effects: [fn('Steward')] }] },
  WORK_042: { target: { ...friendly, optional: true }, abilities: play(fn('Cubicle')) },
  WORK_043: { abilities: play(fn('Dungar')) },
};

// 克蕾絲：兩種法術學派對應到官方的 21 種變形。
export const CABARET_PAIRS: [string, string][] = [
  ['ARCANE', 'FIRE'],
  ['ARCANE', 'FROST'],
  ['ARCANE', 'NATURE'],
  ['ARCANE', 'HOLY'],
  ['ARCANE', 'SHADOW'],
  ['ARCANE', 'FEL'],
  ['FIRE', 'FROST'],
  ['FIRE', 'NATURE'],
  ['FIRE', 'HOLY'],
  ['FIRE', 'SHADOW'],
  ['FIRE', 'FEL'],
  ['NATURE', 'FROST'],
  ['HOLY', 'FROST'],
  ['SHADOW', 'FROST'],
  ['FEL', 'FROST'],
  ['NATURE', 'HOLY'],
  ['NATURE', 'SHADOW'],
  ['NATURE', 'FEL'],
  ['HOLY', 'SHADOW'],
  ['HOLY', 'FEL'],
  ['FEL', 'SHADOW'],
];
const cabaretEffects: Record<string, Effect[]> = {
  ARCANE: [draw(2)],
  FIRE: [{ e: 'damage', target: { t: 'hero', side: 'enemy' }, amount: 6 }],
  FROST: [{ e: 'freeze', target: { t: 'random', filter: { type: 'minion', side: 'enemy' }, count: 3 } }],
  NATURE: [{ e: 'buff', target: self, atk: 2, hp: 2, keywords: ['TAUNT'] }],
  HOLY: [{ e: 'heal', target: { t: 'hero', side: 'friendly' }, amount: 6 }],
  SHADOW: [{ e: 'destroy', target: { t: 'random', filter: { type: 'minion', side: 'enemy' }, count: 2 } }],
  FEL: [{ e: 'damage', target: { t: 'all', filter: { type: 'minion', side: 'enemy' } }, amount: 2 }],
};
for (const [i, pair] of CABARET_PAIRS.entries())
  PARADISE_REST_OVERRIDES[`VAC_449t${i || ''}`] = { abilities: play(...pair.flatMap((school) => cabaretEffects[school])) };

// 尤多拉的戰利品。
Object.assign(PARADISE_REST_OVERRIDES, {
  VAC_464t: { quest: { kind: 'otherClassCard', goal: 3, reward: 'VAC_464t' } },
  VAC_464t2: { target: minion, abilities: play({ e: 'destroy', target: chosen }) },
  VAC_464t3: { target: minion, abilities: play({ e: 'buff', target: chosen, atk: 4, hp: 4, keywords: ['TAUNT'] }) },
  VAC_464t4: { abilities: [{ on: { k: 'attack', subject: 'friendlyHero' }, effects: [fn('Exorcisor')] }] },
  VAC_464t5: {
    abilities: play(
      { e: 'damage', target: { t: 'hero', side: 'enemy' }, amount: 8, spell: true },
      { e: 'freeze', target: { t: 'hero', side: 'enemy' } },
    ),
  },
  VAC_464t6: { target: { ...enemy, optional: true }, abilities: play(fn('Bubba')), tokens: ['GILA_400t'] },
  VAC_464t7: { target: minion, abilities: play(fn('HolyBook')) },
  VAC_464t8: { target: { ...minion, optional: true }, abilities: play(fn('Crusty')) },
  VAC_464t9: { abilities: play(draw(2), { e: 'armor', amount: 4 }) },
  VAC_464t10: { abilities: play(fn('Spyglass')) },
  VAC_464t11: { auras: [{ scope: 'self', dyn: { amount: 'spellsCastThisGame', atk: 1, hp: 1 } }] },
  VAC_464t12: { abilities: play({ e: 'evolve', target: { t: 'all', filter: { type: 'minion' } }, amount: 3 }) },
  VAC_464t14: { keywords: ['POISONOUS'], flags: ['immuneAttacking'] },
  VAC_464t15: {
    target: minion,
    abilities: play({ e: 'buff', target: chosen, keywords: ['RUSH', 'WINDFURY', 'DIVINE_SHIELD', 'LIFESTEAL', 'POISONOUS', 'TAUNT', 'STEALTH'] }),
  },
  VAC_464t16: {
    abilities: play(
      { e: 'silence', target: { t: 'all', filter: { type: 'minion', side: 'enemy' } } },
      { e: 'destroy', target: { t: 'all', filter: { type: 'minion', side: 'enemy' } } },
    ),
  },
  VAC_464t17: { abilities: play(summon('ULDA_008t', 3)), tokens: ['ULDA_008t'] },
  VAC_464t18: {
    abilities: play({
      e: 'buff',
      target: { t: 'all', filter: { type: 'minion', side: 'friendly' } },
      abilities: [
        {
          on: { k: 'deathrattle' },
          effects: [{ e: 'summonRandom', pool: { type: 'MINION', rarity: 'LEGENDARY', anyClass: true }, count: 1, who: 'self' }],
        },
      ],
    }),
  },
  VAC_464t19: { target: minion, abilities: play(fn('Reflections')) },
  VAC_464t20: { target: friendly, abilities: play({ e: 'buff', target: chosen, atk: 2, hp: 2 }, { e: 'summonCopy', target: chosen, count: 2 }) },
  VAC_464t21: { abilities: play(summon('GVG_110t', 7)), tokens: ['GVG_110t'] },
  VAC_464t22: { abilities: dr(summon('VAC_464t22')) },
  VAC_464t23: {
    abilities: play({
      e: 'repeat',
      times: 3,
      effects: [{ e: 'damage', target: { t: 'random', filter: { type: 'character', side: 'enemy' }, count: 1 }, amount: 8, spell: true }],
    }),
  },
  VAC_464t24: { costRule: { per: 'deathsThisGame', amount: 1 }, abilities: play({ e: 'damage', target: enemies, amount: 7, spell: true }) },
  VAC_464t25: { abilities: play(fn('AnnoyHorn')), tokens: ['GVG_085', 'BOT_270', 'BOT_267'] },
  VAC_464t26: { abilities: end({ e: 'summonCopy', target: self, count: 1 }) },
  VAC_464t27: {
    keywords: ['RUSH'],
    abilities: [
      {
        on: { k: 'attack', subject: 'self', after: true },
        effects: [
          { e: 'custom', fn: 'ifAttack', args: { minion: true, survive: true, then: [{ e: 'transform', target: self, card: 'VAC_464t27t' }] } },
        ],
      },
    ],
    tokens: ['VAC_464t27t'],
  },
  VAC_464t28: { target: minion, abilities: play(fn('VampiricFangs')) },
  VAC_464t29: {},
  VAC_464t30: { target: minion, abilities: play({ e: 'buff', target: chosen, atk: 3, hp: 3 }) },
  VAC_464t31: { abilities: [{ on: { k: 'attack', subject: 'friendlyHero', after: true }, effects: [{ e: 'damage', target: enemies, amount: 4 }] }] },
} satisfies Record<string, Override>);

for (const [n, kind] of [
  [1, 'Passions'],
  [5, 'Tracking'],
  [6, 'Critters'],
  [7, 'Warding'],
  [8, 'Energy'],
  [9, 'Mobility'],
  [10, 'Strides'],
] as const) {
  const id = `VAC_959t${String(n).padStart(2, '0')}`;
  const target = kind === 'Passions' ? enemy : kind === 'Warding' ? minion : undefined;
  PARADISE_REST_OVERRIDES[id] = { target, abilities: play(fn(`Amulet${kind}`, { phony: true })) };
  PARADISE_REST_OVERRIDES[`${id}t`] = { target: kind === 'Warding' ? character : target, abilities: play(fn(`Amulet${kind}`, { phony: false })) };
}

PARADISE_REST_OVERRIDES.VAC_523 = { abilities: play(fn('Mixologist')), tokens: ['VAC_523t', ...KAZAKUS_INGREDIENTS.CFM_621t11] };
PARADISE_REST_OVERRIDES.VAC_523t = {};
PARADISE_REST_OVERRIDES.WORK_027 = {
  abilities: play(fn('Zephrys')),
  tokens: ['WORK_027t1', 'WORK_027t2', 'WORK_027t3', 'EX1_334', 'EX1_303', 'EX1_408'],
};
PARADISE_REST_OVERRIDES.EX1_334 = { target: { filter: { type: 'minion', side: 'enemy', maxAttack: 3 } }, abilities: play(fn('AmuletPassions')) };
PARADISE_REST_OVERRIDES.EX1_303 = { target: friendly, abilities: play(fn('Shadowflame')) };
PARADISE_REST_OVERRIDES.EX1_408 = {
  target: character,
  abilities: play({ e: 'cond', cond: { c: 'heroHealth', op: '<=', n: 12 }, then: [hit(6)], else: [hit(4)] }),
};

PARADISE_REST_OVERRIDES.VAC_420t = { unplayable: true };
