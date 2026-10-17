import { TITANS_ANOMALIES } from './anomalies';
import type { Override } from './overrides';
import type { Ability, Effect, TargetReq } from '../engine/types';
const fn = (name: string, args?: Record<string, unknown>): Effect => ({ e: 'custom', fn: `ttnRest${name}`, args });
const play = (...effects: Effect[]): Ability[] => [{ on: { k: 'play' }, effects }];
const dr = (...effects: Effect[]): Ability[] => [{ on: { k: 'deathrattle' }, effects }];
const end = (...effects: Effect[]): Ability[] => [{ on: { k: 'turnEnd', whose: 'mine' }, effects }];
const chosen = { t: 'chosen' as const }, self = { t: 'self' as const };
const friendly: TargetReq = { filter: { type: 'minion', side: 'friendly' } };
const minion: TargetReq = { filter: { type: 'minion', side: 'any' } };
const character: TargetReq = { filter: { type: 'character', side: 'any' } };
const enemies = { t: 'all' as const, filter: { type: 'character' as const, side: 'enemy' as const } };
const enemyMinions = { t: 'all' as const, filter: { type: 'minion' as const, side: 'enemy' as const } };
const draw = (count: number): Effect => ({ e: 'draw', count, who: 'self' });
const summon = (card: string, count = 1): Effect => ({ e: 'summon', card, count, who: 'self' });
const hit = (amount: number, spell = true): Effect => ({ e: 'damage', target: chosen, amount, spell });
const five = (...then: Effect[]): Effect => ({ e: 'cond', cond: { c: 'spellsCast', n: 5 }, then });
export const TITANS_REST_OVERRIDES: Record<string, Override> = {
  TTN_071: { spellDamage: 1 },
  TTN_078: { abilities: [{ on: { k: 'summon', side: 'friendly' }, effects: [fn('Observer')] }] },
  TTN_079: { target: friendly, abilities: play({ e: 'buff', target: chosen, atk: 2 }, fn('Excess')) },
  TTN_080: { keywords: ['RUSH'], abilities: play(fn('Stablehand')) },
  TTN_081: { abilities: play({ e: 'addCard', card: 'TTN_081t', count: 3, who: 'self' }), tokens: ['TTN_081t'] },
  TTN_083: { abilities: play({ e: 'shuffle', card: 'TTN_083t', count: 4, who: 'self' }), tokens: ['TTN_083t'] },
  TTN_083t: { summonedWhenDrawn: true },
  TTN_085: { costRule: { per: 'spellSchools', amount: 1 }, abilities: play(draw(2)) },
  TTN_088: { costRule: { per: 'secretsTriggered', amount: 1 } },
  TTN_095: { abilities: play({ e: 'pendingDiscount', d: { race: 'ELEMENTAL', amount: 2 } }) },
  TTN_317: { abilities: play(fn('Reflexes')) },
  TTN_330: { keywords: ['RUSH'], abilities: [{ on: { k: 'attack', subject: 'self' }, effects: [fn('Kologarn')] }, ...dr(fn('KologarnReturn'))] },
  TTN_401: {},
  TTN_441: { abilities: play(fn('Constellation')) },
  TTN_460: { abilities: play(fn('Eradication')) },
  TTN_462: { costRule: { per: 'ownTurnDamage', amount: 1 } },
  TTN_463: { abilities: play(fn('WingWelding')) },
  TTN_466: { keywords: ['RUSH'], abilities: [{ on: { k: 'dealtDamage' }, effects: [{ e: 'armor', amount: { dyn: 'eventAmount' } }] }] },
  TTN_468: { abilities: play({ e: 'draw', count: 1, who: 'self', pool: { type: 'SPELL' } }, fn('SteamGuardian')) },
  TTN_469: { abilities: play(fn('Armorer')) },
  TTN_470: { abilities: play(summon('TTN_470t', 5)), tokens: ['TTN_470t'] },
  TTN_470t: { keywords: ['RUSH'], abilities: dr({ e: 'buff', target: { t: 'all', filter: { type: 'minion', side: 'friendly', nameIncludes: "Val'kyr Champion", excludeSelf: true } }, atk: 1, hp: 1 }) },
  TTN_475: { abilities: play(draw(1), { e: 'draw', count: { dyn: 'elementalsLastTurn' }, who: 'self' }) },
  TTN_476: { abilities: play(fn('DiscoveryMagic')) },
  TTN_478: { abilities: play({ e: 'damage', target: enemyMinions, amount: { dyn: 'spellSchools' } }) },
  TTN_480: { abilities: play(fn('Vortices')), tokens: Array.from({length: 8}, (_, i) => `TTN_480t${i || ''}`) },
  TTN_481: { keywords: ['TAUNT'], abilities: dr(fn('Raden')) },
  TTN_482: { abilities: dr(fn('Student')) },
  TTN_483: { abilities: play(fn('Serenity')) },
  TTN_484: { abilities: play({ e: 'discover', pool: { type: 'MINION', rarity: 'LEGENDARY', classes: ['PRIEST'], past: true } }) },
  TTN_485: { abilities: play(fn('StarsAlign')) },
  TTN_487: { abilities: play(fn('Loken')), tokens: ['TTN_487t'] },
  TTN_487t: { keywords: ['TAUNT'] },
  TTN_503: { abilities: play(fn('ChooseBoth')) },
  TTN_711: { keywords: ['TAUNT'], abilities: [{ on: { k: 'attacked', before: true }, effects: [draw(1)] }] },
  TTN_712: { abilities: play(fn('Seeker')) },
  TTN_713: { keywords: ['RUSH'], atkIf: { cond: { c: 'not', cond: { c: 'opponentTurn' } }, atk: 4 } },
  TTN_714: { abilities: play({ e: 'discover', pool: { type: 'WEAPON', anyClass: true } }) },
  TTN_715: { keywords: ['TAUNT'], abilities: [{ on: { k: 'drawn' }, effects: [{ e: 'addRandom', pool: { type: 'MINION', race: 'DRAGON', anyClass: true }, count: 1, who: 'self' }] }] },
  TTN_717: { abilities: play({ e: 'replaceHeroPower', power: 'TTN_717t' }), tokens: ['TTN_717t2', 'TTN_717t3'] },
  TTN_717t2: {}, TTN_717t3: {},
  TTN_718: { abilities: play(fn('Whelp')) },
  TTN_722: { overload: 1, abilities: play({ e: 'heroAttack', amount: 3 }, summon('TTN_833t')), tokens: ['TTN_833t'] },
  TTN_723: { abilities: play({ e: 'draw', count: 1, who: 'self', pool: { type: 'MINION', race: 'MECHANICAL' } }, { e: 'pendingDiscount', d: { race: 'MECHANICAL', amount: 2 } }) },
  TTN_725: { abilities: [{ on: { k: 'attack', subject: 'friendlyHero', after: true }, effects: [fn('Hammer')] }] },
  TTN_726: { target: minion, abilities: play(fn('TarSlick'), hit(1)) },
  TTN_727: { keywords: ['RUSH'], abilities: [{ on: { k: 'attack', subject: 'self' }, effects: [fn('Thorignir')] }], tokens: ['TTN_727t'] },
  TTN_728: { abilities: play(fn('PitStop')) },
  TTN_731: { abilities: [{ on: { k: 'draw', side: 'friendly' }, effects: [fn('Careless')] }] },
  TTN_733: { keywords: ['RUSH'], abilities: [{ on: { k: 'attack', subject: 'self', after: true }, effects: [{ e: 'custom', fn: 'ifAttack', args: { killed: true, minion: true, then: [{ e: 'fullHeal', target: self }] } }] }] },
  TTN_741: { handShift: { kind: 'opponentDeck' } },
  TTN_742: { target: { ...friendly, optional: true }, abilities: play(fn('Projectionist')) },
  TTN_744: { abilities: play(draw(2), fn('FrozenOver')) },
  TTN_745: { target: character, abilities: play(fn('Grace')) },
  TTN_752: { abilities: play(fn('Hodir')) },
  TTN_803: { abilities: play(fn('Smelt')) },
  TTN_811: { abilities: play(fn('Odyn')) },
  TTN_812: { abilities: [{ on: { k: 'attack', subject: 'self', after: true }, effects: [{ e: 'addCard', card: 'TTN_812t', count: 1, who: 'self' }] }], tokens: ['TTN_812t'] },
  TTN_830: { abilities: play(draw(1), fn('FlashLightning')) },
  TTN_831: { costRule: { per: 'natureThisTurn', amount: 1 }, abilities: play({ e: 'damage', target: enemies, amount: 3, spell: true }) },
  TTN_833: { abilities: end(fn('GolgannethDisciple')) },
  TTN_835: { abilities: play(fn('Thorim')) },
  TTN_840: { keywords: ['RUSH', 'DORMANT'], abilities: [{ on: { k: 'draw', side: 'friendly' }, effects: [fn('Statue')] }] },
  TTN_842: { abilities: play(fn('Jotun')) },
  TTN_844: { atkPer: { dyn: 'drawnThisTurn' } },
  TTN_845: { abilities: play(fn('RunicAdornment')) },
  TTN_850: { abilities: play(fn('Helya')), tokens: ['TTN_450t', 'TTN_450t2', 'TTN_450t3'] },
  TTN_854: { abilities: play(fn('InventorAura')) },
  TTN_856: { abilities: end(summon('TTN_900t')), tokens: ['TTN_900t'] },
  TTN_857: { abilities: play(fn('Tyr')) },
  TTN_859: { abilities: dr(fn('FateSplitter')) },
  TTN_861: { abilities: dr(summon('TTN_862t4', 2)), tokens: ['TTN_862t4'] },
  TTN_900: { abilities: dr(summon('TTN_900t')), tokens: ['TTN_900t'] },
  TTN_900t: {},
  TTN_907: { abilities: end(fn('Serpent')) },
  TTN_920: { abilities: [{ on: { k: 'cardPlayed', side: 'friendly', race: 'MECHANICAL' }, effects: [fn('Mimiron')] }], tokens: [5,6,7,8,9,10].map(n => `TTN_920t${n}`) },
  TTN_920t5: { abilities: play({ e: 'pendingDiscount', d: { amount: 2, thisTurn: true } }) },
  TTN_920t6: { target: friendly, abilities: play({ e: 'buff', target: chosen, atk: 3 }, { e: 'buff', target: chosen, keywords: ['STEALTH'], untilNextTurn: true }) },
  TTN_920t7: { target: minion, abilities: play(fn('Switch')) },
  TTN_920t8: { target: minion, abilities: play({ e: 'buff', target: chosen, keywords: ['TAUNT', 'DIVINE_SHIELD'] }) },
  TTN_920t9: { target: minion, abilities: play({ e: 'returnToHand', target: chosen }) },
  TTN_920t10: { target: character, abilities: play(hit(3)) },
  TTN_922: { abilities: play(fn('GearShift'), draw(3)) },
  TTN_924: {},
  TTN_925: { abilities: play({ e: 'discover', pool: { type: 'SPELL', otherClass: true, maxCost: 3 } }) },
  TTN_930: { blossom: { turns: 3, into: 'TTN_930t' }, abilities: play(draw(1), { e: 'armor', amount: 5 }), tokens: ['TTN_930t'] },
  TTN_930t: { abilities: play(draw(2), { e: 'armor', amount: 10 }) },
  TTN_932: { target: friendly, abilities: play(fn('Consumption')) },
  TTN_950: { blossom: { turns: 2, into: 'TTN_950t3' }, abilities: play(summon('TTN_950t', 2)), tokens: ['TTN_950t', 'TTN_950t2', 'TTN_950t3'] },
  TTN_950t3: { abilities: play(summon('TTN_950t2', 2)), tokens: ['TTN_950t2'] },
  TTN_954: { costRule: { per: 'treantsSummoned', amount: 1 }, abilities: play({ e: 'buff', target: { t: 'all', filter: { type: 'minion', side: 'friendly' } }, atk: 2, hp: 2 }) },
  YOG_082: { target: character, abilities: play(hit(3), fn('CelestialShot')) },
  YOG_300: { abilities: play(fn('Kvaldir')) },
  YOG_301: { abilities: play(fn('Insanity')) },
  YOG_401: { abilities: play({ e: 'delayed', turns: 1, effects: [draw(3)] }) },
  YOG_402: { target: { ...character, optional: true }, abilities: play({ e: 'damage', target: chosen, amount: { dyn: 'drawnThisTurn' } }) },
  YOG_410: { abilities: play({ e: 'discover', pool: { type: 'MINION', race: 'MECHANICAL', otherClass: true } }) },
  YOG_411: { abilities: play(five({ e: 'damage', target: enemies, amount: 2 })) },
  YOG_500: { keywords: ['RUSH'], abilities: [...play({ e: 'armor', amount: 4 }), ...dr(fn('Vezax'))] },
  YOG_501: { target: { filter: { type: 'minion', side: 'any', damaged: true }, optional: true }, abilities: play({ e: 'custom', fn: 'coFaceless' }) },
  YOG_503: { abilities: play(fn('CurseFlesh')) },
  YOG_505: { abilities: play(fn('BestialMadness')) },
  YOG_506: { keywords: ['RUSH'], abilities: dr(fn('Frostwing')), tokens: ['YOG_506t'] },
  YOG_507: { abilities: play(fn('VoidScripture')) },
  YOG_508: { target: character, abilities: play(fn('Torrent')) },
  YOG_509: { target: friendly, abilities: play({ e: 'buff', target: chosen, atk: 2, hp: 2 }, fn('KeeperStrength')) },
  YOG_510: { abilities: dr(fn('Securitybot')) },
  YOG_518: { abilities: play(five(draw(2))) },
  YOG_520: { abilities: [{ on: { k: 'minionDied', side: 'friendly', race: 'UNDEAD' }, effects: [{ e: 'damage', target: { t: 'hero', side: 'enemy' }, amount: 2 }, { e: 'addRandom', pool: { type: 'SPELL', spellSchool: 'SHADOW', classes: ['PRIEST'] }, count: 1, who: 'self' }] }] },
  YOG_521: { abilities: play(five({ e: 'heroAttack', amount: 4 })) },
  YOG_522: { abilities: play(fn('Conductivity')) },
  YOG_524: { abilities: play({ e: 'addRandom', pool: { overload: true, anyClass: true }, count: 1, who: 'self' }) },
  YOG_528: { abilities: play(five({ e: 'mana', kind: 'refresh', amount: 4 })) },
};

const choiceText: Record<string, [string, string]> = {
  TTN_926a: ['樹人增長', '召喚三個2/2樹人'],
  TTN_926b: ['古樹增長', '將你的樹人變形為有<b>嘲諷</b>的5/5古樹'],
  TTN_940a: ['生命守護者', '召喚全部其他友方手下的分身'],
  TTN_940b: ['未來種子', '複製你的手牌'],
  TTN_955A: ['生命守縛者的綻放', '獲得2張隨機自然法術'],
  TTN_955B: ['生命守縛者的成長', '使你手中的法術消耗減少(1)'],
  YOG_529a: ['罪惡樣品', '花費你的所有法力。本回合獲得等量攻擊力'],
  YOG_529b: ['拒絕誘惑', '花費你的所有法力。獲得雙倍護甲值'],
};
const option = (id: string, _name: string, ...effects: Effect[]) => ({ id, name: choiceText[id][0], text: choiceText[id][1], abilities: play(...effects) });
Object.assign(TITANS_REST_OVERRIDES, {
  TTN_926: { chooseOne: [option('TTN_926a', '召喚三個樹人', summon('TTN_950t2', 3)), option('TTN_926b', '將你的樹人變形成古樹', fn('Ancients'))], tokens: ['TTN_950t2', 'TRL_341t'] },
  TTN_927: { target: { filter: { type: 'minion', side: 'friendly', nameIncludes: 'Treant' }, optional: true }, abilities: play(fn('Nymph')), tokens: ['TRL_341t'] },
  TTN_940: { chooseOne: [option('TTN_940b', '複製你的手牌', fn('DuplicateHand')), option('TTN_940a', '召喚其他友方手下的複製', fn('DuplicateBoard'))] },
  TTN_955: { chooseOne: [option('TTN_955A', '獲得兩張自然法術', { e: 'addRandom', pool: { type: 'SPELL', spellSchool: 'NATURE' }, count: 2, who: 'self' }), option('TTN_955B', '手牌法術消耗減少一點', fn('GiftDiscount'))] },
  YOG_529: { chooseOne: [option('YOG_529a', '消耗所有法力並獲得攻擊力', fn('FruitAttack')), option('YOG_529b', '消耗所有法力並獲得護甲', fn('FruitArmor'))] },
} satisfies Record<string, Override>);
for (const [i, keyword] of (['DIVINE_SHIELD','TAUNT','RUSH','WINDFURY','ELUSIVE','POISONOUS','LIFESTEAL','REBORN'] as const).entries()) TITANS_REST_OVERRIDES[`TTN_480t${i || ''}`] = { keywords: [keyword] };

TITANS_REST_OVERRIDES.YOG_530 = { keywords: ['TAUNT', 'LIFESTEAL'], startOfGame: 'ttnChoGall', tokens: [...TITANS_ANOMALIES, 'OG_134', 'OG_123', 'TTN_922'] };
for (const id of TITANS_ANOMALIES) TITANS_REST_OVERRIDES[id] = {};

TITANS_REST_OVERRIDES.OG_134 = { abilities: play(fn('OldYogg')) };
TITANS_REST_OVERRIDES.OG_123 = { handShift: { kind: 'randomMinion' } };

TITANS_REST_OVERRIDES.TTN_843 = { abilities: [{ on: { k: 'draw', side: 'friendly' }, effects: [summon('TTN_843t1')] }], tokens: ['TTN_843t1'] };
