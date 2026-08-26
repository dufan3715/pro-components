import { Field } from '../../../types';

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
  'auto-complete': 'select.placeholder',
};

/** 根据组件 key 兜底生成 locale 占位符；已显式设置占位符（componentVars 或字段属性）时不兜底 */
const getPlaceholderProps = (
  key: string,
  injectProps: Record<string, any>,
  t: LocaleT
): Record<string, string> => {
  const placeholderKey = PLACEHOLDER_KEYS[key];
  if (!placeholderKey || injectProps.placeholder !== undefined) return {};
  return { placeholder: t(placeholderKey) };
};

export const getInitProps = (
  field: Field,
  injectProps: Record<string, any>,
  t: LocaleT
): Record<string, any> => {
  const { component } = field as any;
  const picker = component === 'date-picker' ? '' : (field as any).picker;
  if (typeof component === 'string') {
    const k = [component, picker].filter(Boolean).join('.');
    return { ...injectProps, ...getPlaceholderProps(k, injectProps, t) };
  }
  return {};
};
