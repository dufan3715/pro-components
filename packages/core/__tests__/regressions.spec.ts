/**
 * 行为回归用例：字段/表格核心能力的防回归断言

 * 每条用例对应报告中的具体条目编号。
 */
import { describe, expect, it, vi } from 'vitest';
import useFields from '../src/form/useFields';
import useTable from '../src/table/useTable';
import { cloneDeep } from '../src/shared/utils';

describe('批量插入不跨位点共享对象引用', () => {
  it('useFields.appendField {all:true}：各插入位点为独立对象，互不影响', () => {
    const uf = useFields<any>([
      { path: 'a', label: 'A' },
      { path: 'b', label: 'B' },
      { path: 'c', label: 'C' },
    ]);

    uf.appendField(
      (f: any) => f.path === 'a' || f.path === 'c',
      { path: 'x', label: 'X' },
      { all: true }
    );

    // 结构：a, [x], b, c, [x]
    expect(uf.fields.value.map((f: any) => f.path)).toEqual([
      'a',
      'x',
      'b',
      'c',
      'x',
    ]);

    uf.setField('x', { label: 'X1' });

    const xs = uf.getField((f: any) => f.path === 'x', { all: true }) as any[];
    expect(xs[0].label).toBe('X1');
    expect(xs[1].label).toBe('X');
    expect(xs[0]).not.toBe(xs[1]);
  });

  it('useFields 单位点插入仍保持调用方数据联动（契约不回退）', () => {
    const inserted = { path: 'x', label: 'X' };
    const uf = useFields<any>([{ path: 'a', label: 'A' }]);
    uf.appendField('a', inserted);
    // 单位点不克隆：修改调用方对象应同步反映到字段配置（响应式代理下按值校验）
    inserted.label = 'X2';
    expect((uf.getField('x') as any)?.label).toBe('X2');
  });

  it('useTable.appendColumn {all:true}：各插入位点为独立对象且自动补齐唯一 key', () => {
    const ut = useTable<any>({
      columns: [
        { key: 'a', title: 'A' },
        { key: 'b', title: 'B' },
        { key: 'c', title: 'C' },
      ] as any,
    });

    ut.appendColumn(
      (c: any) => c.key === 'a' || c.key === 'c',
      { title: 'X' } as any,
      { all: true }
    );

    const xs = ut.columns.value.filter((c: any) => c.title === 'X');
    expect(xs.length).toBe(2);
    ut.setColumn('x' as any, { title: 'X1' } as any);
    const after = ut.columns.value.filter((c: any) => c.title === 'X');
    expect(after[1].title).toBe('X');

    // 无 key 列在两个位点应获得不同的自动生成 key
    const keys = xs.map((c: any) => c.key);
    expect(keys[0]).toBeTruthy();
    expect(keys[0]).not.toBe(keys[1]);
  });
});

describe('cloneDeep JSON 降级路径告警', () => {
  it('进入降级路径时输出一次性类型变形告警，行为保持 JSON 语义', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const input = { d: new Date('2020-01-01T00:00:00Z'), fn: () => 1 };
    const out = cloneDeep<typeof input>(input);
    // Date 在降级路径下转为字符串（既有语义，现在有明确告知）
    expect(typeof out.d).toBe('string');
    expect(out.fn).toBeUndefined();
    expect(spy.mock.calls.some(c => String(c[0]).includes('cloneDeep'))).toBe(
      true
    );
    spy.mockRestore();
  });
});
