import { describe, it, expect } from 'vitest';
import {
  getContextWindowSize,
  getEffectiveContextWindowSize,
  getAutoCompactThreshold,
  calculateTokenWarningState,
  calculateContextPercentages,
} from '../context';

describe('context', () => {
  describe('getContextWindowSize', () => {
    it('returns 200000 for claude-sonnet-4', () => {
      expect(getContextWindowSize('claude-sonnet-4-20250514')).toBe(200000);
    });
    it('returns 128000 for gpt-4o', () => {
      expect(getContextWindowSize('gpt-4o')).toBe(128000);
    });
    it('returns default 200000 for unknown model', () => {
      expect(getContextWindowSize('unknown-model')).toBe(200000);
    });
  });

  describe('getEffectiveContextWindowSize', () => {
    it('returns context window minus reserved output tokens', () => {
      // claude-sonnet-4: 200000 - min(32000, 20000) = 200000 - 20000 = 180000
      expect(getEffectiveContextWindowSize('claude-sonnet-4-20250514')).toBe(180000);
    });
  });

  describe('getAutoCompactThreshold', () => {
    it('returns effective window minus buffer', () => {
      // 180000 - 13000 = 167000
      expect(getAutoCompactThreshold('claude-sonnet-4-20250514')).toBe(167000);
    });
  });

  describe('calculateTokenWarningState', () => {
    it('shows no warning when well below threshold', () => {
      const state = calculateTokenWarningState(50000, 'claude-sonnet-4-20250514');
      expect(state.isAboveWarningThreshold).toBe(false);
      expect(state.isAboveErrorThreshold).toBe(false);
      expect(state.isAboveAutoCompactThreshold).toBe(false);
      expect(state.isAtBlockingLimit).toBe(false);
    });

    it('shows warning when approaching threshold', () => {
      // warning threshold = 167000 - 20000 = 147000
      const state = calculateTokenWarningState(150000, 'claude-sonnet-4-20250514');
      expect(state.isAboveWarningThreshold).toBe(true);
    });

    it('shows auto-compact threshold when exceeded', () => {
      const state = calculateTokenWarningState(170000, 'claude-sonnet-4-20250514');
      expect(state.isAboveAutoCompactThreshold).toBe(true);
    });

    it('shows blocking limit when at limit', () => {
      // blocking limit = 180000 - 3000 = 177000
      const state = calculateTokenWarningState(178000, 'claude-sonnet-4-20250514');
      expect(state.isAtBlockingLimit).toBe(true);
    });
  });

  describe('calculateContextPercentages', () => {
    it('calculates used percentage from input tokens only', () => {
      const result = calculateContextPercentages(50000, 10000, 30000, 'claude-sonnet-4-20250514');
      // (50000 + 10000 + 30000) / 200000 * 100 = 45%
      expect(result.used).toBe(45);
      expect(result.remaining).toBe(55);
    });

    it('does not include output tokens', () => {
      // Even with high output, only input matters
      const result = calculateContextPercentages(100000, 0, 0, 'claude-sonnet-4-20250514');
      expect(result.used).toBe(50);
    });

    it('clamps to 100 max', () => {
      const result = calculateContextPercentages(250000, 0, 0, 'claude-sonnet-4-20250514');
      expect(result.used).toBe(100);
      expect(result.remaining).toBe(0);
    });
  });
});
