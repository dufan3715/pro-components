import { describe, it, expect } from 'vitest';
import { getObject, camelizeProperties } from '../src/shared/utils';

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
});
