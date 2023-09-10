/* eslint-disable no-new-func */
import { h } from 'vue';
import { ArrowFunctionRegexp, FunctionRegexp } from '../constants';

/**
 * @description 判断是否是函数字符串
 * @param {string} param
 * @returns {boolean}
 */
export const isFunctionString = (param: string): boolean => {
  FunctionRegexp.lastIndex = 0;
  ArrowFunctionRegexp.lastIndex = 0;
  return FunctionRegexp.test(param) || ArrowFunctionRegexp.test(param);
};

export const jsonStringifyReplacer = (k: string, v: any) => {
  if (v instanceof RegExp || typeof v === 'function') {
    return v.toString();
  }
  return v;
};

export const jsonParseReviver = (k: string, v: any) => {
  if (typeof v === 'string') {
    if (v.match(/^\/(.+?)\/(i|g|m|s|u|y)*?$/g)) {
      return new Function(`return ${v}`)();
    }
    if (isFunctionString(v)) {
      return new Function('h', `return ${v}`)(h);
    }
  }
  return v;
};
