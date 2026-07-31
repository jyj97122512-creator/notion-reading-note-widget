import { NextRequest, NextResponse } from 'next/server';
import { createNotionClient, getNotionConfig, pageToBook } from '@/lib/notion';
import { extractConfig } from '@/lib/requestConfig';

export async function GET(request: NextRequest) {
  try {
    const userConfig = extractConfig(request);
    const notion = createNotionClient(userConfig.token);
    const config = getNotionConfig(userConfig);
    // No 읽기 상태 filter: every book in 독서기록 is listed, not just
    // 읽는중 ones. Filtering to the "currently reading" status meant a book
    // registered as 완독 (or a 재독 record) never showed up here, so there
    // was no way to add notes to it. Most-recently-edited first, so a book
    // just registered from the 독서기록 widget appears at the top.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (notion as any).databases.query({
      database_id: config.recordsDatabaseId,
      sorts: [{ timestamp: 'last_edited_time', direction: 'descending' }],
    });
    return NextResponse.json(result.results.map((p: any) => pageToBook(p)));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Notion request failed';
    return NextResponse.json({ error: msg }, { status: msg.includes('Missing') ? 400 : 500 });
  }
}
