'use client';
import React, { useRef, useState } from 'react';

type Msg = { role: 'user' | 'assistant' | 'system'; content: React.ReactNode };

/**
 * Chatコンポーネント
 * ----------------------------------------
 * 中央にチャットログ、下部に入力フォームとファイル添付。
 * ファイル送信時はAIが提案（説明＋タグ）を返し、編集後に保存可能。
 * チャット入力時はdata.jsonを検索して関連資料を返す。
 */
export default function Chat() {
  // --- ステート定義 ---
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: 'ファイルを送ると、AIが説明とタグを提案します。質問だけでもOKです。' },
  ]);
  const [input, setInput] = useState('');
  const fileRef = useRef<HTMLInputElement | null>(null);

  // AI提案内容（編集フォームに表示）
  const [proposalDesc, setProposalDesc] = useState('');
  const [proposalTags, setProposalTags] = useState<string>('');
  const [proposalPath, setProposalPath] = useState('');

  /**
   * handleSend()
   * 送信ボタン押下時のメイン処理。
   * - ファイルがある場合: /api/upload に送信 → AI提案表示
   * - テキストのみ: /api/chat に送信 → 検索結果表示
   */
  async function handleSend(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    const file = fileRef.current?.files?.[0];
    if (!text && !file) return;

    if (text) setMessages((m) => [...m, { role: 'user', content: text }]);

    try {
      // --- (A) ファイルアップロード処理 ---
      if (file) {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'upload failed');

        // AI提案内容をフォームに反映
        setProposalDesc(json.proposal.description || '');
        setProposalTags((json.proposal.tags || []).join(', '));
        setProposalPath(json.proposal.path || '');

        // チャット欄にAIメッセージ追加
        setMessages((m) => [
          ...m,
          {
            role: 'assistant',
            content: (
              <div className="space-y-2">
                <div className="text-sm text-gray-700">
                  AIの提案です。必要なら編集して「保存」してください。
                </div>
                <a
                  className="text-blue-600 underline"
                  href={json.proposal.path}
                  target="_blank"
                  rel="noreferrer"
                >
                  アップロード済みファイルを確認
                </a>
              </div>
            ),
          },
        ]);
      }

      // --- (B) チャット問い合わせ処理 ---
      if (text && !file) {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || 'chat failed');

        // 検索結果の表示
        if ((json.hits || []).length === 0) {
          setMessages((m) => [...m, { role: 'assistant', content: '該当しそうな資料は見つかりませんでした。' }]);
        } else {
          setMessages((m) => [
            ...m,
            {
              role: 'assistant',
              content: (
                <div className="space-y-2">
                  <div>候補の資料:</div>
                  <ul className="list-disc pl-5">
                    {json.hits.map((h: any) => (
                      <li key={h.id}>
                        <div className="font-medium">
                          ID {h.id}:{' '}
                          <a
                            className="text-blue-600 underline"
                            href={h.path}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {h.path}
                          </a>
                        </div>
                        <div className="text-sm text-gray-700">{h.description}</div>
                        <div className="text-xs text-gray-500">タグ: {(h.tags || []).join(', ')}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              ),
            },
          ]);
        }
      }
    } catch (e: any) {
      setMessages((m) => [...m, { role: 'assistant', content: `エラー: ${e?.message || e}` }]);
    } finally {
      setInput('');
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  /**
   * handleSaveProposal()
   * 提案編集フォームの「保存」ボタン押下時の処理。
   * data.json に追記保存し、ID付きで保存完了メッセージを表示。
   */
  async function handleSaveProposal() {
    try {
      const tagsArray = proposalTags
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, 10); // タグ上限10件

      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: proposalDesc, tags: tagsArray, path: proposalPath }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'save failed');

      setMessages((m) => [...m, { role: 'assistant', content: `保存しました（ID: ${json.saved.id}）` }]);

      // 入力フォームをリセット
      setProposalDesc('');
      setProposalTags('');
      setProposalPath('');
    } catch (e: any) {
      setMessages((m) => [...m, { role: 'assistant', content: `保存エラー: ${e?.message || e}` }]);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      {/* タイトル */}
      <div className="text-2xl font-semibold mb-4">Connecting Knowledge</div>

      {/* チャットログ */}
      <div className="border rounded-xl p-4 min-h-[360px] bg-gray-50 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
            <div
              className={
                'inline-block px-3 py-2 rounded-xl ' +
                (m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 border')
              }
            >
              {m.content}
            </div>
          </div>
        ))}

        {/* AI提案編集フォーム（ファイル送信時のみ表示） */}
        {proposalPath && (
          <div className="bg-white border rounded-xl p-3 space-y-2">
            <div className="font-medium">AIの提案（編集可）</div>

            <label className="block text-sm text-gray-600">説明</label>
            <textarea
              className="w-full border rounded p-2 text-sm"
              rows={4}
              value={proposalDesc}
              onChange={(e) => setProposalDesc(e.target.value)}
            />

            <label className="block text-sm text-gray-600">タグ（カンマ区切り・上限10件）</label>
            <input
              className="w-full border rounded p-2 text-sm"
              value={proposalTags}
              onChange={(e) => setProposalTags(e.target.value)}
              placeholder="設計, 通信, 仕様書"
            />

            <div className="text-xs text-gray-500">保存対象パス: {proposalPath}</div>
            <button
              onClick={handleSaveProposal}
              className="mt-2 px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700"
            >
              保存
            </button>
          </div>
        )}
      </div>


      {/* 入力フォーム */}
      <form onSubmit={handleSend} className="mt-4 flex flex-col gap-2">
        <textarea
          className="w-full border rounded p-2"
          placeholder="質問を入力、またはファイルを添付して送信"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={3}
        />
        <div className="flex items-center gap-3">
          <input ref={fileRef} type="file" className="block" />
          <button type="submit" className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700">
            送信
          </button>
          {/* data.json ダウンロードリンク */}
          <a
            href="/data/data.json"
            download
            className="text-blue-600 underline text-sm hover:text-blue-800 ml-auto"
          >
            dataをダウンロード
          </a>
        </div>
      </form>
    </div>
  );
}