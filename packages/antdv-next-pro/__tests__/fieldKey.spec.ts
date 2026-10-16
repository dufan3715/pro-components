/**
 * 字段渲染 key 直接单测
 *
 * @description 按模块直接调用者口径锁定两条路径：对象项以 `toRaw` 身份绑定（弱引用缓存 + 自增编号），
 * 非对象项（`null` / 原始值）按字面量生成稳定 key。渲染路径传入的字段项已由调用方过滤为非 null 对象，
 * 该回退分支由本文件直接覆盖。
 */
import { describe, it, expect } from 'vitest';
import { reactive } from 'vue';
import { getFieldKey } from '../src/components/form/utils/fieldKey';

describe('fieldKey', () => {
  it('FK-A1 [判别]: 同一字段对象恒得同一 key，不同字段对象 key 不同', () => {
    const a = { path: 'a' };
    const b = { path: 'b' };

    expect(getFieldKey(a)).toBe(getFieldKey(a));
    expect(getFieldKey(a)).not.toBe(getFieldKey(b));
  });

  it('FK-A2 [判别]: 响应式代理与原始对象得同一 key', () => {
    const raw = { path: 'a' };

    expect(getFieldKey(reactive(raw))).toBe(getFieldKey(raw));
  });

  it('FK-A3 [判别]: 非对象项按字面量生成稳定 key', () => {
    expect(getFieldKey(null)).toBe('raw_null');
    expect(getFieldKey(undefined)).toBe('raw_undefined');
    expect(getFieldKey('not-a-field')).toBe('raw_not-a-field');
    expect(getFieldKey(0)).toBe('raw_0');
    // 同一字面量多次调用得到同一 key
    expect(getFieldKey('x')).toBe(getFieldKey('x'));
    // 不同字面量不共享 key
    expect(getFieldKey('x')).not.toBe(getFieldKey('y'));
  });

  it('FK-A4 [判别]: 数组重排后 key 仍与字段对象绑定', () => {
    const a = { path: 'a' };
    const b = { path: 'b' };
    const [keyA, keyB] = [a, b].map(getFieldKey);

    expect([b, a].map(getFieldKey)).toEqual([keyB, keyA]);
  });
});
