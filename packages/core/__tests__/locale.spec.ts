import { describe, it, expect } from 'vitest';
import {
  resolveLocaleName,
  format,
  localePacks,
  zhCN,
  zhTW,
  enUS,
} from '../src/locale';

describe('locale', () => {
  it('LC-01 resolveLocaleName(undefined/null) 回退 zh-CN', () => {
    expect(resolveLocaleName(undefined)).toBe('zh-CN');
    expect(resolveLocaleName(null)).toBe('zh-CN');
  });

  it('LC-02 语言名解析', () => {
    expect(resolveLocaleName('zh-cn')).toBe('zh-CN');
    expect(resolveLocaleName('zh')).toBe('zh-CN');
    expect(resolveLocaleName('zh-tw')).toBe('zh-TW');
    expect(resolveLocaleName('zh_TW')).toBe('zh-TW');
    expect(resolveLocaleName('zhtw')).toBe('zh-TW');
    expect(resolveLocaleName('zh-HK')).toBe('zh-TW');
    expect(resolveLocaleName('zh_hk')).toBe('zh-TW');
    expect(resolveLocaleName('zh_MO')).toBe('zh-TW');
    expect(resolveLocaleName('zh-hant')).toBe('zh-TW');
    expect(resolveLocaleName('en-US')).toBe('en-US');
    expect(resolveLocaleName('en')).toBe('en-US');
    expect(resolveLocaleName('fr')).toBe('zh-CN');
  });

  it('LC-03 format 占位符替换', () => {
    expect(format('共 {total} 条', { total: 100 })).toBe('共 100 条');
    expect(format('{unknown} 条', { total: 1 })).toBe('{unknown} 条');
    expect(format('无参数文本')).toBe('无参数文本');
  });

  it('LC-04 localePacks 三键映射与语言包对象一致', () => {
    expect(Object.keys(localePacks).sort()).toEqual([
      'en-US',
      'zh-CN',
      'zh-TW',
    ]);
    expect(localePacks['zh-CN']).toBe(zhCN);
    expect(localePacks['zh-TW']).toBe(zhTW);
    expect(localePacks['en-US']).toBe(enUS);
  });

  it('LC-05 三语言包 key 与 zh-CN 完全对齐', () => {
    const baseKeys = Object.keys(zhCN).sort();
    for (const [, pack] of Object.entries(localePacks)) {
      expect(Object.keys(pack).sort()).toEqual(baseKeys);
    }
  });

  it('LC-06 无占位符文案短路', () => {
    expect(format('普通文案', { a: 1 })).toBe('普通文案');
  });

  // ----------------------------------------------------
  // LC-07 [判别]: 三语言包文案值与占位符位置被锁定
  // ----------------------------------------------------
  it('LC-07 [判别]: 三语言包文案值抽样锁定并可经 format 集成替换', () => {
    // 判别点：文案值被改动/三包内容互换/占位符位置写错都会失败
    expect(zhCN['table.query']).toBe('查询');
    expect(zhTW['table.query']).toBe('查詢');
    expect(enUS['table.query']).toBe('Search');
    expect(zhCN['table.columnFallback']).toBe('列{index}');
    expect(zhTW['table.columnFallback']).toBe('欄{index}');
    expect(enUS['table.columnFallback']).toBe('Column {index}');
    expect(zhCN['pagination.total']).toBe('共 {total} 条');
    expect(zhTW['pagination.total']).toBe('共 {total} 筆');
    expect(enUS['pagination.total']).toBe('Total {total} items');

    // 集成：同 key 三包文案经 format 输出
    expect(format(zhCN['pagination.total'], { total: 3 })).toBe('共 3 条');
    expect(format(zhTW['pagination.total'], { total: 3 })).toBe('共 3 筆');
    expect(format(enUS['pagination.total'], { total: 3 })).toBe(
      'Total 3 items'
    );
  });

  it('LC-08 [判别]: format 占位符只解析自有属性，不走原型链', () => {
    // 判别点：继承属性（toString/constructor）不得被当作参数替换
    expect(format('{toString} {constructor}', {})).toBe(
      '{toString} {constructor}'
    );
    expect(format('{name}', { name: 'qin' })).toBe('qin');
  });
});
