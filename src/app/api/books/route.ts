import { NextRequest, NextResponse } from 'next/server';
import { createNotionClient, getNotionConfig, pageToBook } from '@/lib/notion';
import { extractConfig } from '@/lib/requestConfig';

export async function GET(request: NextRequest) {
  try {
    const userConfig = extractConfig(request);
    const notion = createNotionClient(userConfig.token);
    const config = getNotionConfig(userConfig);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (notion as any).databases.query({
      database_id: config.recordsDatabaseId,
      filter: { property: config.recordStatusProperty, select: { equals: config.currentReadingStatus } },
    });
    return NextResponse.json(result.results.map((p: any) => pageToBook(p)));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Notion request failed';
    return NextResponse.json({ error: msg }, { status: msg.includes('Missing') ? 400 : 500 });
  }
}
