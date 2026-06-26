import type { Book, Memo } from "../types";

interface ChatTimelineProps {
  books: Book[];
  memos: Memo[];
  onDragStart(memoId: string): void;
  onDragEnd(): void;
}

export function ChatTimeline({ books, memos, onDragStart, onDragEnd }: ChatTimelineProps) {
  const bookTitles = new Map(books.map((book) => [book.id, book.title]));

  return (
    <section className="timeline" aria-label="독서 메모">
      <div className="date-pill">Today</div>
      {memos.map((memo) => (
        <article
          key={memo.id}
          className={`memo-bubble ${memo.type === "passage" ? "bubble-passage" : "bubble-thought"}`}
          draggable
          onDragStart={() => onDragStart(memo.id)}
          onDragEnd={onDragEnd}
        >
          <p>{memo.text}</p>
          <footer>{memo.bookId ? `연결됨: ${bookTitles.get(memo.bookId) ?? "책"}` : "미분류"}</footer>
        </article>
      ))}
    </section>
  );
}
