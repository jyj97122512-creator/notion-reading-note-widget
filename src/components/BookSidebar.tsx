import { useState } from "react";
import type { Book } from "../types";

const BOOK_COLORS = [
  { light: "#ffb340", dark: "#e8850a" },
  { light: "#5aabff", dark: "#0a84ff" },
  { light: "#63e07a", dark: "#1fa83e" },
  { light: "#ff6b8a", dark: "#cc1f48" },
  { light: "#d07ef7", dark: "#9b30d8" },
  { light: "#7dd8fc", dark: "#2aaccf" },
];

function ClosedFolderIcon({ light, dark }: { light: string; dark: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path d="M2 10 L2 7.5 Q2 5.5 4 5.5 L9 5.5 Q10.2 5.5 10.8 7 L12 9.5 L2 9.5Z" fill={dark} />
      <rect x="2" y="9" width="18" height="11" rx="2.5" fill={light} />
      <line x1="2" y1="16.5" x2="20" y2="16.5" stroke={dark} strokeWidth="0.8" opacity="0.4" />
    </svg>
  );
}

function OpenFolderIcon({ light, dark }: { light: string; dark: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path d="M2 10 L2 7.5 Q2 5.5 4 5.5 L9 5.5 Q10.2 5.5 10.8 7 L12 9.5 L2 9.5Z" fill={dark} />
      <rect x="4" y="7.5" width="13" height="8" rx="1.5" fill="rgba(255,255,255,0.88)" />
      <path d="M2 12 Q1.8 10 3.5 10 L18.5 10 Q20.2 10 20 12 L18.5 19 Q18.2 20 17 20 L4 20 Q2.8 20 2.5 19Z" fill={light} />
      <line x1="2.5" y1="17" x2="19.5" y2="17" stroke={dark} strokeWidth="0.8" opacity="0.35" />
    </svg>
  );
}

interface BookSidebarProps {
  books: Book[];
  selectedBookId: string | null;
  draggedMemoId: string | null;
  onSelectBook(bookId: string | null): void;
  onDropMemo(bookId: string): void;
}

export function BookSidebar({
  books,
  selectedBookId,
  draggedMemoId,
  onSelectBook,
  onDropMemo,
}: BookSidebarProps) {
  const [query, setQuery] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const allBooks = [
    ...books,
    { id: null as string | null, title: "미분류", recentCount: 0 },
  ];

  const filtered = query
    ? allBooks.filter((b) => b.title.toLowerCase().includes(query.toLowerCase()))
    : [];

  function highlight(text: string) {
    if (!query) return <>{text}</>;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx < 0) return <>{text}</>;
    return (
      <>
        {text.slice(0, idx)}
        <strong>{text.slice(idx, idx + query.length)}</strong>
        {text.slice(idx + query.length)}
      </>
    );
  }

  return (
    <aside className="sidebar-panel" aria-label="도서 목록">
      <div className="sidebar-title">도서 목록</div>

      <div className="search-wrap">
        <svg className="search-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <circle cx="6.5" cy="6.5" r="4.5" />
          <line x1="10" y1="10" x2="14" y2="14" />
        </svg>
        <input
          className="search-input"
          type="text"
          placeholder="검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setDropdownOpen(true)}
          onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
          aria-label="도서 검색"
        />
        {query && (
          <button
            className="search-clear-btn"
            onMouseDown={() => setQuery("")}
            aria-label="검색어 지우기"
          >
            <svg viewBox="0 0 8 8" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round">
              <line x1="1" y1="1" x2="7" y2="7" />
              <line x1="7" y1="1" x2="1" y2="7" />
            </svg>
          </button>
        )}
      </div>

      {dropdownOpen && query && (
        <div className="search-dropdown" role="listbox">
          {filtered.length === 0 ? (
            <div className="search-no-result">결과 없음</div>
          ) : (
            filtered.map((book) => (
              <button
                key={book.id ?? "unclassified"}
                className="search-result-item"
                role="option"
                onMouseDown={() => {
                  onSelectBook(book.id);
                  setQuery("");
                }}
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true" style={{ width: 14, height: 14, opacity: 0.45, flexShrink: 0 }}>
                  <circle cx="6.5" cy="6.5" r="4.5" />
                  <line x1="10" y1="10" x2="14" y2="14" />
                </svg>
                <span>{highlight(book.title)}</span>
              </button>
            ))
          )}
        </div>
      )}

      <div className="book-list">
        {books.map((book, i) => {
          const color = BOOK_COLORS[i % BOOK_COLORS.length];
          const isSelected = book.id === selectedBookId;
          return (
            <button
              key={book.id}
              className={`book-row ${isSelected ? "book-row-selected" : ""}`}
              onClick={() => onSelectBook(book.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDropMemo(book.id)}
              aria-label={`${book.title} 폴더`}
            >
              {isSelected
                ? <OpenFolderIcon light={color.light} dark={color.dark} />
                : <ClosedFolderIcon light={color.light} dark={color.dark} />}
              <span className="book-title">{book.title}</span>
              {book.recentCount > 0 && <span className="count-badge">{book.recentCount}</span>}
            </button>
          );
        })}
        <button
          className={`book-row ${selectedBookId === null ? "book-row-selected" : ""}`}
          onClick={() => onSelectBook(null)}
          aria-label="미분류 폴더"
        >
          {selectedBookId === null
            ? <OpenFolderIcon light="#b4b2a9" dark="#5f5e5a" />
            : <ClosedFolderIcon light="#d3d1c7" dark="#888780" />}
          <span className="book-title">미분류</span>
        </button>
      </div>

      {draggedMemoId && <div className="drop-hint">책 위에 놓아 연결</div>}
    </aside>
  );
}
