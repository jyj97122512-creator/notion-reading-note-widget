import { decodeEmbedParam } from '@/config';
import { createNotionClient, getNotionConfig, pageToBook, pageToMemo } from '@/lib/notion';
import { SetupScreenWrapper } from '@/components/SetupScreenWrapper';
import { WidgetShell } from '@/components/WidgetShell';
import type { Book, Memo } from '@/lib/notion';
import '../../styles.css';

export const dynamic = 'force-dynamic';

export default async function WidgetPage({
  searchParams,
}: {
  searchParams: { c?: string };
}) {
  const c = searchParams.c;

  if (!c) {
    return <SetupScreenWrapper />;
  }

  const config = decodeEmbedParam(c);
  if (!config) {
    return (
      <main className="widget-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#ff3b30', fontSize: 14 }}>설정 오류. URL을 확인하세요.</span>
      </main>
    );
  }

  let books: Book[] = [];
  let memos: Memo[] = [];
  let initialError = '';

  try {
    const notion = createNotionClient(config.token);
    const nc = getNotionConfig(config);

    const [booksRes, memosRes] = await Promise.all([
      (notion as any).databases.query({
        database_id: nc.recordsDatabaseId,
        filter: {
          property: nc.recordStatusProperty,
          select: { equals: nc.currentReadingStatus },
        },
        page_size: 20,
      }),
      (notion as any).databases.query({
        database_id: nc.notesDatabaseId,
        sorts: [{ timestamp: 'created_time', direction: 'descending' }],
        page_size: 50,
      }),
    ]);

    books = (booksRes.results as any[]).map(pageToBook);
    memos = (memosRes.results as any[]).map((p) => pageToMemo(p, config));
  } catch (e) {
    initialError = e instanceof Error ? e.message : '로드 실패';
  }

  return (
    <WidgetShell
      config={config}
      initialBooks={books}
      initialMemos={memos}
      initialError={initialError}
    />
  );
}
