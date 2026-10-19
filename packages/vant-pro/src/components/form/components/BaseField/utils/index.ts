import type { Field } from '../../../types';

type LocaleT = (
  key: string,
  params?: Record<string, string | number>
) => string;

/** 支持占位符兜底的组件名对应的 locale key */
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

/**
 * 解析字段的 Provider 默认属性
 *
 * @description 仅字符串组件名取注入值（`field` 额外叠加占位符兜底）；组件对象无注入配置，返回空对象。
 *
 * @param field - 字段配置项
 * @param injectProps - 该组件名对应的 Provider 注入默认值
 * @param t - 翻译函数，用于兜底占位符文案
 * @returns 合并占位符兜底后的初始属性
 */
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

/** 已告警过的未知组件名（模块级去重集合） */
const warnedUnknownComponents = new Set<string>();

/**
 * 输出未识别组件名的告警
 *
 * @description 按组件名去重，同一名称仅告警一次。
 *
 * @param name - 未识别的组件名
 */
export function warnUnknownComponent(name: string) {
  if (warnedUnknownComponents.has(name)) return;
  warnedUnknownComponents.add(name);
  console.warn(
    `[pro-components] 未识别的组件类型 "${name}"，已降级为原生元素渲染。如为自定义组件请在 componentMap 或 ProComponentProvider 中注册。`
  );
}
