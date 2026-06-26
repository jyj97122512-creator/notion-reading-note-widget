import { NextRequest, NextResponse } from 'next/server';
import { createNotionClient } from '@/lib/notion';

export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return NextResponse.json({ error: 'Missing Authorization header' }, { status: 400 });

  try {
    const notion = createNotionClient(token);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (notion as any).search({ filter: { value: 'database', property: 'object' }, page_size: 100 });

    const dbs = result.results as Array<{ id: string; title?: Array<{ plain_text: string }> }>;
    const find = (name: string) => dbs.find((db) => db.title?.some((t) => t.plain_text.includes(name)));

    const notesDb = find('독서노트');
    const recordsDb = find('독서기록');

    if (!notesDb) return NextResponse.json({ error: "'독서노트' DB를 찾을 수 없습니다. 통합이 해당 DB에 연결되어 있는지 확인하세요." }, { status: 404 });
    if (!recordsDb) return NextResponse.json({ error: "'독서기록' DB를 찾을 수 없습니다. 통합이 해당 DB에 연결되어 있는지 확인하세요." }, { status: 404 });

    return NextResponse.json({
      notesDatabaseId: notesDb.id.replace(/-/g, ''),
      recordsDatabaseId: recordsDb.id.replace(/-/g, ''),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Notion 연결 실패';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
