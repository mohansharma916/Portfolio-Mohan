// src/lib/fastfolio-tracking.ts
import { getBrowserFingerprint } from './fingerprint';

const STORAGE_KEYS = {
  MESSAGE_COUNT: 'fastfolio_message_count',
  EXTRA_MESSAGES: 'fastfolio_extra_messages',
  POPUP_SHOWN: 'fastfolio_popup_shown',
  LAST_RESET: 'fastfolio_last_reset',
  RATE_LIMIT_REACHED: 'fastfolio_rate_limit_reached',
} as const;

export const FREE_MESSAGE_LIMIT = 2; // Initial free messages
export const MESSAGES_PER_PURCHASE = 4; // Extra messages granted per ₹10 payment

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)')
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, days = 365): void {
  if (typeof document === 'undefined') return;
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${date.toUTCString()};path=/;SameSite=Lax`;
}

function removeCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;SameSite=Lax`;
}

function getFingerprintStorageKey(baseKey: string): string {
  const fp = getBrowserFingerprint();
  return `${baseKey}_${fp}`;
}

export interface SyncStatus {
  count: number;
  extra: number;
  totalAllowed: number;
  hasReachedLimit: boolean;
  remaining: number;
}

export class FastfolioTracking {
  /**
   * Retrieves the extra purchased message quota from multi-layer storage
   */
  static getExtraMessages(): number {
    if (typeof window === 'undefined') return 0;
    const fpKey = getFingerprintStorageKey(STORAGE_KEYS.EXTRA_MESSAGES);
    const localVal = parseInt(localStorage.getItem(STORAGE_KEYS.EXTRA_MESSAGES) || '0', 10);
    const fpVal = parseInt(localStorage.getItem(fpKey) || '0', 10);
    const sessionVal = parseInt(sessionStorage.getItem(STORAGE_KEYS.EXTRA_MESSAGES) || '0', 10);
    const cookieVal = parseInt(getCookie(STORAGE_KEYS.EXTRA_MESSAGES) || '0', 10);

    const extra = Math.max(
      isNaN(localVal) ? 0 : localVal,
      isNaN(fpVal) ? 0 : fpVal,
      isNaN(sessionVal) ? 0 : sessionVal,
      isNaN(cookieVal) ? 0 : cookieVal
    );

    if (extra > 0) {
      localStorage.setItem(STORAGE_KEYS.EXTRA_MESSAGES, extra.toString());
      localStorage.setItem(fpKey, extra.toString());
      sessionStorage.setItem(STORAGE_KEYS.EXTRA_MESSAGES, extra.toString());
      setCookie(STORAGE_KEYS.EXTRA_MESSAGES, extra.toString());
    }
    return extra;
  }

  /**
   * Adds extra messages upon successful payment and synchronizes all stores
   */
  static addExtraMessages(count: number = MESSAGES_PER_PURCHASE): number {
    if (typeof window === 'undefined') return 0;
    const currentExtra = this.getExtraMessages();
    const newExtra = currentExtra + count;
    const fpKey = getFingerprintStorageKey(STORAGE_KEYS.EXTRA_MESSAGES);

    localStorage.setItem(STORAGE_KEYS.EXTRA_MESSAGES, newExtra.toString());
    localStorage.setItem(fpKey, newExtra.toString());
    sessionStorage.setItem(STORAGE_KEYS.EXTRA_MESSAGES, newExtra.toString());
    setCookie(STORAGE_KEYS.EXTRA_MESSAGES, newExtra.toString());

    localStorage.removeItem(STORAGE_KEYS.RATE_LIMIT_REACHED);
    sessionStorage.removeItem(STORAGE_KEYS.RATE_LIMIT_REACHED);
    removeCookie(STORAGE_KEYS.RATE_LIMIT_REACHED);
    return newExtra;
  }

  /**
   * Total messages allowed (base free + purchased)
   */
  static getTotalAllowedMessages(): number {
    return FREE_MESSAGE_LIMIT + this.getExtraMessages();
  }

  /**
   * Number of messages sent so far (persisted across reloads in localStorage, sessionStorage, cookie, and device fingerprint key)
   */
  static getMessageCount(): number {
    if (typeof window === 'undefined') return 0;
    const fpKey = getFingerprintStorageKey(STORAGE_KEYS.MESSAGE_COUNT);
    const localVal = parseInt(localStorage.getItem(STORAGE_KEYS.MESSAGE_COUNT) || '0', 10);
    const fpVal = parseInt(localStorage.getItem(fpKey) || '0', 10);
    const sessionVal = parseInt(sessionStorage.getItem(STORAGE_KEYS.MESSAGE_COUNT) || '0', 10);
    const cookieVal = parseInt(getCookie(STORAGE_KEYS.MESSAGE_COUNT) || '0', 10);

    const count = Math.max(
      isNaN(localVal) ? 0 : localVal,
      isNaN(fpVal) ? 0 : fpVal,
      isNaN(sessionVal) ? 0 : sessionVal,
      isNaN(cookieVal) ? 0 : cookieVal
    );

    if (count > 0) {
      localStorage.setItem(STORAGE_KEYS.MESSAGE_COUNT, count.toString());
      localStorage.setItem(fpKey, count.toString());
      sessionStorage.setItem(STORAGE_KEYS.MESSAGE_COUNT, count.toString());
      setCookie(STORAGE_KEYS.MESSAGE_COUNT, count.toString());
    }
    return count;
  }

  /**
   * Sets the message count directly and synchronizes all multi-layer storage
   */
  static setMessageCount(count: number): void {
    if (typeof window === 'undefined') return;
    const fpKey = getFingerprintStorageKey(STORAGE_KEYS.MESSAGE_COUNT);

    localStorage.setItem(STORAGE_KEYS.MESSAGE_COUNT, count.toString());
    localStorage.setItem(fpKey, count.toString());
    sessionStorage.setItem(STORAGE_KEYS.MESSAGE_COUNT, count.toString());
    setCookie(STORAGE_KEYS.MESSAGE_COUNT, count.toString());

    if (count >= this.getTotalAllowedMessages()) {
      localStorage.setItem(STORAGE_KEYS.RATE_LIMIT_REACHED, 'true');
      sessionStorage.setItem(STORAGE_KEYS.RATE_LIMIT_REACHED, 'true');
      setCookie(STORAGE_KEYS.RATE_LIMIT_REACHED, 'true');
    }
  }

  /**
   * Increments the sent message count by 1
   */
  static incrementMessageCount(): number {
    if (typeof window === 'undefined') return 0;
    const current = this.getMessageCount();
    const next = current + 1;
    this.setMessageCount(next);
    return next;
  }

  /**
   * Whether the user has exhausted their message allowance
   */
  static hasReachedLimit(currentCount?: number): boolean {
    if (typeof currentCount === 'number') {
      return currentCount >= this.getTotalAllowedMessages();
    }
    if (typeof window === 'undefined') return false;
    return this.getMessageCount() >= this.getTotalAllowedMessages();
  }

  /**
   * Number of remaining messages left in current allowance
   */
  static getRemainingMessages(currentCount?: number): number {
    const totalAllowed = this.getTotalAllowedMessages();
    const count = typeof currentCount === 'number' ? currentCount : this.getMessageCount();
    return Math.max(0, totalAllowed - count);
  }

  static shouldShowPopup(currentCount?: number): boolean {
    return this.hasReachedLimit(currentCount);
  }

  static shouldShowRateLimitPopup(currentCount?: number): boolean {
    return this.hasReachedLimit(currentCount);
  }

  static markPopupShown(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.POPUP_SHOWN, 'true');
    sessionStorage.setItem(STORAGE_KEYS.POPUP_SHOWN, 'true');
  }

  /**
   * Asynchronously synchronizes with the server-side rate limiter.
   * If the user cleared their browser cache or reloaded, the server provides
   * the true persisted count and heals the client storage.
   */
  static async syncWithServer(): Promise<SyncStatus> {
    if (typeof window === 'undefined') {
      return {
        count: 0,
        extra: 0,
        totalAllowed: FREE_MESSAGE_LIMIT,
        hasReachedLimit: false,
        remaining: FREE_MESSAGE_LIMIT,
      };
    }

    try {
      const fp = getBrowserFingerprint();
      const res = await fetch(`/api/chat/status?fp=${encodeURIComponent(fp)}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        // Self-heal: pick the highest between client and server
        const currentClientCount = this.getMessageCount();
        const currentClientExtra = this.getExtraMessages();

        const resolvedCount = Math.max(currentClientCount, data.count || 0);
        const resolvedExtra = Math.max(currentClientExtra, data.extra || 0);

        if (resolvedCount !== currentClientCount) {
          this.setMessageCount(resolvedCount);
        }
        if (resolvedExtra !== currentClientExtra) {
          const diff = resolvedExtra - currentClientExtra;
          if (diff > 0) this.addExtraMessages(diff);
        }

        const totalAllowed = FREE_MESSAGE_LIMIT + resolvedExtra;
        return {
          count: resolvedCount,
          extra: resolvedExtra,
          totalAllowed,
          hasReachedLimit: resolvedCount >= totalAllowed,
          remaining: Math.max(0, totalAllowed - resolvedCount),
        };
      }
    } catch (err) {
      console.warn('Failed to sync Fastfolio tracking with server:', err);
    }

    return {
      count: this.getMessageCount(),
      extra: this.getExtraMessages(),
      totalAllowed: this.getTotalAllowedMessages(),
      hasReachedLimit: this.hasReachedLimit(),
      remaining: this.getRemainingMessages(),
    };
  }

  static resetSession(): void {
    if (typeof window === 'undefined') return;
    const fpKey = getFingerprintStorageKey(STORAGE_KEYS.MESSAGE_COUNT);
    localStorage.removeItem(STORAGE_KEYS.MESSAGE_COUNT);
    localStorage.removeItem(fpKey);
    localStorage.removeItem(STORAGE_KEYS.RATE_LIMIT_REACHED);
    sessionStorage.removeItem(STORAGE_KEYS.MESSAGE_COUNT);
    sessionStorage.removeItem(STORAGE_KEYS.RATE_LIMIT_REACHED);
    removeCookie(STORAGE_KEYS.MESSAGE_COUNT);
    removeCookie(STORAGE_KEYS.RATE_LIMIT_REACHED);
    localStorage.setItem(STORAGE_KEYS.POPUP_SHOWN, 'false');
    localStorage.setItem(STORAGE_KEYS.LAST_RESET, Date.now().toString());
  }

  static async resetForTesting(): Promise<void> {
    if (typeof window === 'undefined') return;
    const fp = getBrowserFingerprint();
    const fpMsgKey = getFingerprintStorageKey(STORAGE_KEYS.MESSAGE_COUNT);
    const fpExtraKey = getFingerprintStorageKey(STORAGE_KEYS.EXTRA_MESSAGES);

    localStorage.removeItem(STORAGE_KEYS.MESSAGE_COUNT);
    localStorage.removeItem(STORAGE_KEYS.EXTRA_MESSAGES);
    localStorage.removeItem(STORAGE_KEYS.POPUP_SHOWN);
    localStorage.removeItem(STORAGE_KEYS.RATE_LIMIT_REACHED);
    localStorage.removeItem(STORAGE_KEYS.LAST_RESET);
    localStorage.removeItem(fpMsgKey);
    localStorage.removeItem(fpExtraKey);

    sessionStorage.clear();

    removeCookie(STORAGE_KEYS.MESSAGE_COUNT);
    removeCookie(STORAGE_KEYS.EXTRA_MESSAGES);
    removeCookie(STORAGE_KEYS.POPUP_SHOWN);
    removeCookie(STORAGE_KEYS.RATE_LIMIT_REACHED);
    removeCookie(STORAGE_KEYS.LAST_RESET);

    try {
      await fetch(`/api/chat/status?reset=true&fp=${encodeURIComponent(fp)}`, {
        method: 'POST',
      });
    } catch {
      // Ignore reset failure
    }
  }
}