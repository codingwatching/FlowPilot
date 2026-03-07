/**
 * @module infrastructure/runtime-state
 * @description 运行时状态辅助 - 文件锁元数据与判定逻辑
 */

import { readFileSync } from 'fs';
import { hostname as getHostname } from 'os';

const DEFAULT_INVALID_LOCK_STALE_AFTER_MS = 30_000;
const LINUX_BOOT_ID_PATH = '/proc/sys/kernel/random/boot_id';

/** 运行时锁元数据 */
export interface RuntimeLockMetadata {
  pid: number;
  hostname: string;
  createdAt: string;
  localityToken?: string;
}

/** 运行时锁解析结果 */
export type ParsedRuntimeLock =
  | { valid: true; metadata: RuntimeLockMetadata }
  | { valid: false; reason: 'invalid-json' | 'invalid-shape' };

/** 运行时锁陈旧判定输入 */
export interface RuntimeLockStaleCheckInput {
  parsed: ParsedRuntimeLock;
  fileAgeMs: number;
  staleAfterMs: number;
  isProcessAlive: (pid: number) => boolean;
  currentHostname: string;
  currentLocalityToken?: string;
  nowMs?: number;
}

/** 运行时锁陈旧判定结果 */
export interface RuntimeLockStaleDecision {
  stale: boolean;
  reason: 'live-owner' | 'dead-owner' | 'foreign-host-lock' | 'invalid-lock-payload' | 'unverified-locality';
  owner?: RuntimeLockMetadata;
  ageMs?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isValidCreatedAt(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

/** 读取当前机器可证明的本地性令牌 */
export function getRuntimeLocalityToken(): string | undefined {
  try {
    const token = readFileSync(LINUX_BOOT_ID_PATH, 'utf-8').trim();
    return token.length > 0 ? token : undefined;
  } catch {
    return undefined;
  }
}

/** 创建当前进程的运行时锁元数据 */
export function createRuntimeLockMetadata(): RuntimeLockMetadata {
  const localityToken = getRuntimeLocalityToken();
  return {
    pid: process.pid,
    hostname: getHostname(),
    createdAt: new Date().toISOString(),
    ...(localityToken ? { localityToken } : {}),
  };
}

/** 序列化运行时锁元数据 */
export function serializeRuntimeLock(metadata: RuntimeLockMetadata): string {
  return JSON.stringify(metadata);
}

/** 解析运行时锁元数据 */
export function parseRuntimeLock(raw: string): ParsedRuntimeLock {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed)) return { valid: false, reason: 'invalid-shape' };

    const pid = parsed.pid;
    const hostname = parsed.hostname;
    const createdAt = parsed.createdAt;
    const localityToken = parsed.localityToken;
    if (
      !Number.isInteger(pid)
      || pid <= 0
      || typeof hostname !== 'string'
      || hostname.length === 0
      || !isValidCreatedAt(createdAt)
      || (localityToken !== undefined && (typeof localityToken !== 'string' || localityToken.length === 0))
    ) {
      return { valid: false, reason: 'invalid-shape' };
    }

    return {
      valid: true,
      metadata: {
        pid,
        hostname,
        createdAt,
        ...(typeof localityToken === 'string' ? { localityToken } : {}),
      },
    };
  } catch {
    return { valid: false, reason: 'invalid-json' };
  }
}

/** 计算锁年龄 */
export function getRuntimeLockAgeMs(metadata: RuntimeLockMetadata, nowMs = Date.now()): number {
  return Math.max(0, nowMs - Date.parse(metadata.createdAt));
}

/** 判断锁是否由当前进程持有 */
export function isRuntimeLockOwnedByProcess(
  parsed: ParsedRuntimeLock,
  pid = process.pid,
  currentHostname = getHostname(),
  currentLocalityToken = getRuntimeLocalityToken(),
): boolean {
  if (!parsed.valid || parsed.metadata.pid !== pid || parsed.metadata.hostname !== currentHostname) {
    return false;
  }

  if (parsed.metadata.localityToken === undefined) {
    return true;
  }

  return currentLocalityToken !== undefined && parsed.metadata.localityToken === currentLocalityToken;
}

/** 判断运行时锁是否可视为陈旧 */
export function isRuntimeLockStale(input: RuntimeLockStaleCheckInput): RuntimeLockStaleDecision {
  if (!input.parsed.valid) {
    return {
      stale: input.fileAgeMs >= input.staleAfterMs,
      reason: 'invalid-lock-payload',
      ageMs: input.fileAgeMs,
    };
  }

  const ageMs = getRuntimeLockAgeMs(input.parsed.metadata, input.nowMs ?? Date.now());
  if (input.parsed.metadata.hostname !== input.currentHostname) {
    return {
      stale: false,
      reason: 'foreign-host-lock',
      owner: input.parsed.metadata,
      ageMs,
    };
  }

  if (input.parsed.metadata.localityToken !== undefined && input.currentLocalityToken !== undefined) {
    if (input.parsed.metadata.localityToken !== input.currentLocalityToken) {
      return {
        stale: false,
        reason: 'foreign-host-lock',
        owner: input.parsed.metadata,
        ageMs,
      };
    }
  } else {
    return {
      stale: false,
      reason: 'unverified-locality',
      owner: input.parsed.metadata,
      ageMs,
    };
  }

  if (input.isProcessAlive(input.parsed.metadata.pid)) {
    return {
      stale: false,
      reason: 'live-owner',
      owner: input.parsed.metadata,
      ageMs,
    };
  }

  return {
    stale: true,
    reason: 'dead-owner',
    owner: input.parsed.metadata,
    ageMs,
  };
}

/** 无效锁文件的默认陈旧回收阈值 */
export function defaultInvalidLockStaleAfterMs(): number {
  return DEFAULT_INVALID_LOCK_STALE_AFTER_MS;
}
