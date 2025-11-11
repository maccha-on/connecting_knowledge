import { NextRequest, NextResponse } from 'next/server';
import { appendEntry } from '@/lib/store';

import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';


/**
 * POST /api/save
 * ユーザーがAI提案を確認・修正後、
 * 最終的な説明・タグ・パス情報を data.json に追記保存する。
 */
export async function POST(req: NextRequest) {
  try {
    // --- リクエストボディの解析 ---
    const body = await req.json();
    const { description, tags, path } = body || {};

    // --- 入力バリデーション ---
    if (!description || !Array.isArray(tags) || !path) {
      return NextResponse.json({ error: 'invalid payload' }, { status: 400 });
    }

    // --- JSONファイルへの追記保存 ---
    const saved = await appendEntry({ description, tags, path });

    // 保存後に public/ にもコピー
    const src = path.join(process.cwd(), 'data', 'data.json');
    const dest = path.join(process.cwd(), 'public', 'data.json');
    await fs.copyFile(src, dest);

    return NextResponse.json({ ok: true, saved });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'save failed' }, { status: 500 });
  }
}
