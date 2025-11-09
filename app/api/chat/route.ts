import { NextRequest, NextResponse } from 'next/server';
import { readAll } from '@/lib/store';
import { topK } from '@/lib/search';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/chat
 * ユーザーの自然文による質問を受け取り、
 * data.json から関連性の高い文書を上位10件返す。
 */
export async function POST(req: NextRequest) {
  try {
    // --- クエリ（message）の取得 ---
    const { message } = await req.json();
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'message required' }, { status: 400 });
    }

    // --- data.json の読み込み ---
    const all = await readAll();

    // --- シンプルスコア検索（上位10件抽出） ---
    const hits = topK(message, all, 10);

    // --- 結果返却 ---
    return NextResponse.json({ hits });

  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message || 'chat failed' }, { status: 500 });
  }
}
