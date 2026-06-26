import { Folder } from "lucide-react";
import type { Book } from "../types";

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
  onDropMemo
}: BookSidebarProps) {
  return (
    <aside className="sidebar-panel" aria-label="현재 읽는 책">
      <div className="sidebar-title">Reading</div>
      <div className="book-list">
        {books.map((book) => (
          <button
            key={book.id}
            className={`book-row ${book.id === selectedBookId ? "book-row-selected" : ""}`}
            onClick={() => onSelectBook(book.id)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => onDropMemo(book.id)}
            aria-label={`${book.title} 폴더`}
          >
            <Folder className="folder-icon" aria-hidden="true" />
            <span className="book-title">{book.title}</span>
            {book.recentCount > 0 ? <span className="count-badge">{book.recentCount}</span> : null}
          </button>
        ))}
        <button
          className={`book-row unclassified-row ${selectedBookId === null ? "book-row-selected" : ""}`}
          onClick={() => onSelectBook(null)}
          aria-label="미분류 폴더"
        >
          <Folder className="folder-icon muted" aria-hidden="true" />
          <span className="book-title">미분류</span>
        </button>
      </div>
      {draggedMemoId ? <div className="drop-hint">책 위에 놓아 연결</div> : null}
    </aside>
  );
}
