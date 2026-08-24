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
    expect(resolveLocaleName('en-US')).toBe('en-US');
    expect(resolveLocaleName('en')).toBe('en-US');
    expect(resolveLocaleName('fr')).toBe('zh-CN');
  });

  it('LC-03 format 占位符替换', () => {
    expect(format('共 {total} 条', { total: 100 })).toBe('共 100 条');
    expect(format('{unknown} 条', { total: 1 })).toBe('{unknown} 条');
    expect(format('无参数文本')).toBe('无参数文本');
  });

  it('LC-04 localePacks 完整性', () => {
    expect(typeof localePacks['zh-CN']).toBe('object');
    expect(typeof localePacks['zh-TW']).toBe('object');
    expect(typeof localePacks['en-US']).toBe('object');
  });

  it('LC-05 三语言包 key 一致', () => {
    const zhCNKeys = Object.keys(zhCN).sort();
    const zhTWKeys = Object.keys(zhTW).sort();
    const enUSKeys = Object.keys(enUS).sort();
    expect(zhCNKeys).toEqual(zhTWKeys);
    expect(zhCNKeys).toEqual(enUSKeys);
  });

  it('LC-06 无占位符文案短路', () => {
    expect(format('普通文案', { a: 1 })).toBe('普通文案');
  });
});
