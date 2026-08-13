import { Field } from '../../../types';
import { getInjectConfig } from '../../../../component-provider/constants';
import { inject } from 'vue';

type LocaleT = (
  key: string,
  params?: Record<string, string | number>
) => string;

/** 组件的占位符对应的 locale key */
const PLACEHOLDER_KEYS: Record<string, string> = {
  input: 'input.placeholder',
  textarea: 'input.placeholder',
  'input-password': 'input.placeholder',
  'input-number': 'input.placeholder',
  select: 'select.placeholder',
  cascader: 'select.placeholder',
};

/**
 * 根据组件 key 兜底生成 locale 占位符
 *
 * @description 用户通过 componentVars 或字段属性显式设置了占位符时不再兜底。
 */
const getPlaceholderProps = (
  key: string,
  injectProps: Record<string, any>,
  t: LocaleT
): Record<string, string> => {
  const placeholderKey = PLACEHOLDER_KEYS[key];
  if (!placeholderKey || injectProps.placeholder !== undefined) return {};
  return { placeholder: t(placeholderKey) };
};

export const getInitProps = (field: Field, t: LocaleT): Record<string, any> => {
  const { component } = field as any;
  const picker = component === 'date-picker' ? '' : (field as any).picker;
  if (typeof component === 'string') {
    const k = [component, picker].filter(Boolean).join('.');
    const config = getInjectConfig(k);
    if (!config) return getPlaceholderProps(k, {}, t);
    const injectProps = inject(config.injectionKey, config.default);
    return { ...injectProps, ...getPlaceholderProps(k, injectProps, t) };
  }
  return {};
};
