import type { WidgetConfig } from '../config';
import { configToHeaders } from '../config';

export interface Book { id: string; title: string; recentCount: number; }
export interface Memo { id: string; text: string; type: string; status: string; createdAt: string; bookId: string | null; }

export class NotionClient {
  private headers: Record<string, string>;

  constructor(config: WidgetConfig) {
    this.headers = { ...configToHeaders(config), 'Content-Type': 'application/json' };
  }

  async listBooks(): Promise<Book[]> {
    const res = await fetch('/api/books', { headers: this.headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'fetch failed');
    return data;
  }

  async listMemos(): Promise<Memo[]> {
    const res = await fetch('/api/memos', { headers: this.headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'fetch failed');
    return data;
  }

  async createMemo(input: { text: string; type: string; bookId: string | null }): Promise<Memo> {
    const res = await fetch('/api/memos', { method: 'POST', headers: this.headers, body: JSON.stringify(input) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'fetch failed');
    return data;
  }

  async linkMemoToBook(input: { memoId: string; bookId: string }): Promise<Memo> {
    const res = await fetch('/api/memos/relation', { method: 'PATCH', headers: this.headers, body: JSON.stringify(input) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'fetch failed');
    return data;
  }
}
