import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/widget') {
    const dest = request.headers.get('sec-fetch-dest') ?? '';
    const accept = request.headers.get('accept') ?? '';

    // Notion image block or <img> tag fetch — serve PNG
    const isImageFetch =
      dest === 'image' ||
      (accept.includes('image/') && !accept.includes('text/html'));

    if (isImageFetch) {
      const target = new URL('/widget/image', request.url);
      target.search = request.nextUrl.search;
      return NextResponse.rewrite(target);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/widget',
};
