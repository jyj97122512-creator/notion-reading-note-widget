import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { createNotionClient, getNotionConfig, pageToMemo } from '@/lib/notion';
import type { WidgetConfig } from '@/config';

export const runtime = 'edge';

function decodeConfig(raw: string): WidgetConfig | null {
  try {
    const parsed = JSON.parse(decodeURIComponent(escape(atob(raw)))) as WidgetConfig;
    if (!parsed.token || !parsed.notesDatabaseId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const c = request.nextUrl.searchParams.get('c');
  if (!c) {
    return new Response('Missing config', { status: 400 });
  }

  const config = decodeConfig(c);
  if (!config) {
    return new Response('Invalid config', { status: 400 });
  }

  let memos: { text: string; type: string }[] = [];
  try {
    const notion = createNotionClient(config.token);
    const notionConfig = getNotionConfig(config);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (notion as any).databases.query({
      database_id: notionConfig.notesDatabaseId,
      sorts: [{ timestamp: 'created_time', direction: 'descending' }],
      page_size: 10,
    });
    memos = (result.results as any[])
      .map((p) => pageToMemo(p, config))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 8);
  } catch {
    // show empty state on error
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#F5F5F7',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          padding: '24px',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', gap: '10px' }}>
          <div style={{ fontSize: 13, color: '#6E6E73', fontWeight: 700 }}>독서노트</div>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#34C759' }} />
        </div>

        {/* Memos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
          {memos.length === 0 ? (
            <div style={{ color: '#AEAEB2', fontSize: 14, textAlign: 'center', marginTop: 40 }}>
              메모가 없습니다
            </div>
          ) : (
            memos.map((memo, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignSelf: 'flex-end',
                  background: memo.type === 'passage' ? '#0A84FF' : '#2C2C2E',
                  color: 'white',
                  borderRadius: '18px',
                  padding: '10px 14px',
                  maxWidth: '80%',
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                {memo.text.length > 80 ? memo.text.slice(0, 80) + '…' : memo.text}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
          <div style={{ fontSize: 11, color: '#AEAEB2' }}>
            📖 독서노트 위젯 · 모바일 뷰
          </div>
        </div>
      </div>
    ),
    {
      width: 600,
      height: 400,
    }
  );
}
