const STORAGE_KEYS = {
  MESSAGE_COUNT: 'fastfolio_message_count',
  EXTRA_MESSAGES: 'fastfolio_extra_messages',
  POPUP_SHOWN: 'fastfolio_popup_shown',
  LAST_RESET: 'fastfolio_last_reset',
  RATE_LIMIT_REACHED: 'fastfolio_rate_limit_reached',
} as const;

export const FREE_MESSAGE_LIMIT = 4; // Initial free messages
export const MESSAGES_PER_PURCHASE = 4; // Extra messages granted per ₹10 payment

export class FastfolioTracking {
  /**
   * Retrieves the extra purchased message quota
   */
  static getExtraMessages(): number {
    if (typeof window === 'undefined') return 0;
    return parseInt(localStorage.getItem(STORAGE_KEYS.EXTRA_MESSAGES) || '0', 10);
  }

  /**
   * Adds extra messages upon successful payment
   */
  static addExtraMessages(count: number = MESSAGES_PER_PURCHASE): number {
    if (typeof window === 'undefined') return 0;
    const currentExtra = this.getExtraMessages();
    const newExtra = currentExtra + count;
    localStorage.setItem(STORAGE_KEYS.EXTRA_MESSAGES, newExtra.toString());
    localStorage.removeItem(STORAGE_KEYS.RATE_LIMIT_REACHED);
    return newExtra;
  }

  /**
   * Total messages allowed (base free + purchased)
   */
  static getTotalAllowedMessages(): number {
    return FREE_MESSAGE_LIMIT + this.getExtraMessages();
  }

  /**
   * Number of messages sent so far
   */
  static getMessageCount(): number {
    if (typeof window === 'undefined') return 0;
    return parseInt(localStorage.getItem(STORAGE_KEYS.MESSAGE_COUNT) || '0', 10);
  }

  /**
   * Increments the sent message count
   */
  static incrementMessageCount(): number {
    if (typeof window === 'undefined') return 0;
    
    const totalAllowed = this.getTotalAllowedMessages();
    const currentCount = this.getMessageCount();

    if (currentCount >= totalAllowed) {
      localStorage.setItem(STORAGE_KEYS.RATE_LIMIT_REACHED, 'true');
      return currentCount;
    }
    
    const newCount = currentCount + 1;
    localStorage.setItem(STORAGE_KEYS.MESSAGE_COUNT, newCount.toString());
    
    if (newCount >= totalAllowed) {
      localStorage.setItem(STORAGE_KEYS.RATE_LIMIT_REACHED, 'true');
    }
    
    return newCount;
  }
  
  /**
   * Whether the user has exhausted their message allowance
   */
  static hasReachedLimit(): boolean {
    if (typeof window === 'undefined') return false;
    return this.getMessageCount() >= this.getTotalAllowedMessages();
  }

  /**
   * Number of remaining messages left in current allowance
   */
  static getRemainingMessages(): number {
    const totalAllowed = this.getTotalAllowedMessages();
    const count = this.getMessageCount();
    return Math.max(0, totalAllowed - count);
  }

  static shouldShowPopup(): boolean {
    if (typeof window === 'undefined') return false;
    return this.hasReachedLimit();
  }
  
  static shouldShowRateLimitPopup(): boolean {
    if (typeof window === 'undefined') return false;
    return this.hasReachedLimit();
  }

  static markPopupShown(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.POPUP_SHOWN, 'true');
  }
  
  static resetSession(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.POPUP_SHOWN, 'false');
    localStorage.setItem(STORAGE_KEYS.LAST_RESET, Date.now().toString());
  }
  
  static resetForTesting(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEYS.MESSAGE_COUNT);
    localStorage.removeItem(STORAGE_KEYS.EXTRA_MESSAGES);
    localStorage.removeItem(STORAGE_KEYS.POPUP_SHOWN);
    localStorage.removeItem(STORAGE_KEYS.RATE_LIMIT_REACHED);
    localStorage.removeItem(STORAGE_KEYS.LAST_RESET);
  }
}