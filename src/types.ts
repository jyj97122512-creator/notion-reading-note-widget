export type MemoType = "passage" | "thought";
export type MemoStatus = "unclassified" | "linked" | "error";

export interface Book {
  id: string;
  title: string;
  recentCount: number;
}

export interface Memo {
  id: string;
  text: string;
  type: MemoType;
  status: MemoStatus;
  createdAt: string;
  bookId: string | null;
  errorMessage?: string;
}

export interface ReadingNotesAdapter {
  listBooks(): Promise<Book[]>;
  listMemos(): Promise<Memo[]>;
  createMemo(input: { text: string; type: MemoType; bookId: string | null }): Promise<Memo>;
  linkMemoToBook(input: { memoId: string; bookId: string }): Promise<Memo>;
}
