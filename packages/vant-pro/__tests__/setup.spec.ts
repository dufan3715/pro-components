import { describe, it, expect } from 'vitest';
import { activeResizeObservers } from './setup';

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
});
