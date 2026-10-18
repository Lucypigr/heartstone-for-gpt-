// 《威茲邦的工作坊》第一批：微縮與巨大化，使用官方 Card ID／DBF ID。
// 本檔僅加入已驗證且效果可由引擎執行的卡；日後 cards.json 產生出相同 ID 時由 registry 優先採用產生版本。
// 微型／巨型版本是獨立的不可收藏卡，並保留本體的其他效果，但不再生成複製品。
import type { CardDef } from '../engine/types';

const miniaturizeLabel = '<b>微縮</b>';
const gigantifyLabel = '<b>巨大化</b>';

export const WORKSHOP_CARDS: CardDef[] = [
  {
    id: 'TOY_811', dbfId: 103633, name: '雌虎玩偶', nameEn: 'Tigress Plushy',
    text: `${miniaturizeLabel}\n<b>衝刺</b>、<b>生命竊取</b>、<b>聖盾術</b>`,
    type: 'MINION', cardClass: 'PALADIN', rarity: 'COMMON', set: 1897,
    cost: 3, attack: 3, health: 2, races: ['BEAST'],
    keywords: ['RUSH', 'LIFESTEAL', 'DIVINE_SHIELD'],
    collectible: true, miniaturize: 'TOY_811t',
  },
  {
    id: 'TOY_811t', dbfId: 103637, name: '雌虎玩偶', nameEn: 'Tigress Plushy',
    text: '<b>微型</b>\n<b>衝刺</b>、<b>生命竊取</b>、<b>聖盾術</b>',
    type: 'MINION', cardClass: 'PALADIN', rarity: 'COMMON', set: 1897,
    cost: 1, attack: 1, health: 1, races: ['BEAST'],
    keywords: ['RUSH', 'LIFESTEAL', 'DIVINE_SHIELD'], collectible: false,
  },
  {
    id: 'TOY_340', dbfId: 103327, name: '懷舊學徒', nameEn: 'Nostalgic Initiate',
    text: `${miniaturizeLabel}\n你第一次施放法術時，獲得+2/+2`,
    type: 'MINION', cardClass: 'NEUTRAL', rarity: 'COMMON', set: 1897,
    cost: 3, attack: 2, health: 3, collectible: true, miniaturize: 'TOY_340t1',
    abilities: [{ on: { k: 'spellCast', side: 'friendly' }, once: true,
      effects: [{ e: 'buff', target: { t: 'self' }, atk: 2, hp: 2 }] }],
  },
  {
    id: 'TOY_340t1', dbfId: 103329, name: '懷舊學徒', nameEn: 'Nostalgic Initiate',
    text: '<b>微型</b>\n你第一次施放法術時，獲得+2/+2',
    type: 'MINION', cardClass: 'NEUTRAL', rarity: 'COMMON', set: 1897,
    cost: 1, attack: 1, health: 1, collectible: false,
    abilities: [{ on: { k: 'spellCast', side: 'friendly' }, once: true,
      effects: [{ e: 'buff', target: { t: 'self' }, atk: 2, hp: 2 }] }],
  },
  {
    id: 'TOY_307', dbfId: 102784, name: '香甜陣雪元素', nameEn: 'Sweetened Snowflurry',
    text: `${miniaturizeLabel}\n<b>戰吼：</b>獲得2個隨機且暫時的冰霜法術`,
    type: 'MINION', cardClass: 'NEUTRAL', rarity: 'COMMON', set: 1897,
    cost: 3, attack: 3, health: 3, races: ['ELEMENTAL'],
    collectible: true, miniaturize: 'TOY_307t',
    abilities: [{ on: { k: 'play' },
      effects: [{ e: 'addRandom', pool: { type: 'SPELL', spellSchool: 'FROST' }, count: 2, who: 'self', temporary: true }] }],
  },
  {
    id: 'TOY_307t', dbfId: 102785, name: '香甜陣雪元素', nameEn: 'Sweetened Snowflurry',
    text: '<b>微型</b>\n<b>戰吼：</b>獲得2個隨機且暫時的冰霜法術',
    type: 'MINION', cardClass: 'NEUTRAL', rarity: 'COMMON', set: 1897,
    cost: 1, attack: 1, health: 1, races: ['ELEMENTAL'],
    collectible: false,
    abilities: [{ on: { k: 'play' },
      effects: [{ e: 'addRandom', pool: { type: 'SPELL', spellSchool: 'FROST' }, count: 2, who: 'self', temporary: true }] }],
  },
  {
    id: 'MIS_300', dbfId: 108615, name: '抱抱泰迪熊', nameEn: 'Snuggle Teddy',
    text: `${gigantifyLabel}\n<b>飄渺</b>、<b>生命竊取</b>、<b>嘲諷</b>`,
    type: 'MINION', cardClass: 'DRUID', rarity: 'COMMON', set: 1897,
    cost: 3, attack: 2, health: 4, races: ['BEAST'],
    keywords: ['ELUSIVE', 'LIFESTEAL', 'TAUNT'],
    collectible: true, gigantify: 'MIS_300t',
  },
  {
    id: 'MIS_300t', dbfId: 108616, name: '抱抱泰迪熊', nameEn: 'Snuggle Teddy',
    text: '<b>巨型</b>\n<b>飄渺</b>、<b>生命竊取</b>、<b>嘲諷</b>',
    type: 'MINION', cardClass: 'DRUID', rarity: 'COMMON', set: 1897,
    cost: 8, attack: 8, health: 8, races: ['BEAST'],
    keywords: ['ELUSIVE', 'LIFESTEAL', 'TAUNT'], collectible: false,
  },
  // Pro Gamer 的官方剪刀石頭布選項：只用於選擇視窗，不會進入收藏。
  { id: 'MIS_916a', dbfId: 106676, name: '石頭！', nameEn: 'Rock!', text: '如果你的對手出剪刀，你抽兩張卡牌', type: 'SPELL', cardClass: 'NEUTRAL', rarity: 'FREE', set: 1897, cost: 0, collectible: false },
  { id: 'MIS_916b', dbfId: 106677, name: '布！', nameEn: 'Paper!', text: '如果你的對手出石頭，你抽兩張卡牌', type: 'SPELL', cardClass: 'NEUTRAL', rarity: 'FREE', set: 1897, cost: 0, collectible: false },
  { id: 'MIS_916c', dbfId: 106678, name: '剪刀！', nameEn: 'Scissors!', text: '如果你的對手出布，你抽兩張卡牌', type: 'SPELL', cardClass: 'NEUTRAL', rarity: 'FREE', set: 1897, cost: 0, collectible: false },
];
