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

    const all = result.results as Array<{ id: string; object: string; title?: Array<{ plain_text: string }> }>;
    const dbs = all.filter((r) => r.object === 'database');
    const pages = all.filter((r) => r.object === 'page');

    const dbTitles = dbs.map((db) => db.title?.map((t) => t.plain_text).join('') ?? '(제목 없음)');

    const find = (name: string) => dbs.find((db) => db.title?.some((t) => t.plain_text.includes(name)));

    const notesDb = find('독서노트');
    const recordsDb = find('독서기록');

    if (!notesDb || !recordsDb) {
      const missing = [!notesDb && '독서노트', !recordsDb && '독서기록'].filter(Boolean).join(', ');
      const summary = [
        `검색 결과 총 ${all.length}개 (DB ${dbs.length}개, 페이지 ${pages.length}개)`,
        dbs.length > 0 ? `찾은 DB: ${dbTitles.join(', ')}` : 'DB 없음',
      ].join(' / ');
      return NextResponse.json({
        error: `'${missing}' DB를 찾을 수 없습니다. [${summary}] — 해당 DB 페이지를 열고 … → 연결 → 통합 추가 를 해주세요.`,
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
