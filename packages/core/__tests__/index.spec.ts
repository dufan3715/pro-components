import { describe, it, expect } from 'vitest';
import * as core from '../src/index';

const declaredApis = [
  'DEFAULT_FIELD_IDENTITY_KEYS',
  'InjectionFormKey',
  'InjectionFormSlotsKey',
  'camelizeProperties',
  'cloneDeep',
  'createFormProxy',
  'enUS',
  'format',
  'get',
  'getObject',
  'isObjectItem',
  'isPlainObject',
  'isPromise',
  'localePacks',
  'normalizeColumn',
  'normalizeColumns',
  'normalizePathKey',
  'omit',
  'omitBy',
  'pick',
  'resolveFieldIdentity',
  'resolveLocaleName',
  'set',
  'toPath',
  'useFields',
  'useForm',
  'useFormData',
  'useFormRef',
  'useReactiveAttrs',
  'useSearchFormExpand',
  'useTable',
  'zhCN',
  'zhTW',
];

describe('index', () => {
  it('SX-01 公共 API 导出形态与常量值', () => {
    // 函数类导出：调用形态可用
    const functionApis = [
      'camelizeProperties',
      'cloneDeep',
      'createFormProxy',
      'format',
      'get',
      'getObject',
      'isObjectItem',
      'isPlainObject',
      'isPromise',
      'normalizeColumn',
      'normalizeColumns',
      'normalizePathKey',
      'omit',
      'omitBy',
      'pick',
      'resolveFieldIdentity',
      'resolveLocaleName',
      'set',
      'toPath',
      'useFields',
      'useForm',
      'useFormData',
      'useFormRef',
      'useReactiveAttrs',
      'useSearchFormExpand',
      'useTable',
    ];
    functionApis.forEach(api => {
      expect(typeof (core as any)[api]).toBe('function');
    });

    // 注入 key 与常量：断言具体形态与取值
    expect(typeof core.InjectionFormKey).toBe('symbol');
    expect(typeof core.InjectionFormSlotsKey).toBe('symbol');
    expect(core.DEFAULT_FIELD_IDENTITY_KEYS).toEqual(['name', 'path']);

    // 语言包：三键映射指向同一批语言包对象
    expect(Object.keys(core.localePacks).sort()).toEqual([
      'en-US',
      'zh-CN',
      'zh-TW',
    ]);
    expect(core.localePacks['zh-CN']).toBe(core.zhCN);
    expect(core.localePacks['zh-TW']).toBe(core.zhTW);
    expect(core.localePacks['en-US']).toBe(core.enUS);

    // lodash 同名 API 按对齐语义导出（pick / omit）
    expect((core as any).omit).toBe(core.omit);
  });

  // ----------------------------------------------------
  // SX-02 [判别]: 清单与运行时导出双向一致（新增/移除导出都会失败）
  // ----------------------------------------------------
  it('SX-02 [判别]: 公共 API 清单与运行时导出双向一致', () => {
    expect(Object.keys(core).sort()).toEqual([...declaredApis].sort());
  });
});
