import { NextRequest } from 'next/server';
import type { UserConfig } from './notion';

export function extractConfig(request: NextRequest): UserConfig {
  const auth = request.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) throw new Error('Missing Authorization header');

  const notesDatabaseId = request.headers.get('x-notes-db-id') ?? '';
  const recordsDatabaseId = request.headers.get('x-records-db-id') ?? '';
  if (!notesDatabaseId) throw new Error('Missing x-notes-db-id header');
  if (!recordsDatabaseId) throw new Error('Missing x-records-db-id header');

  return {
    token,
    notesDatabaseId,
    recordsDatabaseId,
    recordStatusProperty: dec(request.headers.get('x-status-prop')) || '읽기 상태',
    currentReadingStatus: dec(request.headers.get('x-status-value')) || '읽는중',
    noteTypeProperty: dec(request.headers.get('x-type-prop')) || '유형',
    noteStatusProperty: dec(request.headers.get('x-note-status-prop')) || '상태',
    noteRelationProperty: dec(request.headers.get('x-relation-prop')) || '독서기록',
  };
}

function dec(v: string | null): string {
  if (!v) return '';
  try { return decodeURIComponent(v); } catch { return v; }
}
