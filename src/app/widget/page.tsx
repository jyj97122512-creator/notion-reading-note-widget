'use client';

import { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BookSidebar } from '@/components/BookSidebar';
import { ChatTimeline } from '@/components/ChatTimeline';
import { Composer } from '@/components/Composer';
import { SetupScreen } from '@/components/SetupScreen';
import { StatusBanner } from '@/components/StatusBanner';
import { NotionClient, type Book, type Memo } from '@/api/notionClient';
import { loadConfig, saveConfig, clearConfig, decodeEmbedParam } from '@/config';
import type { WidgetConfig } from '@/config';
import '../../styles.css';

function WidgetContent() {
  const searchParams = useSearchParams();
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [ready, setReady] = useState(false);
  const [books, setBooks] = useState<Book[]>([]);
  const [memos, setMemos] = useState<Memo[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [draggedMemoId, setDraggedMemoId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'saving' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('로딩 중...');

  useEffect(() => {
    const c = searchParams.get('c');
    const queryConfig = c ? decodeEmbedParam(c) : null;
    if (queryConfig) {
      saveConfig(queryConfig);
      history.replaceState(null, '', window.location.pathname);
      setConfig(queryConfig);
    } else {
      setConfig(loadConfig());
    }
    setReady(true);
  }, [searchParams]);

  const client = useMemo(() => config ? new NotionClient(config) : null, [config]);

  useEffect(() => {
    if (!client) return;
    setSyncStatus('loading');
    Promise.all([client.listBooks(), client.listMemos()])
      .then(([b, m]) => { setBooks(b); setMemos(m); setSyncStatus('idle'); setStatusMessage('동기화됨'); })
      .catch((err: unknown) => { setSyncStatus('error'); setStatusMessage(err instanceof Error ? err.message : '로드 실패'); });
  }, [client]);

  const visibleMemos = useMemo(() =>
    selectedBookId ? memos.filter((m) => m.bookId === selectedBookId) : memos,
    [memos, selectedBookId]
  );

  async function createMemo(text: string, type: string): Promise<boolean> {
    if (!client) return false;
    setSyncStatus('saving');
    try {
      const memo = await client.createMemo({ text, type, bookId: selectedBookId });
      setMemos((c) => [...c, memo]);
      setSyncStatus('idle'); setStatusMessage('저장됨');
      return true;
    } catch (err) {
      setSyncStatus('error'); setStatusMessage(err instanceof Error ? err.message : '저장 실패');
      return false;
    }
  }

  async function linkMemo(bookId: string) {
    if (!draggedMemoId || !client) return;
    setDraggedMemoId(null);
    try {
      const updated = await client.linkMemoToBook({ memoId: draggedMemoId, bookId });
      setMemos((c) => c.map((m) => m.id === updated.id ? updated : m));
    } catch (err) {
      setSyncStatus('error'); setStatusMessage(err instanceof Error ? err.message : '연결 실패');
    }
  }

  if (!ready) return null;

  if (!config) {
    return <SetupScreen onDone={() => setConfig(loadConfig())} />;
  }

  const selectedBookTitle = selectedBookId ? books.find((b) => b.id === selectedBookId)?.title : 'All Notes';

  void visibleMemos;

  return (
    <main className="widget-shell" aria-label="독서노트 위젯">
      <BookSidebar books={books} selectedBookId={selectedBookId} draggedMemoId={draggedMemoId}
        onSelectBook={setSelectedBookId} onDropMemo={(id) => { void linkMemo(id); }} />
      <section className="chat-panel">
        <header className="chat-header">
          <div>
            <span className="eyebrow">독서노트</span>
            <h1>{selectedBookTitle}</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StatusBanner message={statusMessage} tone={syncStatus} />
            <button style={resetBtn} title="설정 초기화" onClick={() => { clearConfig(); setConfig(null); }}>⚙️</button>
          </div>
        </header>
        <ChatTimeline books={books} memos={memos.map(m => ({ ...m, type: m.type as any, status: m.status as any }))}
          onDragStart={setDraggedMemoId} onDragEnd={() => setDraggedMemoId(null)} />
        <Composer onSubmit={createMemo} />
      </section>
    </main>
  );
}

export default function WidgetPage() {
  return (
    <Suspense fallback={null}>
      <WidgetContent />
    </Suspense>
  );
}

const resetBtn: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, padding: 4, opacity: 0.5 };
