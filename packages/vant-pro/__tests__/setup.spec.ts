import { describe, it, expect } from 'vitest';
import { activeResizeObservers } from './setup';
import { isObjectItem } from '../src/shared/core';
import { isObjectItem as isObjectItemFromSrc } from '../../core/src/shared/utils';

describe('测试基建 setup：观察者注册表', () => {
  it('SETUP-01 [判别]: disconnect 后实例条目从注册表移除', () => {
    const roBefore = activeResizeObservers.size;
    const ro = new (globalThis.ResizeObserver as any)(() => {});
    ro.observe(document.body);
    expect(activeResizeObservers.size).toBe(roBefore + 1);

    ro.disconnect();
    expect(activeResizeObservers.size).toBe(roBefore);
  });

  it('SETUP-02 [判别]: unobserve 仅移除元素，不注销实例条目', () => {
    const before = activeResizeObservers.size;
    const ro = new (globalThis.ResizeObserver as any)(() => {});
    ro.observe(document.body);
    ro.unobserve(document.body);
    expect(activeResizeObservers.size).toBe(before + 1);
    ro.disconnect();
    expect(activeResizeObservers.size).toBe(before);
  });

  it('SETUP-03 [判别]: core 经包名解析到源码（与直接源码导入为同一模块实例）', () => {
    // 测试期应消费 core 源码而非 es 构建产物：同一符号必须引用恒等
    expect(isObjectItem).toBe(isObjectItemFromSrc);
  });
});
