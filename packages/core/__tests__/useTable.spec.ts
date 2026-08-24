import { describe, it, expect } from 'vitest';
import { isReactive, toRaw } from 'vue';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import useTable, {
  normalizeColumn,
  normalizeColumns,
} from '../src/table/useTable';

describe('useTable', () => {
  it('TT-01 默认值', () => {
    const { columns, dataSource, pageParam } = useTable({});
    expect(columns.value).toEqual([]);
    expect(dataSource.value).toEqual([]);
    expect(pageParam).toEqual({ current: 1, pageSize: 10, total: 0 });
  });

  it('TT-02 pageParam 为 reactive', () => {
    const { pageParam } = useTable({});
    expect(isReactive(pageParam)).toBe(true);
  });

  it('TT-03 normalizeColumn key 已存在不动', () => {
    const col = normalizeColumn({ key: 'a' });
    expect(col.key).toBe('a');
  });

  it('TT-04 key 回退链', () => {
    expect(normalizeColumn({ dataIndex: 'a' } as any).key).toBe('a');
    expect(normalizeColumn({ prop: 'b' } as any).key).toBe('b');
    expect(normalizeColumn({ columnKey: 'c' } as any).key).toBe('c');
    expect(normalizeColumn({ title: 'none' } as any).key).toMatch(
      /^__col_\d+$/
    );
  });

  it('TT-05 dataIndex 数组 join', () => {
    const col = normalizeColumn({ dataIndex: ['a', 'b'] } as any);
    expect(col.key).toBe('a.b');
  });

  it('TT-06 冻结对象浅拷贝补 key', () => {
    const col = Object.freeze({ title: 'x' });
    const norm = normalizeColumn(col);
    expect((col as any).key).toBeUndefined();
    expect(norm.key).toMatch(/^__col_\d+$/);
  });

  it('TT-07 children 递归补 key', () => {
    const norm = normalizeColumn({
      title: 'g',
      children: [{ title: 'c1' }],
    } as any);
    expect(norm.children?.[0]?.key).toBeDefined();
    expect(norm.children?.[0]?.key).toMatch(/^__col_\d+$/);
  });

  it('TT-08 非数组输入返回空数组', () => {
    expect(normalizeColumns('x' as any)).toEqual([]);
  });

  it('TT-09 模块级种子递增', () => {
    const c1 = normalizeColumn({ title: 'x' });
    const c2 = normalizeColumn({ title: 'x' });
    expect(c1.key).not.toBe(c2.key);
  });

  it('TT-10 setColumn merge 原地合并', () => {
    const { columns, setColumn } = useTable<any>({
      columns: [{ key: 'name', title: '旧', width: 100 }],
    });
    setColumn('name', { title: '新' } as any);
    expect(columns.value[0].title).toBe('新');
    expect(columns.value[0].width).toBe(100);
  });

  it('TT-11 setColumn rewrite 替换并继承 key', () => {
    const { columns, setColumn } = useTable<any>({
      columns: [{ key: 'name', title: '旧', width: 100 }],
    });
    setColumn('name', { title: '新' } as any, { updateType: 'rewrite' });
    expect(columns.value[0].key).toBe('name');
    expect(columns.value[0].title).toBe('新');
    expect(columns.value[0].width).toBeUndefined();
  });

  it('TT-12 setColumn fn updater', () => {
    const { columns, setColumn } = useTable<any>({
      columns: [{ key: 'name', title: '标题' }],
    });
    setColumn('name', (pre: any) => ({ ...pre, title: pre.title + '!' }));
    expect(columns.value[0].title).toBe('标题!');
  });

  it('TT-13 deleteColumn 字符串 key', () => {
    const { columns, deleteColumn } = useTable<any>({
      columns: [{ key: 'a' }, { key: 'age' }, { key: 'b' }],
    });
    deleteColumn('age');
    expect(columns.value.map((c: any) => c.key)).toEqual(['a', 'b']);
  });

  it('TT-14 deleteColumn 函数+all:true 正确删除', () => {
    const { columns, deleteColumn } = useTable<any>({
      columns: [
        { key: 'a', title: 'A' },
        { key: 'b', title: 'B' },
        { key: 'c', title: 'C' },
        { key: 'd', title: 'D' },
      ],
    });
    deleteColumn((c: any) => ['A', 'B', 'C'].includes(c.title), { all: true });
    expect(columns.value.map((c: any) => c.key)).toEqual(['d']);
  });

  it('TT-14b deleteColumn 父列与 children 同时匹配删除无异常', () => {
    const { columns, deleteColumn } = useTable<any>({
      columns: [
        {
          key: 'parent',
          hidden: true,
          children: [{ key: 'child', hidden: true }],
        },
        { key: 'keep', hidden: false },
      ],
    });
    expect(() => {
      deleteColumn((c: any) => c.hidden, { all: true });
    }).not.toThrow();
    expect(columns.value.map((c: any) => c.key)).toEqual(['keep']);
  });

  it('TT-15 appendColumn 追加', () => {
    const { columns, appendColumn } = useTable<any>({
      columns: [{ key: 'a' }, { key: 'b' }],
    });
    appendColumn('a', { key: 'x' });
    expect(columns.value.map((c: any) => c.key)).toEqual(['a', 'x', 'b']);
    appendColumn(undefined, { key: 'y' });
    expect(columns.value.map((c: any) => c.key)).toEqual(['a', 'x', 'b', 'y']);
  });

  it('TT-16 prependColumn 前插', () => {
    const { columns, prependColumn } = useTable<any>({
      columns: [{ key: 'a' }, { key: 'b' }],
    });
    prependColumn('b', { key: 'x' });
    expect(columns.value.map((c: any) => c.key)).toEqual(['a', 'x', 'b']);
    prependColumn(undefined, { key: 'y' });
    expect(columns.value.map((c: any) => c.key)).toEqual(['y', 'a', 'x', 'b']);
  });

  it('TT-17 [红] append/prependColumn 函数+all:true 必须终止', () => {
    const entry = pathToFileURL(path.resolve(__dirname, '../es/index.js')).href;
    const script = `
      import('${entry}').then(({ useTable }) => {
        const t = useTable({
          columns: [{ key: 'a', title: 'A' }, { key: 'b', title: 'B' }],
        });
        t.appendColumn(() => true, { key: 'x', title: 'X' }, { all: true });
        t.prependColumn(() => true, { key: 'y', title: 'Y' }, { all: true });
        console.log('OK');
      });
    `;
    expect(() =>
      execFileSync(process.execPath, ['--input-type=module', '-e', script], {
        timeout: 5000,
        cwd: path.resolve(__dirname, '..'),
      })
    ).not.toThrow();
  });

  it('TT-18 setPageParam 部分/函数式/多余 key 丢弃', () => {
    const { pageParam, setPageParam } = useTable<any>({});
    setPageParam({ current: 2 });
    expect(pageParam.current).toBe(2);
    setPageParam((pre: any) => ({ pageSize: pre.pageSize + 10 }));
    expect(pageParam.pageSize).toBe(20);
    setPageParam({ foo: 1 } as any);
    expect('foo' in pageParam).toBe(false);
  });

  it('TT-19 resetQueryParams 恢复初始', () => {
    const { pageParam, searchForm, setPageParam, resetQueryParams } =
      useTable<any>({
        pageParam: { current: 3, pageSize: 20, total: 5 },
        searchParam: { keyword: 'x' },
        searchFields: [{ path: 'keyword' }],
      });
    setPageParam({ current: 1, total: 99 });
    searchForm.setFormData('keyword', 'y');
    searchForm.setFormData('extra', 1);
    resetQueryParams();
    expect(pageParam).toEqual({ current: 3, pageSize: 20, total: 5 });
    expect(searchForm.formData.keyword).toBe('x');
    expect('extra' in searchForm.formData).toBe(false);
    expect(searchForm.fields.value.length).toBe(1);
  });

  it('TT-20 searchForm 独立根表单', () => {
    const { searchForm } = useTable<any>({
      searchParam: { k: 1 },
      searchFields: [{ path: 'k' }],
    });
    expect(searchForm.formData.k).toBe(1);
    expect(searchForm.fields.value.length).toBe(1);
  });

  it('TT-21 dataSource 同一引用', () => {
    const ds = [{ id: 1 }];
    const { dataSource } = useTable<any>({ dataSource: ds });
    expect(toRaw(dataSource.value)).toBe(ds);
  });

  describe('直接变异 (DC 组)', () => {
    it('DC-01 直接变异 columns.value 后 setColumn / deleteColumn 正常操作', () => {
      const { columns, setColumn, deleteColumn } = useTable<any>({
        columns: [{ key: 'a', title: 'A' }],
      });
      columns.value.push({ key: 'b', title: 'B' });
      setColumn('b', { title: 'B-New' });
      expect(columns.value.find((c: any) => c.key === 'b')?.title).toBe(
        'B-New'
      );
      deleteColumn('a');
      expect(columns.value.map((c: any) => c.key)).toEqual(['b']);
    });
  });
});
