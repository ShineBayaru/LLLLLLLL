export type Category = '一般' | 'ALJ専門' | 'トヨタ用語' | 'その他' | '樹脂成型' | '樹脂金型' | '設計専門';
export type Language = 'JP' | 'MN' | 'ENG';

export interface Term {
  id: string;
  goku: string; // 語句
  yomikata: string; // 読み方
  tsushou: string; // 通称
  eigo: string; // 英語
  imi: string; // 意味
  categories: Category[]; // Updated to support multiple categories
  image?: string;
  lastEditedBy: string;
  updatedAt: string;
  editHistory?: { author: string; date: string }[];
}
