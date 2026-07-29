import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = { title: '독서노트 위젯' };

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function WidgetLayout({ children }: { children: React.ReactNode }) {
  return children;
}
