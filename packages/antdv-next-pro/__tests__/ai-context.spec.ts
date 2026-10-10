/**
 * AI 上下文契约回归 —— 保证 AI-CONTEXT.md 中的项目级覆盖层规则不被后续编辑误删
 * 四个 UI 包使用同构规格；本文件覆盖 antdv-next-pro。
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const aiContext = readFileSync(resolve(__dirname, '../AI-CONTEXT.md'), 'utf-8');

describe('AI 上下文 · antdv-next-pro', () => {
  it('AC-01: 存在「项目级覆盖层」章节', () => {
    expect(aiContext).toContain('### 项目级覆盖层');
  });

  it('AC-02: 声明三层优先级契约（Field 属性 > 项目 Provider > 内置默认）', () => {
    expect(aiContext).toContain('Field 属性 > 项目 Provider > 内置默认');
  });

  it('AC-03: 包含写码前现场读取配置的四个搜索词', () => {
    expect(aiContext).toContain('<ProComponentProvider');
    expect(aiContext).toContain('componentVars');
    expect(aiContext).toContain('componentMap');
    expect(aiContext).toContain(':locale=');
  });

  it('AC-04: 硬规则要求生成代码前搜索项目源码', () => {
    expect(aiContext).toContain('先全局搜索项目源码');
  });

  it('AC-05: 内置默认表导语声明以现场读取的实际配置为准', () => {
    expect(aiContext).toContain('以现场读取的实际配置为准');
  });

  it('AC-06: 反模式含「不读 Provider 实际配置就写代码」条目', () => {
    expect(aiContext).toContain('不读项目 `ProComponentProvider` 实际配置');
  });

  it('AC-07: 提示 componentMap 注册 key 可作 Field.component 取值', () => {
    expect(aiContext).toContain('合法的 `Field.component` 取值');
  });
});
