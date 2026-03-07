import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { runVerify } from './verify';

describe('runVerify', () => {
  it('将 vitest 测试脚本转换为非 watch 验证命令', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'flow-verify-'));

    try {
      await writeFile(
        join(dir, 'package.json'),
        JSON.stringify({
          scripts: {
            build: 'tsup',
            test: 'vitest',
            lint: 'eslint .',
          },
        }, null, 2),
        'utf-8',
      );

      const result = runVerify(dir);

      expect(result.passed).toBe(false);
      expect(result.scripts).toEqual(['npm run build', 'npm run test -- --run', 'npm run lint']);
      expect(result.error).toContain('npm run build 失败');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('优先读取 .flowpilot/config.json 中的 verify 配置', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'flow-verify-config-'));

    try {
      await mkdir(join(dir, '.flowpilot'), { recursive: true });
      await mkdir(join(dir, '.workflow'), { recursive: true });
      await writeFile(
        join(dir, '.flowpilot', 'config.json'),
        JSON.stringify({ verify: { commands: ['npm test'], timeout: 12 } }, null, 2),
        'utf-8',
      );
      await writeFile(
        join(dir, '.workflow', 'config.json'),
        JSON.stringify({ verify: { commands: ['npm run build'], timeout: 30 } }, null, 2),
        'utf-8',
      );

      const result = runVerify(dir);

      expect(result.scripts).toEqual(['npm test']);
      expect(result.error).toContain('npm test 失败');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('在 .flowpilot/config.json 缺失时兼容读取旧的 .workflow/config.json', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'flow-verify-legacy-'));

    try {
      await mkdir(join(dir, '.workflow'), { recursive: true });
      await writeFile(
        join(dir, '.workflow', 'config.json'),
        JSON.stringify({ verify: { commands: ['npm test'], timeout: 15 } }, null, 2),
        'utf-8',
      );

      const result = runVerify(dir);

      expect(result.scripts).toEqual(['npm test']);
      expect(result.error).toContain('npm test 失败');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
