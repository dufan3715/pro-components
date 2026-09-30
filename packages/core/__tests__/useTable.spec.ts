import { describe, it, expect } from 'vitest';
import { isReactive, toRaw } from 'vue';
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

  it('TT-01b [判别] 无参/undefined 调用回退默认配置，不崩溃', () => {
    const noArgs = useTable();
    expect(noArgs.columns.value).toEqual([]);
    expect(noArgs.dataSource.value).toEqual([]);
    expect(noArgs.pageParam).toEqual({ current: 1, pageSize: 10, total: 0 });

    const undefinedArg = useTable(undefined);
    expect(undefinedArg.columns.value).toEqual([]);
    expect(undefinedArg.pageParam).toEqual({
      current: 1,
      pageSize: 10,
      total: 0,
    });
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
    const col = Object.freeze({ title: 'x' }) as any;
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
    const c1 = normalizeColumn({ title: 'x' } as any);
    const c2 = normalizeColumn({ title: 'x' } as any);
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

  it('TT-10b [判别] setColumn merge 新增 children 就地补齐子列 key', () => {
    const { columns, setColumn, deleteColumn } = useTable<any>({
      columns: [{ key: 'x', title: 'X' }],
    });
    setColumn('x', { children: [{ title: 'raw' }] } as any);
    const child = columns.value[0].children?.[0] as any;
    // 无 key 子列补实例级种子 key
    expect(child.key).toMatch(/^__col_\d+$/);

    // 已有显式 key 的子列不被覆盖
    setColumn('x', { children: [{ key: 'explicit', title: 'kept' }] } as any);
    const child2 = columns.value[0].children?.[0] as any;
    expect(child2.key).toBe('explicit');

    // 判别点：补齐 key 后按子列 key 定位可用
    setColumn('explicit', { title: 'updated' } as any);
    expect((columns.value[0].children as any[])[0].title).toBe('updated');
    deleteColumn('explicit');
    expect((columns.value[0].children as any[]).length).toBe(0);
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

  it('TT-17 append/prependColumn 函数+all:true 必须终止', () => {
    const { columns, appendColumn, prependColumn } = useTable({
      columns: [
        { key: 'a', title: 'A' },
        { key: 'b', title: 'B' },
      ],
    });

    // 无 es 构建产物依赖：进程内断言终止性与插入结果
    expect(() => {
      appendColumn(() => true, { key: 'x', title: 'X' }, { all: true });
      prependColumn(() => true, { key: 'y', title: 'Y' }, { all: true });
    }).not.toThrow();
    expect(columns.value.length).toBeGreaterThan(2);
    expect(columns.value.every(c => !!c.key)).toBe(true);
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

  it('TT-22 [判别] 自动列 key 为实例级种子，多实例互不影响', () => {
    const t1 = useTable<any>({ columns: [{ title: 'A' }, { title: 'B' }] });
    const t2 = useTable<any>({ columns: [{ title: 'C' }] });
    expect(t1.columns.value.map(c => c.key)).toEqual(['__col_1', '__col_2']);
    // 判别点：两个实例的自动 key 序列各自独立从 1 计数，互不延续
    expect(t2.columns.value[0].key).toBe('__col_1');
  });

  it('TT-23 [判别] 动态增列沿用实例级种子序列', () => {
    const { columns, appendColumn } = useTable<any>({
      columns: [{ key: 'a' }],
    });
    appendColumn(undefined, { title: 'B' });
    appendColumn(undefined, { title: 'C' });
    expect(columns.value.map(c => c.key)).toEqual(['a', '__col_1', '__col_2']);
  });

  it('TT-24 显式 allocateKey 生效并递归至 children', () => {
    let n = 0;
    const allocate = () => `k${++n}`;
    expect(normalizeColumn({ title: 'x' } as any, allocate).key).toBe('k1');
    const cols = normalizeColumns(
      [{ title: 'p', children: [{ title: 'c' }] }] as any,
      allocate
    );
    expect(cols[0].key).toBe('k2');
    expect((cols[0].children as any)[0].key).toBe('k3');
  });

  it('TT-25 [判别] columns 整体重赋值后同步补齐 key', () => {
    const { columns } = useTable<any>({
      columns: [{ key: 'a', title: 'A' }],
    });
    const frozenCol = Object.freeze({ title: 'F' }) as any;
    columns.value = [
      { dataIndex: 'name', title: '姓名' },
      { title: '自增' },
      { key: 'explicit', title: '显式保留' },
      { title: '分组', children: [{ title: '子列' }] },
      frozenCol,
    ] as any;
    // 判别点：赋值语句返回后 key 即已补齐（无需 nextTick）
    expect(columns.value[0].key).toBe('name');
    expect(columns.value[1].key).toMatch(/^__col_\d+$/);
    expect(columns.value[2].key).toBe('explicit');
    expect((columns.value[3].children as any)[0].key).toMatch(/^__col_\d+$/);
    // 冻结列以副本替换槽位，原冻结对象不被写入
    expect(Object.isFrozen(columns.value[4])).toBe(false);
    expect(columns.value[4].key).toMatch(/^__col_\d+$/);
    expect((frozenCol as any).key).toBeUndefined();
  });

  it('TT-26 [判别] 整体重赋值保持引用与可变异语义', () => {
    const { columns, setColumn, deleteColumn } = useTable<any>({
      columns: [{ key: 'a', title: 'A' }],
    });
    const newColumns = [{ title: 'B' }, { title: 'C' }] as any;
    columns.value = newColumns;
    // 判别点：重赋值不换引用，新数组被收编为状态本体
    expect(toRaw(columns.value)).toBe(newColumns);

    // resizeColumn 式直接变异对新数组可见
    const proxyCol = columns.value[0];
    (proxyCol as any).width = 120;
    expect(newColumns[0].width).toBe(120);

    // 判别点：按补齐的 key 定位恢复可用，删除效果同步反映到原数组
    const autoKey = newColumns[0].key;
    setColumn(autoKey, { title: 'B-New' });
    expect(newColumns[0].title).toBe('B-New');
    deleteColumn(autoKey);
    expect(columns.value.length).toBe(1);
    expect(newColumns[0].title).toBe('C');
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
