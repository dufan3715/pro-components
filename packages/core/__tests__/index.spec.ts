import { describe, it, expect } from 'vitest';
import * as core from '../src/index';

describe('index', () => {
  it('SX-01 公共 API 全部导出', () => {
    const apis = [
      'useForm',
      'useFields',
      'useFormData',
      'useFormRef',
      'useTable',
      'normalizeColumn',
      'normalizeColumns',
      'getObject',
      'camelizeProperties',
      'getByPath',
      'setByPath',
      'normalizePathKey',
      'omit',
      'pick',
      'cloneDeep',
      'isPlainObject',
      'zhCN',
      'zhTW',
      'enUS',
      'localePacks',
      'resolveLocaleName',
      'format',
    ];

    apis.forEach(api => {
      expect((core as any)[api]).toBeDefined();
    });

    expect((core as any).get).toBeUndefined();
    expect((core as any).set).toBeUndefined();
    expect((core as any).toPath).toBeUndefined();
  });
});
