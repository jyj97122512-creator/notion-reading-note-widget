import { NextRequest, NextResponse } from 'next/server';
import { createNotionClient, getNotionConfig, pageToMemo, buildCreateMemoPayload } from '@/lib/notion';
import { extractConfig } from '@/lib/requestConfig';

export async function GET(request: NextRequest) {
  try {
    const userConfig = extractConfig(request);
    const notion = createNotionClient(userConfig.token);
    const config = getNotionConfig(userConfig);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (notion as any).databases.query({
      database_id: config.notesDatabaseId,
      sorts: [{ timestamp: 'created_time', direction: 'ascending' }],
    });
    return NextResponse.json(result.results.map((p: any) => pageToMemo(p, userConfig)));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Notion request failed';
    return NextResponse.json({ error: msg }, { status: msg.includes('Missing') ? 400 : 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { text: string; type: 'passage' | 'thought'; bookId: string | null };
    if (!body.text || !body.type) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

    const userConfig = extractConfig(request);
    const notion = createNotionClient(userConfig.token);
    const config = getNotionConfig(userConfig);
    const payload = buildCreateMemoPayload({
      databaseId: config.notesDatabaseId,
      relationProperty: config.noteRelationProperty,
      typeProperty: config.noteTypeProperty,
      statusProperty: config.noteStatusProperty,
      text: body.text,
      type: body.type,
      bookId: body.bookId,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const page = await (notion as any).pages.create(payload);
    return NextResponse.json(pageToMemo(page as any, userConfig), { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Notion request failed';
    return NextResponse.json({ error: msg }, { status: msg.includes('Missing') ? 400 : 500 });
  }
}
