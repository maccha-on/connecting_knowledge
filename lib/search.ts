import type { DocEntry } from './store';

/**
 * テキストを単語単位に分割するユーティリティ関数。
 * 記号や句読点を除去し、空白区切りで分割して配列を返す。
 * （日本語でも、スペースや記号で区切られた語を簡易的に扱う）
 *
 * @param s - 対象文字列
 * @returns 分割されたトークン配列（全て小文字）
 */
function tokenize(s: string): string[] {
  return (s || '')
    .toLowerCase()
    .replace(/[\p{P}\p{S}]+/gu, ' ') // 句読点・記号類をスペースに変換
    .split(/\s+/)                    // 空白で分割
    .filter(Boolean);                // 空要素を除去
}

/**
 * 検索クエリと文書エントリの一致度スコアを計算する関数。
 * シンプルな一致回数ベースでスコアを算出し、タグ一致は重みを+0.5加算。
 *
 * @param query - ユーザーが入力した検索クエリ
 * @param entry - data.json の各ドキュメントエントリ
 * @returns 一致度スコア（数値が大きいほど関連度が高い）
 */
export function score(query: string, entry: DocEntry): number {
  const q = tokenize(query);
  const hay = tokenize(entry.description + ' ' + entry.tags.join(' '));
  if (q.length === 0 || hay.length === 0) return 0;

  const setHay = new Set(hay);
  let s = 0;

  // クエリ語が本文中に含まれる数をカウント
  for (const t of q) if (setHay.has(t)) s += 1;

  // タグに完全一致する語には追加の重み付け
  for (const t of q)
    if (entry.tags.map((x) => x.toLowerCase()).includes(t)) s += 0.5;

  return s;
}

/**
 * data.json 内の全ドキュメントから、クエリに最も一致する上位K件を抽出する関数。
 * 各エントリにスコアを付与して降順ソートし、スコアが0より大きいもののみ返す。
 *
 * @param query - 検索クエリ
 * @param docs - 検索対象のドキュメント配列
 * @param k - 返す最大件数（デフォルト: 10）
 * @returns 一致度の高い上位K件の DocEntry 配列
 */
export function topK(query: string, docs: DocEntry[], k = 10): DocEntry[] {
  return [...docs]
    .map((d) => ({ d, s: score(query, d) })) // 各文書にスコアを付与
    .filter((x) => x.s > 0)                  // スコア0以下は除外
    .sort((a, b) => b.s - a.s)               // スコア降順ソート
    .slice(0, k)                             // 上位K件を抽出
    .map((x) => x.d);                        // DocEntryのみ返す
}
