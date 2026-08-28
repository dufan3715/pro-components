import { Field } from '../../../types';

type LocaleT = (
  key: string,
  params?: Record<string, string | number>
) => string;

/** 单值组件的占位符对应的 locale key */
const PLACEHOLDER_KEYS: Record<string, string> = {
  input: 'input.placeholder',
  'input.textarea': 'input.placeholder',
  'input.password': 'input.placeholder',
  'input-number': 'input.placeholder',
  autocomplete: 'input.placeholder',
  select: 'select.placeholder',
  cascader: 'select.placeholder',
  'tree-select': 'select.placeholder',
  'date-picker': 'date-picker.placeholder',
  'date-picker.date': 'date-picker.placeholder',
  'date-picker.dates': 'date-picker.placeholder',
  'date-picker.week': 'date-picker.placeholder',
  'date-picker.month': 'date-picker.placeholder',
  'date-picker.months': 'date-picker.placeholder',
  'date-picker.year': 'date-picker.placeholder',
  'date-picker.years': 'date-picker.placeholder',
  'date-picker.datetime': 'date-picker.placeholder',
  'time-picker': 'date-picker.placeholder',
  'time-select': 'date-picker.placeholder',
};

/** 区间组件 start/end 占位符对应的 locale key */
const RANGE_PLACEHOLDER_KEYS: Record<string, [string, string]> = {
  'date-picker.daterange': ['date-picker.start', 'date-picker.end'],
  'date-picker.monthrange': ['date-picker.startMonth', 'date-picker.endMonth'],
  'date-picker.yearrange': ['date-picker.startYear', 'date-picker.endYear'],
  'date-picker.datetimerange': ['date-picker.startTime', 'date-picker.endTime'],
};

/** 根据组件 key 兜底生成 locale 占位符；已显式设置占位符（componentVars 或字段属性）时不兜底 */
const getPlaceholderProps = (
  key: string,
  injectProps: Record<string, any>,
  t: LocaleT
): Record<string, string> => {
  const rangeKeys = RANGE_PLACEHOLDER_KEYS[key];
  if (rangeKeys) {
    if (
      injectProps.startPlaceholder !== undefined ||
      injectProps.placeholder !== undefined
    )
      return {};
    return {
      startPlaceholder: t(rangeKeys[0]),
      endPlaceholder: t(rangeKeys[1]),
    };
  }
  const placeholderKey = PLACEHOLDER_KEYS[key];
  if (!placeholderKey || injectProps.placeholder !== undefined) return {};
  return { placeholder: t(placeholderKey) };
};

export const getInitProps = (
  field: Field,
  injectProps: Record<string, any> = {},
  t: LocaleT
): Record<string, any> => {
  const { component, type } = field as any;
  if (typeof component === 'string') {
    const k = [component, type].filter(Boolean).join('.');
    return { ...injectProps, ...getPlaceholderProps(k, injectProps, t) };
  }
  return {};
};

/** 已告警过的未知组件名（模块级去重，避免 computed 重算导致刷屏） */
const warnedUnknownComponents = new Set<string>();

export function warnUnknownComponent(name: string) {
  if (warnedUnknownComponents.has(name)) return;
  warnedUnknownComponents.add(name);
  console.warn(
    `[pro-components] 未识别的组件类型 "${name}"，已降级为原生元素渲染。如为自定义组件请在 componentMap 或 ProComponentProvider 中注册。`
  );
}
