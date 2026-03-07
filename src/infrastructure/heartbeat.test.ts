import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import type { ProgressData } from '../domain/types';
import type { CheckpointRecord } from './loop-detector';
import { FsWorkflowRepository } from './fs-repository';
import { runHeartbeat } from './heartbeat';

let dir: string;
let repo: FsWorkflowRepository;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'heartbeat-test-'));
  repo = new FsWorkflowRepository(dir);
});

afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

function makeData(): ProgressData {
  return {
    name: '测试项目',
    status: 'running',
    current: '001',
    tasks: [
      { id: '001', title: '修复解析', description: '让 heartbeat 读取真实进度源', type: 'backend', status: 'active', deps: [], summary: '', retries: 0 },
      { id: '002', title: '补充测试', description: '', type: 'backend', status: 'pending', deps: ['001'], summary: '', retries: 0 },
    ],
  };
}

describe('runHeartbeat', () => {
  it('从 progress.md 读取活跃任务并报告超时', async () => {
    await repo.saveProgress(makeData());
    await mkdir(join(dir, '.workflow'), { recursive: true });

    const window: CheckpointRecord[] = [
      {
        taskId: '001',
        summary: 'still working',
        status: 'done',
        hash: 1,
        timestamp: new Date(Date.now() - 31 * 60 * 1000).toISOString(),
      },
    ];
    await writeFile(join(dir, '.workflow', 'loop-state.json'), JSON.stringify(window), 'utf-8');

    const result = await runHeartbeat(dir);

    expect(result.warnings).toContain('[TIMEOUT] 任务 001 超过30分钟无checkpoint');
    expect(result.actions).toEqual([]);
  });
});
