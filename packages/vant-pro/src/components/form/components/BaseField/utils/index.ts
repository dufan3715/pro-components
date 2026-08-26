import type { Field } from '../../../types';

type LocaleT = (
  key: string,
  params?: Record<string, string | number>
) => string;

/** 组件的占位符对应的 locale key */
const PLACEHOLDER_KEYS: Record<string, string> = {
  field: 'input.placeholder',
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
  injectProps: Record<string, any> = {},
  t: LocaleT
): Record<string, any> => {
  const { component } = field as any;
  if (typeof component === 'string') {
    return {
      ...injectProps,
      ...getPlaceholderProps(component, injectProps, t),
    };
  }
  return {};
};
