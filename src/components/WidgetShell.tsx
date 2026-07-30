'use client';

import { useState, useMemo } from 'react';
import { BookSidebar } from './BookSidebar';
import { ChatTimeline } from './ChatTimeline';
import { Composer } from './Composer';
import { StatusBanner } from './StatusBanner';
import { NotionClient, type Book, type Memo } from '@/api/notionClient';
import type { WidgetConfig } from '@/config';
import type { Book as LibBook, Memo as LibMemo } from '@/lib/notion';

interface Props {
  config: WidgetConfig;
  initialBooks: LibBook[];
  initialMemos: LibMemo[];
  initialError: string;
}

export function WidgetShell({ config, initialBooks, initialMemos, initialError }: Props) {
  const [books] = useState<Book[]>(initialBooks);
  const [memos, setMemos] = useState<Memo[]>(initialMemos as Memo[]);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [draggedMemoId, setDraggedMemoId] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'saving' | 'error'>(
    initialError ? 'error' : 'idle'
  );
  const [statusMessage, setStatusMessage] = useState(initialError || '동기화됨');

  const client = useMemo(() => new NotionClient(config), [config]);

  async function createMemo(text: string, type: string): Promise<boolean> {
    setSyncStatus('saving');
    try {
      const memo = await client.createMemo({ text, type, bookId: selectedBookId });
      setMemos((prev) => [...prev, memo]);
      setSyncStatus('idle');
      setStatusMessage('저장됨');
      return true;
    } catch (err) {
      setSyncStatus('error');
      setStatusMessage(err instanceof Error ? err.message : '저장 실패');
      return false;
    }
  }

  async function linkMemo(bookId: string) {
    if (!draggedMemoId) return;
    setDraggedMemoId(null);
    try {
      const updated = await client.linkMemoToBook({ memoId: draggedMemoId, bookId });
      setMemos((prev) => prev.map((m) => m.id === updated.id ? updated : m));
    } catch (err) {
      setSyncStatus('error');
      setStatusMessage(err instanceof Error ? err.message : '연결 실패');
    }
  }

  function handleWheel(e: React.WheelEvent) {
    const timeline = (e.currentTarget as HTMLElement).querySelector<HTMLElement>('.timeline');
    if (timeline) timeline.scrollTop += e.deltaY;
  }

  const selectedBookTitle = selectedBookId
    ? books.find((b) => b.id === selectedBookId)?.title
    : 'All Notes';

  return (
    <main className="widget-shell" aria-label="독서노트 위젯" onWheel={handleWheel}>
      <BookSidebar
        books={books}
        selectedBookId={selectedBookId}
        draggedMemoId={draggedMemoId}
        onSelectBook={setSelectedBookId}
        onDropMemo={(id) => { void linkMemo(id); }}
      />
      <section className="chat-panel">
        <header className="chat-header">
          <div>
            <span className="eyebrow">독서노트</span>
            <h1>{selectedBookTitle}</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StatusBanner message={statusMessage} tone={syncStatus} />
          </div>
        </header>
        <ChatTimeline
          books={books}
          memos={memos.map(m => ({ ...m, type: m.type as any, status: m.status as any }))}
          onDragStart={setDraggedMemoId}
          onDragEnd={() => setDraggedMemoId(null)}
          onEdit={async (memoId, newText) => {
            await client.updateMemo(memoId, newText);
            setMemos(prev => prev.map(m => m.id === memoId ? { ...m, text: newText } : m));
          }}
        />
        <Composer onSubmit={createMemo} />
      </section>
    </main>
  );
}
