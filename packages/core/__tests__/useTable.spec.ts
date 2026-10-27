import { describe, it, expect, vi } from 'vitest';
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

  // TT-47 [判别]: resetQueryParams 对分页为合并写，运行期新增键保留
  it('TT-47 [判别]: resetQueryParams 仅恢复初始化快照中的分页键，运行期新增键保留', () => {
    const { pageParam, resetQueryParams } = useTable<any>({
      pageParam: { current: 3, pageSize: 20, total: 5, sortField: 'id' },
    });
    pageParam.deptId = 1;
    pageParam.sortField = 'name';
    resetQueryParams();
    // 快照内键恢复初始值，快照外键保留
    expect(pageParam.sortField).toBe('id');
    expect(pageParam.deptId).toBe(1);
    expect(pageParam).toEqual({
      current: 3,
      pageSize: 20,
      total: 5,
      sortField: 'id',
      deptId: 1,
    });
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
  // TT-39 [判别]: 环状 children 列在多站点插入（all）下不爆栈
  // ----------------------------------------------------
  it('TT-39 [判别]: 环状 children 列多站点插入不爆栈，克隆副本按位点独立', () => {
    const cyclic: any = { title: 'cyc' };
    cyclic.children = [cyclic];
    const table = useTable<any>({
      columns: [
        { key: 'a', title: 'A' },
        { key: 'b', title: 'B' },
      ],
    });

    // 函数定位默认 all：每个匹配位点各插入一份克隆
    expect(() =>
      table.appendColumn(() => true, cyclic, { all: true })
    ).not.toThrow();
    expect(table.columns.value).toHaveLength(4);

    // 判别点：每个位点的克隆副本各自成环，位点之间不共享对象
    const inserted = [table.columns.value[1], table.columns.value[3]] as any[];
    for (const column of inserted) {
      expect(column.children[0]).toBe(column);
      expect(column.key).toBeTruthy();
    }
    expect(inserted[0]).not.toBe(inserted[1]);
  });

  // ----------------------------------------------------
  // TT-40 [判别]: 非法列项与数字 key 的列操作兼容
  // ----------------------------------------------------
  it('TT-40 [判别]: columns 含 null 项时列操作不抛错，数字 key 按字符串形态命中', () => {
    const table = useTable<any>({
      columns: [{ key: 1 as any, title: 'A' }],
    });
    // 运行期 push 非法列项：遍历与更新不得读取空项属性
    table.columns.value.push(null as any);
    table.columns.value.push(undefined as any);

    expect(() => table.setColumn(1 as any, { title: 'A2' })).not.toThrow();
    expect((table.columns.value[0] as any).title).toBe('A2');

    // 判别点：数字 key 与字符串入参均可命中同一列
    expect(() => table.setColumn('1' as any, { title: 'A3' })).not.toThrow();
    expect((table.columns.value[0] as any).title).toBe('A3');

    expect(() =>
      table.appendColumn(1 as any, { key: 'b' } as any)
    ).not.toThrow();
    expect(() => table.deleteColumn(1 as any)).not.toThrow();
    expect(table.columns.value.some((c: any) => c === null)).toBe(true);
  });

  // ----------------------------------------------------
  // TT-41 [判别]: 冻结 + 环状列连续读取不再加深副本
  // ----------------------------------------------------
  it('TT-41 [判别]: 冻结自引用列的环深度在连续读取中保持稳定', () => {
    const cyclic: any = {};
    cyclic.children = [cyclic];
    Object.freeze(cyclic);
    const table = useTable({ columns: [cyclic] as any });

    const cycleDepth = () => {
      let node: any = table.columns.value[0];
      let depth = 0;
      const seen = new Set<object>();
      while (
        node &&
        typeof node === 'object' &&
        !seen.has(node) &&
        depth < 30
      ) {
        seen.add(node);
        depth += 1;
        node = node.children?.[0];
      }
      return depth;
    };

    // 判别点：副本环指向补 key 后的自身，连续读取不再每层加深
    expect([cycleDepth(), cycleDepth(), cycleDepth(), cycleDepth()]).toEqual([
      1, 1, 1, 1,
    ]);
    expect(table.columns.value[0].children?.[0]).toBe(table.columns.value[0]);
    expect(table.columns.value[0].children?.[0]?.key).toBeTruthy();

    // 反向约束：非冻结环仍保持原对象自引用
    const raw: any = { key: 'raw' };
    raw.children = [raw];
    const rawTable = useTable({ columns: [raw] as any });
    expect(rawTable.columns.value[0].children?.[0]).toBe(
      rawTable.columns.value[0]
    );
    expect(rawTable.columns.value[0].children?.[0]?.key).toBe('raw');
  });

  // ----------------------------------------------------
  // TT-42 [判别]: 直接 push 的无 key 列在读取时补齐且幂等
  // ----------------------------------------------------
  it('TT-42 [判别]: columns 读取期补齐外部直接追加列，重复读取不再变化', () => {
    const table = useTable({
      columns: [{ dataIndex: 'name' }] as any,
    });
    // 绕过列操作 API 直接追加，模拟外部改写
    table.columns.value.push({ dataIndex: 'late' } as any);

    const first = table.columns.value[1] as any;
    // 判别点：读取时按 dataIndex 补齐 key
    expect(first.key).toBe('late');

    // 幂等：已补齐的列不再被替换，重复读取身份稳定
    const second = table.columns.value[1] as any;
    expect(second).toBe(first);
    expect(second.key).toBe('late');
  });

  // ----------------------------------------------------
  // TT-43 [判别]: 直接写入冻结列被跳过并提示一次
  // ----------------------------------------------------
  it('TT-43 [判别]: 冻结 children 的运行时写入不抛错、提示一次，受支持入口仍补齐 key', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const table = useTable({ columns: [{ key: 'root' }] as any });

    const frozenParent = Object.freeze({
      key: 'p',
      children: Object.freeze([Object.freeze({ dataIndex: 'lateChild' })]),
    });
    table.columns.value.push(frozenParent as any);

    // 判别点：读取不再抛 TypeError，冻结 children 不被改写
    let parent: any;
    expect(() => {
      parent = table.columns.value[1];
    }).not.toThrow();
    expect(parent.children[0].key).toBeUndefined();

    // 重复读取只提示一次，且提示包含受支持入口
    expect(table.columns.value[1]).toBe(parent);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(
      warnSpy.mock.calls.some(args =>
        String(args[0]).includes('不支持直接向 columns 写入冻结列')
      )
    ).toBe(true);
    expect(String(warnSpy.mock.calls[0][0])).toContain('prependColumn');

    // 每个表格实例独立提示一次
    const second = useTable({ columns: [{ key: 'root2' }] as any });
    second.columns.value.push(
      Object.freeze({
        key: 'p2',
        children: Object.freeze([Object.freeze({ dataIndex: 'x2' })]),
      }) as any
    );
    expect(second.columns.value[1]).toBeDefined();
    expect(warnSpy).toHaveBeenCalledTimes(2);

    // 受支持入口：appendColumn 复制冻结列并补齐嵌套 key
    table.appendColumn(
      undefined,
      Object.freeze({
        key: 'q',
        children: Object.freeze([Object.freeze({ dataIndex: 'child' })]),
      }) as any
    );
    const appended = table.columns.value[2] as any;
    expect(appended.children[0].key).toBe('child');

    // 受支持入口：prependColumn 同样复制冻结列并补齐嵌套 key
    table.prependColumn(
      undefined,
      Object.freeze({
        key: 'r',
        children: Object.freeze([Object.freeze({ dataIndex: 'preChild' })]),
      }) as any
    );
    const prepended = table.columns.value[0] as any;
    expect(prepended.children[0].key).toBe('preChild');

    warnSpy.mockRestore();
  });

  // ----------------------------------------------------
  // TT-44 [判别]: 冻结 a↔b 互引用初始列
  // ----------------------------------------------------
  it('TT-44 [判别]: 冻结互引用分组列两层 key 补齐且读取深度稳定', () => {
    const a: any = { title: 'A' };
    const b: any = { title: 'B' };
    a.children = [b];
    b.children = [a];
    Object.freeze(a);
    Object.freeze(b);
    const table = useTable({ columns: [a] as any });

    const depth = () => {
      let node: any = table.columns.value[0];
      let d = 0;
      const seen = new Set<object>();
      while (node && typeof node === 'object' && !seen.has(node) && d < 20) {
        seen.add(node);
        d += 1;
        node = node.children?.[0];
      }
      return d;
    };

    // 判别点：副本两层均补齐 key，互引用成环后连续读取深度稳定
    expect(table.columns.value[0].key).toBeTruthy();
    expect((table.columns.value[0] as any).children[0].key).toBeTruthy();
    expect([depth(), depth(), depth()]).toEqual([2, 2, 2]);
    // 原冻结对象未被改写
    expect(a.key).toBeUndefined();
    expect(b.key).toBeUndefined();
  });

  // ----------------------------------------------------
  // TT-45 [判别]: setColumn merge 冻结列不抛错，调用方 children 数组不被替换
  // ----------------------------------------------------
  it('TT-45 [判别]: merge 冻结列不再抛错，调用方 children 数组不被替换', () => {
    const table = useTable({
      columns: [
        { key: 'a', title: 'A', children: [{ key: 'x', title: 'X' }] },
      ] as any,
    });

    const frozenChild = Object.freeze({ dataIndex: 'y', title: 'Y' });
    const frozenChildren = Object.freeze([frozenChild]);
    const frozen = Object.freeze({ title: 'A2', children: frozenChildren });

    // 判别点：冻结列 merge 不再抛 TypeError
    expect(() => table.setColumn('a', frozen as any)).not.toThrow();
    const column = table.columns.value[0] as any;
    expect(column.title).toBe('A2');
    // 未显式指定 key 时继承原列 key
    expect(column.key).toBe('a');
    expect(column.children[0].key).toBe('y');
    // 调用方冻结对象与 children 数组未被改写
    expect(column.children).not.toBe(frozenChildren);
    expect((frozen as any).children).toBe(frozenChildren);
    expect((frozenChild as any).key).toBeUndefined();

    // 可扩展 value：children 数组不被替换（子列对象按需就地补 key）
    const child: any = { dataIndex: 'z', title: 'Z' };
    const value: any = { title: 'A3', children: [child] };
    table.setColumn('a', value as any);
    const mergedColumn = table.columns.value[0] as any;
    expect(mergedColumn.children[0].key).toBe('z');
    expect(mergedColumn.children).not.toBe(value.children);
    expect(value.children[0]).toBe(child);

    // rewrite：冻结列可用，标题覆盖、子列补 key、未指定 key 时继承原列
    table.setColumn(
      'a',
      Object.freeze({
        title: 'A4',
        children: Object.freeze([Object.freeze({ dataIndex: 'rewriteChild' })]),
      }) as any,
      { updateType: 'rewrite' }
    );
    const rewritten = table.columns.value.find(
      (c: any) => c.key === 'a'
    ) as any;
    expect(rewritten.title).toBe('A4');
    expect(rewritten.children[0].key).toBe('rewriteChild');
  });

  // ----------------------------------------------------
  // TT-46 [判别]: 冻结 children 的缺失 key 检查只执行一次
  // ----------------------------------------------------
  it('TT-46 [判别]: 冻结 children 重复读取不重复扫描子列', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    let keyReads = 0;
    const child = Object.freeze(
      Object.defineProperty({ dataIndex: 'x' }, 'key', {
        get() {
          keyReads += 1;
          return undefined;
        },
        enumerable: true,
      })
    );
    const frozenChildren = Object.freeze([child]);
    const table = useTable({ columns: [{ key: 'root' }] as any });
    table.columns.value.push(
      Object.freeze({ key: 'p', children: frozenChildren }) as any
    );

    const first = table.columns.value;
    const second = table.columns.value;
    const third = table.columns.value;
    expect(first).toBe(second);
    expect(second).toBe(third);

    // 判别点：同一冻结数组只扫描一次
    expect(keyReads).toBe(1);
    warnSpy.mockRestore();
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

  // ----------------------------------------------------
  // TT-38 [判别]: fieldIdentityKeys 透传至 searchForm 的字段标识解析
  // ----------------------------------------------------
  it('TT-38 [判别]: fieldIdentityKeys 决定 searchForm 字段查找与读写标识', () => {
    const propOnly = useTable<any>({
      searchParam: { keyword: '' },
      searchFields: [{ prop: 'keyword' }],
      fieldIdentityKeys: ['prop', 'path'],
    });
    // 判别点：prop-only 字段在自定义键序下可被命中，而非按默认 name/path 落空
    expect(propOnly.searchForm.getField('keyword')).toBeTruthy();
    propOnly.searchForm.setField('keyword', { label: '关键词' });
    expect(propOnly.searchForm.getField('keyword')?.label).toBe('关键词');

    // 反向约束：默认键序下同一字段落空，说明结果由入参而非其它口径决定
    const defaultKeys = useTable<any>({
      searchParam: { keyword: '' },
      searchFields: [{ prop: 'keyword' }],
    });
    expect(defaultKeys.searchForm.getField('keyword')).toBeUndefined();
  });
});
