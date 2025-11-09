import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promises as fs } from 'fs';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * アップロード先ディレクトリを作成するユーティリティ。
 * 存在しない場合のみ作成。
 */
async function ensureUploadsDir() {
  const dir = path.join(process.cwd(), 'public', 'uploads');
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

/**
 * POST /api/upload
 * ファイルを受け取り → 保存 → OpenAI APIで意味付け（説明・タグ）を生成。
 * 結果をJSONで返す。
 */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file' }, { status: 400 });
    }

    // --- ファイル保存処理 ---
    const originalName = file.name || 'upload.bin';
    const ext = path.extname(originalName) || '';
    const base = path.basename(originalName, ext)
      .slice(0, 80)
      .replace(/[^a-zA-Z0-9_\\-\\.]/g, '_');
    const safeName = `${base}_${Date.now()}${ext}`;

    const uploadsDir = await ensureUploadsDir();
    const outPath = path.join(uploadsDir, safeName);

    const ab = await file.arrayBuffer();
    const buf = Buffer.from(ab);
    await fs.writeFile(outPath, buf);

    // --- 内容のプレビュー取得（テキスト系のみ） ---
    let preview = '';
    const type = file.type || '';
    if ((type.startsWith('text/') || type === 'application/json') && buf.length <= 512 * 1024) {
      preview = buf.toString('utf-8').slice(0, 4000);
    }

    const publicPath = `/uploads/${safeName}`;

    // --- OpenAI に説明とタグを生成依頼 ---
    const prompt = [
      {
        role: 'system' as const,
        content: `あなたは企業内文書の司書AIです。以下のファイル情報から、\\n` +
          `(1) 詳細な説明（200〜400字）\\n(2) タグ（最大10件、日本語の名詞中心）\\n` +
          `をJSONで出力してください。フィールドは description, tags のみ。`,
      },
      {
        role: 'user' as const,
        content:
          `ファイル名: ${originalName}\\nMIME: ${type || 'unknown'}\\nサイズ: ${buf.length} bytes` +
          (preview ? `\\nプレビュー:\\n${preview}` : '\\n（バイナリのため内容プレビューなし）'),
      },
    ];

    const resp = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: prompt,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    // --- レスポンス解析 ---
    const raw = resp.choices[0]?.message?.content || '{}';
    let parsed: any = {};
    try { parsed = JSON.parse(raw); } catch {}
    const description: string = parsed.description || `"${originalName}" の説明（AI提案）`;
    const tags: string[] = Array.isArray(parsed.tags) ? parsed.tags : [];

    // --- 結果返却 ---
    return NextResponse.json({
      proposal: { description, tags, path: publicPath },
    });

  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e?.message || 'upload failed' }, { status: 500 });
  }
}
