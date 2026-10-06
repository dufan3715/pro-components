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
  'pick',
  'resolveFieldIdentity',
  'resolveLocaleName',
  'set',
  'toPath',
  'useFields',
  'useForm',
  'useFormData',
  'useFormRef',
  'useSearchFormExpand',
  'useTable',
  'zhCN',
  'zhTW',
];

describe('index', () => {
  it('SX-01 公共 API 全部导出', () => {
    declaredApis.forEach(api => {
      expect((core as any)[api]).toBeDefined();
    });

    // 2.0 前身 1.x 曾透传的 lodash API，已随零依赖改造移除
    expect((core as any).omit).toBeUndefined();
  });

  // ----------------------------------------------------
  // SX-02 [判别]: 清单与运行时导出双向一致（新增/移除导出都会失败）
  // ----------------------------------------------------
  it('SX-02 [判别]: 公共 API 清单与运行时导出双向一致', () => {
    expect(Object.keys(core).sort()).toEqual([...declaredApis].sort());
    // 早期遗漏的导出：搜索表单展开 hook 与表单注入 key
    expect(typeof (core as any).useSearchFormExpand).toBe('function');
    expect(typeof (core as any).InjectionFormKey).toBe('symbol');
  });
});
