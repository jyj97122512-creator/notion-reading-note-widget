'use client';

import { useState, useRef, useEffect } from "react";
import type { Book, Memo } from "../types";

interface ChatTimelineProps {
  books: Book[];
  memos: Memo[];
  onDragStart(memoId: string): void;
  onDragEnd(): void;
  onEdit(memoId: string, newText: string): Promise<void>;
}

export function ChatTimeline({ books, memos, onDragStart, onDragEnd, onEdit }: ChatTimelineProps) {
  const bookTitles = new Map(books.map((book) => [book.id, book.title]));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [saving, setSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editingId && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.selectionStart = textareaRef.current.value.length;
    }
  }, [editingId]);

  function startEdit(memo: Memo) {
    setEditingId(memo.id);
    setEditText(memo.text);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditText("");
  }

  async function confirmEdit() {
    if (!editingId || !editText.trim() || saving) return;
    setSaving(true);
    try {
      await onEdit(editingId, editText.trim());
    } finally {
      setSaving(false);
      setEditingId(null);
      setEditText("");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void confirmEdit();
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  }

  return (
    <section className="timeline" aria-label="독서 메모">
      <div className="date-pill">Today</div>
      {memos.map((memo) => (
        <article
          key={memo.id}
          className={`memo-bubble ${memo.type === "passage" ? "bubble-passage" : "bubble-thought"}`}
          draggable={editingId !== memo.id}
          onDragStart={() => editingId !== memo.id && onDragStart(memo.id)}
          onDragEnd={onDragEnd}
        >
          {editingId === memo.id ? (
            <div className="bubble-edit">
              <textarea
                ref={textareaRef}
                className="bubble-textarea"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={3}
                disabled={saving}
              />
              <div className="bubble-edit-actions">
                <button className="bubble-edit-btn bubble-cancel" onClick={cancelEdit} disabled={saving}>취소</button>
                <button className="bubble-edit-btn bubble-save" onClick={() => void confirmEdit()} disabled={saving || !editText.trim()}>
                  {saving ? "저장 중…" : "저장"}
                </button>
              </div>
            </div>
          ) : (
            <p className="bubble-text" onDoubleClick={() => startEdit(memo)}>{memo.text}</p>
          )}
          <footer>{memo.bookId ? `연결됨: ${bookTitles.get(memo.bookId) ?? "책"}` : "미분류"}</footer>
        </article>
      ))}
    </section>
  );
}
