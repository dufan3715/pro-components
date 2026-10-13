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

  it('TT-21 [判别] dataSource 内部浅拷贝：元素共享、内部增删不修改调用方数组', () => {
    const ds = [{ id: 1 }];
    const { dataSource } = useTable<any>({ dataSource: ds });

    expect(toRaw(dataSource.value)).not.toBe(ds);
    expect(toRaw(dataSource.value[0])).toBe(ds[0]);

    dataSource.value.push({ id: 2 });
    expect(ds).toHaveLength(1);
    expect(ds).toEqual([{ id: 1 }]);
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

  it('TT-26 [判别] 整体重赋值收编浅拷贝：不替换调用方数组，元素级变异仍同步', () => {
    const { columns, setColumn, deleteColumn } = useTable<any>({
      columns: [{ key: 'a', title: 'A' }],
    });
    const newColumns = [{ title: 'B' }, { title: 'C' }] as any;
    const snapshot = [...newColumns];
    columns.value = newColumns;
    // 判别点：状态持有浅拷贝，调用方数组不被收编为状态本体（元素仍共享）
    expect(toRaw(columns.value)).not.toBe(newColumns);
    expect(toRaw(columns.value[0])).toBe(newColumns[0]);

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
    // 内部删除只作用于内部数组，调用方数组长度不变
    expect(newColumns).toHaveLength(snapshot.length);
  });

  describe('直接变异 (DC 组)', () => {
    it('TT-27 [判别] columns 元素级变异后读取即补齐唯一 key，且不覆盖显式 key', () => {
      const rawColumns = [{ dataIndex: 'a', title: 'A' }] as any[];
      const { columns } = useTable({ columns: rawColumns });

      // 元素级 push 与索引赋值均不经过整体重赋值
      columns.value.push({ dataIndex: 'b', title: 'B' } as any);
      columns.value[0] = { dataIndex: 'c', title: 'C' } as any;

      const keys = columns.value.map(col => col.key);
      expect(keys).toEqual(['c', 'b']);
      expect(new Set(keys).size).toBe(2);

      // 显式 key 不被覆盖；读取返回同一数组与同一元素引用
      columns.value.push({ key: 'keep', title: 'K' } as any);
      expect(columns.value[2].key).toBe('keep');
      expect(columns.value).toBe(columns.value);
      expect(columns.value[0]).toBe(columns.value[0]);

      // 内部数组与调用方数组解耦：状态持有浅拷贝，索引赋值不反作用于调用方数组
      expect(toRaw(columns.value)).not.toBe(rawColumns);
      expect(rawColumns).toHaveLength(1);
      expect(rawColumns[0].dataIndex).toBe('a');
    });

    it('TT-28 [判别] 元素级插入的分组列在读取时递归补齐 children 的 key', () => {
      const { columns } = useTable({
        columns: [{ dataIndex: 'a', title: 'A' }] as any,
      });

      columns.value.push({
        title: '分组',
        children: [{ dataIndex: 'b', title: 'B' }, { title: 'C' }],
      } as any);

      const group = columns.value[1] as any;
      // 显式可推导 key 保留（dataIndex 回退），无来源项走自增兜底且互不重复
      expect(group.children[0].key).toBe('b');
      expect(typeof group.children[1].key).toBe('string');
      expect(group.children[1].key.length).toBeGreaterThan(0);
      expect(group.children[1].key).not.toBe(group.children[0].key);
    });

    it('DC-01 直接变异 columns.value 后 setColumn / deleteColumn 正常操作', () => {
      const { columns, setColumn, deleteColumn } = useTable<any>({
        columns: [{ key: 'a', title: 'A' }],
      });
      // 元素级推入的无 key 列：读取时经补齐路径获得自增 key（仅带 key 的列覆盖不到该路径）
      columns.value.push({ title: 'B' });
      const autoKey = columns.value[1].key as string;
      expect(autoKey).toMatch(/^__col_\d+$/);

      // 判别点：按补齐后的 key 定位，setColumn 精确命中该列
      setColumn(autoKey, { title: 'B-New' });
      expect(columns.value[1].title).toBe('B-New');

      // 判别点：deleteColumn 按同一补齐 key 命中，仅删除该列
      deleteColumn(autoKey);
      expect(columns.value.map((c: any) => c.key)).toEqual(['a']);

      deleteColumn('a');
      expect(columns.value).toEqual([]);
    });
  });

  // ----------------------------------------------------
  // TT-29 [判别]: 数字 key 0 作为合法列标识（不再被 falsy 守卫吞掉）
  // ----------------------------------------------------
  it('TT-29 [判别]: setColumn/deleteColumn 支持数字 key 0', () => {
    const { columns, setColumn, deleteColumn } = useTable<any>({
      columns: [
        { key: '0', title: '零' },
        { key: 'a', title: 'A' },
      ],
    });

    // 更新命中（此前 !0 直接 return）
    setColumn(0 as any, { title: '零改' });
    expect((columns.value[0] as any).title).toBe('零改');

    // 删除命中
    deleteColumn(0 as any);
    expect(columns.value.map((c: any) => c.key)).toEqual(['a']);
  });

  // ----------------------------------------------------
  // TT-30 [判别]: 非数组入参回退空数组（不抛 TypeError）
  // ----------------------------------------------------
  it('TT-30 [判别]: columns/dataSource 非数组入参回退空数组', () => {
    expect(() =>
      useTable<any>({ columns: { a: 1 } as any, dataSource: { a: 1 } as any })
    ).not.toThrow();
    const obj = useTable<any>({
      columns: { a: 1 } as any,
      dataSource: { a: 1 } as any,
    });
    expect(obj.columns.value).toEqual([]);
    expect(obj.dataSource.value).toEqual([]);

    // 字符串入参不按字符拆段
    const str = useTable<any>({
      columns: 'oops' as any,
      dataSource: 'oops' as any,
    });
    expect(str.columns.value).toEqual([]);
    expect(str.dataSource.value).toEqual([]);

    // undefined 走默认空数组
    const undef = useTable<any>({
      columns: undefined as any,
      dataSource: undefined as any,
    });
    expect(undef.columns.value).toEqual([]);
    expect(undef.dataSource.value).toEqual([]);

    // columns 整体重赋值同样兜底
    expect(() => {
      obj.columns.value = { a: 1 } as any;
    }).not.toThrow();
    expect(obj.columns.value).toEqual([]);
    str.columns.value = 'oops' as any;
    expect(str.columns.value).toEqual([]);
  });

  // ----------------------------------------------------
  // TT-31 [判别]: append/prependColumn 的数字 0 与空字符串路径边界
  // ----------------------------------------------------
  it("TT-31 [判别]: appendColumn/prependColumn 的 0 走匹配分支；'' 按 key 严格匹配", () => {
    const matched = useTable<any>({
      columns: [
        { key: '0', title: '零' },
        { key: 'a', title: 'A' },
      ],
    });
    matched.appendColumn(0 as any, { key: 'x' } as any);
    expect(matched.columns.value.map((c: any) => c.key)).toEqual([
      '0',
      'x',
      'a',
    ]);
    matched.prependColumn(0 as any, { key: 'y' } as any);
    expect(matched.columns.value.map((c: any) => c.key)).toEqual([
      'y',
      '0',
      'x',
      'a',
    ]);

    // 无 key 为 '0' 的列：零命中，不插入（不回退顶层插入）
    const unmatched = useTable<any>({ columns: [{ key: 'a' }, { key: 'b' }] });
    unmatched.appendColumn(0 as any, { key: 'x' } as any);
    unmatched.prependColumn(0 as any, { key: 'y' } as any);
    expect(unmatched.columns.value.map((c: any) => c.key)).toEqual(['a', 'b']);

    // '' 为合法列 key：精确命中该列
    const emptyKey = useTable<any>({ columns: [{ key: 'a' }, { key: '' }] });
    emptyKey.appendColumn('' as any, { key: 'x' } as any);
    expect(emptyKey.columns.value.map((c: any) => c.key)).toEqual([
      'a',
      '',
      'x',
    ]);

    // 无空 key 列：零命中
    const noEmpty = useTable<any>({ columns: [{ key: 'a' }] });
    noEmpty.appendColumn('' as any, { key: 'x' } as any);
    expect(noEmpty.columns.value.map((c: any) => c.key)).toEqual(['a']);
  });

  // ----------------------------------------------------
  // TT-35 [判别]: 多位点插入的列 key 全量唯一
  // ----------------------------------------------------
  it('TT-35 [判别]: append/prependColumn 多位点插入的列（含显式 key 与子列）key 全量唯一', () => {
    const table = useTable<any>({
      columns: [
        { key: 'a', title: 'A' },
        { key: 'b', title: 'B' },
        { key: 'c', title: 'C' },
      ],
    });

    // 带显式 key 与子列的列配置在多个位点插入
    table.appendColumn(
      (c: any) => c.key === 'a' || c.key === 'c',
      {
        key: 'x',
        title: 'X',
        children: [{ key: 'x1', title: 'X1' }],
      } as any,
      { all: true }
    );

    const flat: any[] = [];
    const collect = (list: any[]) => {
      list.forEach(col => {
        flat.push(col);
        if (Array.isArray(col.children)) collect(col.children);
      });
    };
    collect(table.columns.value as any);
    const keys = flat.map(col => col.key);

    // 判别点：逐层 key 全量唯一（旧实现会产生 ["a","x","b","x","c","x"]）
    expect(keys).toHaveLength(new Set(keys).size);
    expect(keys.filter(key => String(key).startsWith('__col_'))).toHaveLength(
      4
    );

    // 每个位点为独立对象，子列对象与子列数组同样不共享
    const xs = (table.columns.value as any[]).filter(col => col.title === 'X');
    expect(xs).toHaveLength(2);
    expect(xs[0]).not.toBe(xs[1]);
    expect(xs[0].children[0]).not.toBe(xs[1].children[0]);
    expect(xs[0].children).not.toBe(xs[1].children);

    // 前缀插入同样逐层唯一，插入对象不被回写显式 key
    const prepended = useTable<any>({
      columns: [{ key: 'a' }, { key: 'b' }],
    });
    const inserted = { key: 'x', title: 'X' };
    prepended.prependColumn(() => true, inserted as any, { all: true });
    const prependKeys = (prepended.columns.value as any[]).map(c => c.key);
    expect(prependKeys).toHaveLength(new Set(prependKeys).size);
    expect(prependKeys.filter(key => key === 'x')).toHaveLength(0);
    expect(inserted.key).toBe('x');
  });

  // ----------------------------------------------------
  // TT-36 [判别]: 环状 children 与不可扩展列对象不崩溃
  // ----------------------------------------------------
  it('TT-36 [判别]: 环状 children 不爆栈；不可扩展（seal/preventExtensions）列降级为副本', () => {
    // 自引用列配置：不再 RangeError 爆栈
    const cyclic: any = { title: 'A' };
    cyclic.children = [cyclic];
    expect(() => normalizeColumn(cyclic)).not.toThrow();
    expect(cyclic.key).toBeTruthy();
    // 环状引用原样保留，不重复展开
    expect(cyclic.children[0]).toBe(cyclic);

    // 互引用环
    const first: any = { title: 'P1' };
    const second: any = { title: 'P2' };
    first.children = [second];
    second.children = [first];
    expect(() => normalizeColumns([first, second] as any)).not.toThrow();
    expect(first.key).toBeTruthy();
    expect(second.key).toBeTruthy();

    // preventExtensions 列：降级为解冻副本，不抛 TypeError
    const sealed = Object.preventExtensions({ title: 'S' });
    const normalized = normalizeColumn(sealed as any);
    expect(normalized).not.toBe(sealed);
    expect(normalized.key).toBeTruthy();
    expect((sealed as any).key).toBeUndefined();

    // 冻结列既有的降级语义保持不变
    const frozen = Object.freeze({ title: 'F' });
    const frozenCopy = normalizeColumn(frozen as any);
    expect(frozenCopy).not.toBe(frozen);
    expect(frozenCopy.key).toBeTruthy();

    // 经 useTable 构造期同样不崩溃，环状列可被读取且 key 唯一
    const table = useTable<any>({ columns: [{ key: 'a' }, cyclic] });
    expect(() => table.columns.value).not.toThrow();
    const keys = table.columns.value.map((c: any) => c.key);
    expect(keys).toHaveLength(new Set(keys).size);
    expect((table.columns.value[1] as any).children[0]).toBe(
      table.columns.value[1]
    );

    // 环状列同样不影响增删改查的遍历终止
    expect(() => table.setColumn('a', { title: 'A2' })).not.toThrow();
    expect(() => table.appendColumn('a', { key: 'b' } as any)).not.toThrow();
    expect(table.columns.value.map((c: any) => c.key)).toEqual([
      'a',
      'b',
      cyclic.key,
    ]);
  });

  // ----------------------------------------------------
  // TT-37 [判别]: searchParam 与 pageParam 入参隔离口径一致
  // ----------------------------------------------------
  it('TT-37 [判别]: searchParam 入参不改写调用方对象，与 pageParam 同为内部副本', () => {
    const searchParam = { kw: 'a', extra: 1 };
    const table = useTable<any>({ searchParam });

    // 判别点：批量覆盖只作用于内部数据，调用方 searchParam 的 key 不被删除
    table.searchForm.setFormData({ kw: 'b' } as any);
    expect(Object.keys(searchParam).sort()).toEqual(['extra', 'kw']);
    expect(searchParam.kw).toBe('a');
    expect(table.searchForm.getFormData('kw')).toBe('b');

    // 分页参数同口径
    const pageParam = { current: 1, pageSize: 10, total: 0, custom: 'x' };
    const paged = useTable<any>({ pageParam });
    paged.setPageParam({ current: 5 });
    expect(pageParam.current).toBe(1);
    expect(paged.pageParam.current).toBe(5);
  });
});
