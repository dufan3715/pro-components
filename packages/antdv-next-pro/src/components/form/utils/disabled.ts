/**
 * 归一化禁用值
 *
 * @description 字符串形态与宿主 Boolean prop 一致：`''` 与 `disabled` 为 true，其余取真值
 * @param value - 原始禁用值
 * @returns 归一化后的布尔值
 */
export const normalizeDisabled = (value: unknown) =>
  value === '' || value === 'disabled' ? true : Boolean(value);

/**
 * 解析显式声明的禁用值
 *
 * @description `undefined` / `null` 为未声明，返回 `undefined`；其余返回归一化结果
 * @param value - 原始禁用值
 * @returns 显式禁用值；未声明时为 `undefined`
 */
export const resolveDisabled = (value: unknown): boolean | undefined =>
  value === undefined || value === null ? undefined : normalizeDisabled(value);

/**
 * 解析控件最终生效的禁用状态
 *
 * @description 字段显式声明（含 `false`）优先；未声明时继承外层禁用，外层为真即禁用；
 * 外层未禁用时回退 Provider 注入的组件级默认值
 * @param explicit - 字段显式声明的禁用值
 * @param inherited - 外层禁用上下文取值
 * @param fallback - Provider 注入的组件级默认禁用值
 * @returns 最终生效的禁用状态
 */
export const resolveEffectiveDisabled = (
  explicit: unknown,
  inherited: unknown,
  fallback: unknown
): boolean =>
  resolveDisabled(explicit) ??
  (normalizeDisabled(inherited) || normalizeDisabled(fallback));
