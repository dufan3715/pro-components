import { describe, it, expect } from 'vitest';
import * as ElementPlusPro from '../src';

describe('SX: 公共导出冒烟测试', () => {
  it('SX-01: 核心组件与 API 必须齐全，且废弃 API 不应存在', () => {
    // 顶层核心组件导出
    expect(ElementPlusPro.ProForm).toBeDefined();
    expect(ElementPlusPro.ProTable).toBeDefined();
    expect(ElementPlusPro.ProComponentProvider).toBeDefined();

    // 核心 Hooks 导出
    expect(ElementPlusPro.useForm).toBeDefined();
    expect(ElementPlusPro.useTable).toBeDefined();
    expect(ElementPlusPro.useLocale).toBeDefined();

    // 废弃/移除的 lodash 路径操作方法不应导出
    expect((ElementPlusPro as any).get).toBeUndefined();
    expect((ElementPlusPro as any).set).toBeUndefined();
    expect((ElementPlusPro as any).toPath).toBeUndefined();
  });
});
