import { NextRequest, NextResponse } from 'next/server';
import { createNotionClient } from '@/lib/notion';

export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return NextResponse.json({ error: 'Missing Authorization header' }, { status: 400 });

  try {
    const notion = createNotionClient(token);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (notion as any).search({ page_size: 100 });

    const dbs = (result.results as Array<{ id: string; object: string; title?: Array<{ plain_text: string }> }>)
      .filter((r) => r.object === 'database');

    const dbTitles = dbs.map((db) => db.title?.map((t) => t.plain_text).join('') ?? '(제목 없음)');

    const find = (name: string) => dbs.find((db) => db.title?.some((t) => t.plain_text.includes(name)));

    const notesDb = find('독서노트');
    const recordsDb = find('독서기록');

    if (!notesDb || !recordsDb) {
      const found = dbTitles.length > 0
        ? `통합이 접근 가능한 DB: ${dbTitles.join(', ')}`
        : '통합이 접근 가능한 DB가 없습니다.';
      const missing = [!notesDb && '독서노트', !recordsDb && '독서기록'].filter(Boolean).join(', ');
      return NextResponse.json({
        error: `'${missing}' DB를 찾을 수 없습니다. ${found}. Notion에서 해당 DB에 통합을 연결해주세요. (DB 열기 → … → 연결 → 통합 추가)`,
      }, { status: 404 });
    }

    return NextResponse.json({
      notesDatabaseId: notesDb.id.replace(/-/g, ''),
      recordsDatabaseId: recordsDb.id.replace(/-/g, ''),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Notion 연결 실패';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
