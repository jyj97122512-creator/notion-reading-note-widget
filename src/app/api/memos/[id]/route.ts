import { NextRequest, NextResponse } from 'next/server';
import { createNotionClient, getNotionConfig } from '@/lib/notion';
import { extractConfig } from '@/lib/requestConfig';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { text } = await request.json() as { text: string };
    if (!text?.trim()) return NextResponse.json({ error: 'text required' }, { status: 400 });

    const userConfig = extractConfig(request);
    const notion = createNotionClient(userConfig.token);
    const config = getNotionConfig(userConfig);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (notion as any).pages.update({
      page_id: params.id,
      properties: {
        [config.noteTitleProperty]: { title: [{ text: { content: text.trim() } }] },
      },
    });

    return NextResponse.json({ id: params.id, text: text.trim() });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Notion request failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
