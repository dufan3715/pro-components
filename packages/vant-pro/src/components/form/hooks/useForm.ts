import { useForm as _useForm, type Form as _Form } from '../../../shared/core';
import type { Data, ExtendWithAny, DeepPartial } from '../../../shared/core';
import type { Field } from '../types';
import type { ComponentName } from '../constants';
import type { FormInstance } from '../../../shared/ui';
import { useFormPopup, type FormPopup } from './useFormPopup';

/**
 * @qin-ui/vant-pro 的表单实例类型
 *
 * @description 在 core Form 类型的基础上：
 * 1. 将字段类型 F 绑定为本地 Field<ComponentName, D>
 * 2. 将底层表单实例绑定为 Vant 的 FormInstance
 * 3. 额外包含 formPopup 对象，用于管理弹出层表单
 *
 * @template D - 表单数据类型
 * @template F - 字段配置类型
 
 * @public
 */
export type Form<
  D extends Data = Data,
  F extends Field<ComponentName, D> = Field<ComponentName, D>,
> = _Form<D, F, FormInstance> & { formPopup: FormPopup };

/**
 * 创建 @qin-ui/vant-pro 表单实例的 Hook
 *
 * @description 基于 core useForm 封装，额外提供了 formPopup 用于移动端弹窗表单。
 *
 * @template D - 表单数据类型
 *
 * @example
 * ```ts
 * interface User { name: string; age: number }
 *
 * const form = useForm<User>(
 *   { name: '张三' },
 *   [
 *     { path: 'name', label: '姓名', component: 'field' },
 *   ]
 * )
 *
 * // 打开弹出层表单
 * form.formPopup.open('address')
 * form.formPopup.close()
 * ```
 
 * @public
 */
export function useForm<D extends Data = Data>(
  initFormData?: ExtendWithAny<DeepPartial<D>>,
  initFields?: Field<ComponentName, D>[],
  root?: boolean
): Form<D, Field<ComponentName, D>>;
export function useForm<D extends Data = Data>(
  root?: boolean
): Form<D, Field<ComponentName, D>>;
export function useForm(...args: any[]) {
  let root = true;
  if (args.length === 1) {
    root = args[0] as boolean;
  } else if (args.length >= 2) {
    root = (args[2] as boolean) ?? root;
  }

  const form = _useForm(...args);
  const formPopup = useFormPopup(root);

  return { ...form, formPopup };
}
