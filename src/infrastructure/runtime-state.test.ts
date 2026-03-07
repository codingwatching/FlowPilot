import { describe, it, expect } from 'vitest';
import { isRuntimeLockStale, parseRuntimeLock } from './runtime-state';

describe('runtime-state lock metadata', () => {
  it('parseRuntimeLock marks malformed payload as invalid', () => {
    expect(parseRuntimeLock('{bad json')).toEqual({
      valid: false,
      reason: 'invalid-json',
    });
  });

  it('isRuntimeLockStale refuses fresh malformed lock files', () => {
    const result = isRuntimeLockStale({
      parsed: { valid: false, reason: 'invalid-json' },
      fileAgeMs: 1_000,
      staleAfterMs: 30_000,
      isProcessAlive: () => false,
      currentHostname: 'host-a',
    });

    expect(result).toMatchObject({
      stale: false,
      reason: 'invalid-lock-payload',
    });
  });

  it('isRuntimeLockStale refuses reclaim when hostname matches but locality is not provable', () => {
    const parsed = parseRuntimeLock(JSON.stringify({
      pid: 4242,
      hostname: 'host-a',
      createdAt: new Date(Date.now() - 60_000).toISOString(),
    }));

    const result = isRuntimeLockStale({
      parsed,
      fileAgeMs: 60_000,
      staleAfterMs: 30_000,
      isProcessAlive: () => false,
      currentHostname: 'host-a',
      currentLocalityToken: 'machine-a',
    });

    expect(result).toMatchObject({
      stale: false,
      reason: 'unverified-locality',
    });
  });
});
