import { createStorage } from './base/base';
import { StorageEnum } from './base/enums';
import { TokenUsage, DEFAULT_TOKEN_COSTS } from './settings/types';

// Token usage key for storage
const TOKEN_USAGE_KEY = 'token_usage';
const FREE_TIER_LIMIT = 50; // Free users get 50 tokens per month

// Initialize default token usage
function createDefaultTokenUsage(): TokenUsage {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  return {
    used: 0,
    limit: FREE_TIER_LIMIT,
    resetDate: nextMonth.toISOString(),
    lastUsed: now.toISOString(),
  };
}

// Token usage storage
const tokenUsageStorage = createStorage<TokenUsage>(TOKEN_USAGE_KEY, createDefaultTokenUsage(), {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

export class TokenUsageManager {
  /**
   * Get current token usage
   */
  static async getTokenUsage(): Promise<TokenUsage> {
    const usage = await tokenUsageStorage.get();

    // Check if we need to reset tokens (new month)
    const now = new Date();
    const resetDate = new Date(usage.resetDate);

    if (now >= resetDate) {
      // Reset tokens for new month
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const resetUsage: TokenUsage = {
        used: 0,
        limit: FREE_TIER_LIMIT,
        resetDate: nextMonth.toISOString(),
        lastUsed: usage.lastUsed,
      };

      await tokenUsageStorage.set(resetUsage);
      return resetUsage;
    }

    return usage;
  }

  /**
   * Get token cost for a specific model
   */
  static getTokenCost(model: string): number {
    return DEFAULT_TOKEN_COSTS[model] || 1; // Default to 1 token if model not found
  }

  /**
   * Check if user has enough tokens for a request
   */
  static async hasTokens(model: string): Promise<boolean> {
    const usage = await this.getTokenUsage();
    const cost = this.getTokenCost(model);
    return usage.used + cost <= usage.limit;
  }

  /**
   * Consume tokens for a request
   */
  static async consumeTokens(model: string, agentType: string): Promise<{ success: boolean; remaining: number }> {
    const usage = await this.getTokenUsage();
    const cost = this.getTokenCost(model);

    if (usage.used + cost > usage.limit) {
      return { success: false, remaining: usage.limit - usage.used };
    }

    // Update usage
    const updatedUsage: TokenUsage = {
      ...usage,
      used: usage.used + cost,
      lastUsed: new Date().toISOString(),
    };

    await tokenUsageStorage.set(updatedUsage);

    // Log usage for debugging
    console.log(
      `🎯 Token consumed: ${cost} tokens for ${agentType} using ${model}. Remaining: ${usage.limit - updatedUsage.used}`,
    );

    return { success: true, remaining: usage.limit - updatedUsage.used };
  }

  /**
   * Get remaining tokens
   */
  static async getRemainingTokens(): Promise<number> {
    const usage = await this.getTokenUsage();
    return Math.max(0, usage.limit - usage.used);
  }

  /**
   * Get days until reset
   */
  static async getDaysUntilReset(): Promise<number> {
    const usage = await this.getTokenUsage();
    const resetDate = new Date(usage.resetDate);
    const now = new Date();
    const diff = resetDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  /**
   * Get formatted usage summary
   */
  static async getUsageSummary(): Promise<{
    used: number;
    limit: number;
    remaining: number;
    percentage: number;
    daysUntilReset: number;
  }> {
    const usage = await this.getTokenUsage();
    const remaining = usage.limit - usage.used;
    const percentage = Math.round((usage.used / usage.limit) * 100);
    const daysUntilReset = await this.getDaysUntilReset();

    return {
      used: usage.used,
      limit: usage.limit,
      remaining: Math.max(0, remaining),
      percentage,
      daysUntilReset,
    };
  }

  /**
   * Reset tokens manually (for testing)
   */
  static async resetTokens(): Promise<void> {
    const defaultUsage = createDefaultTokenUsage();
    await tokenUsageStorage.set(defaultUsage);
  }
}

export { tokenUsageStorage };
