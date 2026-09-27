// src/lib/server-tracking.ts
import fs from 'fs';
import path from 'path';

export interface TrackingRecord {
  count: number;
  extra: number;
  lastUpdated: number;
}

const GLOBAL_STORE_KEY = '__FASTFOLIO_SERVER_STORE__';
const BACKUP_FILE = path.join(process.cwd(), '.next', 'fastfolio-tracking-cache.json');

function getStore(): Map<string, TrackingRecord> {
  const g = globalThis as unknown as { [GLOBAL_STORE_KEY]?: Map<string, TrackingRecord> };
  if (!g[GLOBAL_STORE_KEY]) {
    g[GLOBAL_STORE_KEY] = new Map<string, TrackingRecord>();
    // Try restoring from disk backup if available
    try {
      if (fs.existsSync(BACKUP_FILE)) {
        const raw = fs.readFileSync(BACKUP_FILE, 'utf-8');
        const data = JSON.parse(raw);
        for (const [k, v] of Object.entries(data)) {
          g[GLOBAL_STORE_KEY]!.set(k, v as TrackingRecord);
        }
      }
    } catch {
      // Ignore cache load failure
    }
  }
  return g[GLOBAL_STORE_KEY]!;
}

function persistStoreAsync() {
  try {
    const store = getStore();
    const obj: Record<string, TrackingRecord> = {};
    for (const [k, v] of store.entries()) {
      obj[k] = v;
    }
    const dir = path.dirname(BACKUP_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(obj, null, 2), 'utf-8');
  } catch {
    // Ignore async backup failure
  }
}

export const FREE_MESSAGE_LIMIT = 2;

export function getClientIdentifiers(req: Request, clientFp?: string | null): string[] {
  const ids: string[] = [];

  // 1. Device fingerprint from header or parameter
  const headerFp = req.headers.get('x-device-fingerprint');
  const fp = (clientFp || headerFp || '').trim();
  if (fp && fp.startsWith('fp_') && fp !== 'fp_client') {
    ids.push(`fp:${fp}`);
  }

  // 2. Client IP address
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = forwarded ? forwarded.split(',')[0].trim() : (realIp ? realIp.trim() : null);

  if (ip) {
    ids.push(`ip:${ip}`);
  }

  return ids;
}

export function getServerTracking(keys: string[]): TrackingRecord {
  const store = getStore();
  let maxCount = 0;
  let maxExtra = 0;
  let lastUpdated = Date.now();

  for (const k of keys) {
    const rec = store.get(k);
    if (rec) {
      if (rec.count > maxCount) maxCount = rec.count;
      if (rec.extra > maxExtra) maxExtra = rec.extra;
      if (rec.lastUpdated > lastUpdated) lastUpdated = rec.lastUpdated;
    }
  }

  return { count: maxCount, extra: maxExtra, lastUpdated };
}

export function incrementServerCount(keys: string[]): number {
  const store = getStore();
  const current = getServerTracking(keys);
  const nextCount = current.count + 1;
  const now = Date.now();

  for (const k of keys) {
    store.set(k, {
      count: nextCount,
      extra: current.extra,
      lastUpdated: now,
    });
  }

  persistStoreAsync();
  return nextCount;
}

export function addServerExtra(keys: string[], addedMessages: number): number {
  const store = getStore();
  const current = getServerTracking(keys);
  const nextExtra = current.extra + addedMessages;
  const now = Date.now();

  for (const k of keys) {
    store.set(k, {
      count: current.count,
      extra: nextExtra,
      lastUpdated: now,
    });
  }

  persistStoreAsync();
  return nextExtra;
}

export function resetServerTracking(keys: string[]): void {
  const store = getStore();
  for (const k of keys) {
    store.delete(k);
  }
  persistStoreAsync();
}
