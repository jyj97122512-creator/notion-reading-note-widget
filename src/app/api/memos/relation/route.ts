import { NextRequest, NextResponse } from 'next/server';
import { createNotionClient, buildRelationUpdatePayload, pageToMemo } from '@/lib/notion';
import { extractConfig } from '@/lib/requestConfig';

export async function PATCH(request: NextRequest) {
  try {
    const { memoId, bookId } = await request.json() as { memoId: string; bookId: string };
    if (!memoId || !bookId) return NextResponse.json({ error: 'memoId and bookId required' }, { status: 400 });

    const userConfig = extractConfig(request);
    const notion = createNotionClient(userConfig.token);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const page = await (notion as any).pages.update({
      page_id: memoId,
      ...buildRelationUpdatePayload({
        relationProperty: userConfig.noteRelationProperty,
        statusProperty: userConfig.noteStatusProperty,
        bookId,
      }),
    } as any);
    return NextResponse.json(pageToMemo(page as any, userConfig));
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Notion request failed';
    return NextResponse.json({ error: msg }, { status: msg.includes('Missing') ? 400 : 500 });
  }
}
