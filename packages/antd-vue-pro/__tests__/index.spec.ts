import { describe, it, expect } from 'vitest';
import * as AntdVuePro from '../src';

describe('SX: 公共导出冒烟测试', () => {
  it('SX-01: 核心组件与 API 必须齐全，且废弃 API 不应存在', () => {
    // 顶层核心组件导出
    expect(AntdVuePro.ProForm).toBeDefined();
    expect(AntdVuePro.ProTable).toBeDefined();
    expect(AntdVuePro.ProComponentProvider).toBeDefined();

    // 核心 Hooks 导出
    expect(AntdVuePro.useForm).toBeDefined();
    expect(AntdVuePro.useTable).toBeDefined();
    expect(AntdVuePro.useLocale).toBeDefined();

    // 废弃/移除的 lodash 路径操作方法不应导出
    expect((AntdVuePro as any).get).toBeUndefined();
    expect((AntdVuePro as any).set).toBeUndefined();
    expect((AntdVuePro as any).toPath).toBeUndefined();
  });
});
