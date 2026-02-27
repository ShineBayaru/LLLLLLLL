import { Term, Category } from './types';

export const CATEGORIES: Category[] = ['一般', 'ALJ専門', 'トヨタ用語', 'その他', '樹脂成型', '樹脂金型', '設計専門'];

export const CATEGORY_COLORS: Record<Category, string> = {
  '一般': 'bg-slate-500/20 text-slate-600 dark:text-slate-300 border-slate-500/30',
  'ALJ専門': 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
  'トヨタ用語': 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
  'その他': 'bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30',
  '樹脂成型': 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  '樹脂金型': 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
  '設計専門': 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30'
};

export const MOCK_TERMS: Term[] = [
  {
    id: 'TRM-001',
    goku: '射出成形',
    yomikata: 'しゃしゅつせいけい',
    tsushou: 'インジェクション',
    eigo: 'Injection Molding',
    imi: 'プラスチックなどの材料を加熱して溶かし、金型に送り込んで形を作る加工法。',
    categories: ['樹脂成型', '一般'],
    image: 'https://picsum.photos/seed/injection/400/300',
    lastEditedBy: 'Bat-Erdene',
    updatedAt: '2026-02-20',
    editHistory: [
      { author: 'Anu', date: '2026-02-18' },
      { author: 'Tuguldur', date: '2026-02-19' },
      { author: 'Bat-Erdene', date: '2026-02-20' }
    ]
  },
  {
    id: 'TRM-002',
    goku: 'キャビティ',
    yomikata: 'きゃびてぃ',
    tsushou: 'キャビ',
    eigo: 'Cavity',
    imi: '金型の凹部。成形品の表面側を形成する。',
    categories: ['樹脂金型', '設計専門'],
    image: 'https://picsum.photos/seed/cavity/400/300',
    lastEditedBy: 'Tuguldur',
    updatedAt: '2026-02-21',
    editHistory: [
      { author: 'Tuguldur', date: '2026-02-21' }
    ]
  },
  {
    id: 'TRM-003',
    goku: 'カンバン',
    yomikata: 'かんばん',
    tsushou: 'かんばん',
    eigo: 'Kanban',
    imi: '必要なものを、必要な時に、必要な量だけ生産するための指示書。',
    categories: ['トヨタ用語'],
    lastEditedBy: 'Anu',
    updatedAt: '2026-02-22',
    editHistory: [
      { author: 'Bat-Erdene', date: '2026-02-15' },
      { author: 'Anu', date: '2026-02-22' }
    ]
  },
  {
    id: 'TRM-004',
    goku: '図面',
    yomikata: 'ずめん',
    tsushou: 'ドローイング',
    eigo: 'Drawing',
    imi: '機械や建築物などの形状、寸法、材質などを表した図。',
    categories: ['設計専門', '一般'],
    lastEditedBy: 'Bat-Erdene',
    updatedAt: '2026-02-23',
    editHistory: [
      { author: 'Bat-Erdene', date: '2026-02-23' }
    ]
  }
];
