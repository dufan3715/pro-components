import { describe, it, expect } from 'vitest';
import {
  getObject,
  camelizeProperties,
  isPlainObject,
  pick,
  omit,
} from '../src/shared/utils';
import {
  isPlainObject as lodashIsPlainObject,
  pick as lodashPick,
  omit as lodashOmit,
} from 'lodash-es';

describe('utils', () => {
  it('SU-01 getObject 普通对象原样返回', () => {
    const o = { a: 1 };
    expect(getObject(o)).toBe(o);
  });

  it('SU-02 getObject 非对象返回空对象', () => {
    expect(getObject(null)).toEqual({});
    expect(getObject(undefined)).toEqual({});
    expect(getObject('str')).toEqual({});
    expect(getObject([1])).toEqual({});
  });

  it('SU-03 camelizeProperties', () => {
    expect(camelizeProperties({ 'user-name': 1, 'is-active': true })).toEqual({
      userName: 1,
      isActive: true,
    });
    expect(camelizeProperties({})).toEqual({});
  });

  describe('isPlainObject 与 lodash 差分对拍', () => {
    class CustomClass {
      foo = 1;
    }

    const testCases: [string, any][] = [
      ['纯对象字面量', {}],
      ['有属性对象', { a: 1, b: 'str' }],
      ['Object.create(null)', Object.create(null)],
      ['Object.create({})', Object.create({})],
      [
        '双空原型链 Object.create(Object.create(null))',
        Object.create(Object.create(null)),
      ],
      ['数组', []],
      ['null', null],
      ['undefined', undefined],
      ['Date', new Date()],
      ['RegExp', /abc/],
      ['Map', new Map()],
      ['Set', new Set()],
      ['Error', new Error('err')],
      ['类实例', new CustomClass()],
      ['函数', () => {}],
      ['普通函数', function test() {}],
      ['字符串', 'string'],
      ['数字', 123],
      ['布尔值', true],
      ['Symbol', Symbol('sym')],
    ];

    for (const [name, val] of testCases) {
      it(`isPlainObject 对拍: ${name}`, () => {
        const actual = isPlainObject(val);
        const expected = lodashIsPlainObject(val);
        expect(actual).toBe(expected);
      });
    }
  });

  describe('pick 与 lodash 差分对拍', () => {
    it('pick 提取自有属性与继承属性', () => {
      const parent = { inherited: 'from_parent' };
      const child = Object.create(parent);
      child.own = 'own_val';
      child.other = 123;

      const actual = pick(child, ['own', 'inherited', 'nonExist'] as any);
      const expected = lodashPick(child, [
        'own',
        'inherited',
        'nonExist',
      ] as any);
      expect(actual).toEqual(expected);
    });

    it('pick 继承原型上的 toString 方法', () => {
      const obj = {};
      const actual = pick(obj, ['toString'] as any);
      const expected = lodashPick(obj, ['toString'] as any);
      expect(actual).toEqual(expected);
    });

    it('pick 空 keys 返回空对象', () => {
      const obj = { a: 1, b: 2 };
      expect(pick(obj, [])).toEqual(lodashPick(obj, []));
    });
  });

  describe('omit 顶层 key 过滤与差分', () => {
    it('omit 顶层 key 过滤与 lodash 对拍', () => {
      const obj = { a: 1, b: 2, c: 3, d: 4 };
      const actual = omit(obj, ['a', 'c']);
      const expected = lodashOmit(obj, ['a', 'c']);
      expect(actual).toEqual(expected);
    });

    it('omit 空 keys 返回全量属性浅拷贝', () => {
      const obj = { a: 1, b: 2 };
      const actual = omit(obj, []);
      const expected = lodashOmit(obj, []);
      expect(actual).toEqual(expected);
      expect(actual).not.toBe(obj);
    });

    it('omit 过滤不存在的 key 正常返回', () => {
      const obj = { a: 1, b: 2 };
      const actual = omit(obj, ['nonExist' as any]);
      const expected = lodashOmit(obj, ['nonExist' as any]);
      expect(actual).toEqual(expected);
    });
  });
});
