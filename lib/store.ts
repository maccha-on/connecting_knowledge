import { promises as fs } from 'fs';
import path from 'path';

/**
 * data.json に保存される 1件分のドキュメント情報を表す型。
 */
export type DocEntry = {
  id: number;          // 一意の連番ID
  description: string; // 文書の説明（AI or ユーザー入力）
  tags: string[];      // 文書の分類・テーマを表すタグ配列
  path: string;        // ファイルの相対パス（例: /uploads/sample.pdf）
};

/**
 * data.json のファイルパス。
 * Vercel 環境では一時的に /data/data.json を使用。
 */
const DATA_PATH = path.join(process.cwd(), 'data', 'data.json');

/**
 * data.json 全体を読み込み、DocEntry配列として返す関数。
 * - ファイルが存在しない場合は空配列を返す。
 * - JSON構文エラーの場合は例外をスロー。
 *
 * @returns DocEntry[] - 全ドキュメントエントリの配列
 */
export async function readAll(): Promise<DocEntry[]> {
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf-8');
    const json = JSON.parse(raw);
    if (Array.isArray(json)) return json as DocEntry[];
    return [];
  } catch (e: any) {
    // ファイルが存在しない場合は空配列を返す（初回起動時など）
    if (e.code === 'ENOENT') return [];
    throw e;
  }
}

/**
 * 新しいドキュメントエントリを data.json に追記保存する関数。
 * - 既存データを全件読み込み、IDを自動採番して追加。
 * - 書き込み後、保存したエントリを返す。
 *
 * @param input - idを除く新規エントリ情報（description, tags, path）
 * @returns 保存されたDocEntry（id付き）
 */
export async function appendEntry(input: Omit<DocEntry, 'id'>): Promise<DocEntry> {
  // 現在の全データを読み込み
  const all = await readAll();

  // 次のIDを決定（末尾のID + 1）
  const nextId = (all.at(-1)?.id ?? 0) + 1;

  // 保存用の新規エントリを作成
  const entry: DocEntry = { id: nextId, ...input };

  // data.json に書き戻し（整形済みJSONで保存）
  await fs.writeFile(DATA_PATH, JSON.stringify([...all, entry], null, 2), 'utf-8');

  return entry;
}
