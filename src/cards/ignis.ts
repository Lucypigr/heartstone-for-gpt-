import type { CardDef } from '../engine/types';

export const IGNIS_BASES = ['TTN_060t', 'TTN_060t1', 'TTN_060t2'];
export const IGNIS_KEYWORDS = ['TTN_060t3', 'TTN_060t4', 'TTN_060t5', 'TTN_060t6', 'TTN_060t9'];
export const IGNIS_EFFECTS = [7, 8, 10, 12, 13];
export const ignisOption = (effect: number, tier: number) => `TTN_060t${effect}${['', 't', 't1'][tier]}`;

/** 合成武器的資料跟著那張手牌保存；不修改全域卡牌定義。 */
export function ignisWeaponDef(id: string, options: string[], getCard: (id: string) => CardDef): CardDef {
  const base = getCard(id);
  const parts = options.map(getCard);
  return {
    ...base,
    text: parts.map((p) => p.text).join('\n'),
    keywords: parts.flatMap((p) => p.keywords ?? []),
    flags: parts.flatMap((p) => p.flags ?? []),
    abilities: parts.flatMap((p) => p.abilities ?? []),
    target: parts.find((p) => p.target)?.target,
  };
}
