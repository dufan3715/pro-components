import { inject } from 'vue';
import type { Fields } from '../types';
import useFields from './useFields';
import useFormData from './useFormData';
import useFormRef from './useFormRef';
import { FORM } from '../constants';
import { Data, DeepPartial, ExtendWithAny } from '../../../shared/types';

export type Form<D extends Data = Data> = ReturnType<typeof useFormData<D>> &
  ReturnType<typeof useFields<D>> &
  ReturnType<typeof useFormRef>;

/**
 * 表单hook
 * @param initFormData 初始表单数据
 * @param initFields 初始字段配置
 * @param root 是否为根级表单
 * @returns {Form<D>} - form表单对象
 * @property {Reactive<D>} formData - 表单数据Reactive<D>
 * @property {Function} getFormData - 获取指定字段数据路径path的值
 * @property {Function} setFormData - 设置指定字段数据路径path的值, path为空时设置所有字段数据
 * @property {Ref<Fields>} fields - 字段配置Ref
 * @property {Function} setField - 设置字段配置
 * @property {Function} getField - 获取字段配置
 * @property {Function} deleteField - 删除字段配置
 * @property {Function} appendField - 追加字段配置
 * @property {Function} prependField - 插入字段配置
 * @property {Function} getParentField - 获取字段所属父级字段
 * @property {Ref<FormInstance | undefined>} formRef - 表单组件实例引用
 * @property {Function} setFormRef - 更新实例引用
 */
function useForm<D extends Data = Data>(
  initFormData?: ExtendWithAny<DeepPartial<D>>,
  initFields?: Fields<D>,
  root?: boolean
): Form<D>;

function useForm<D extends Data = Data>(root?: boolean): Form<D>;

function useForm<D extends Data = Data>(...args: any[]) {
  let initFormData = {} as any,
    initFields = [],
    root = true;
  if (args.length === 1) {
    root = args[0] as boolean;
  } else if (args.length >= 2) {
    initFormData = args[0];
    initFields = args[1];
    root = (args[2] as boolean) ?? root;
  }
  if (!root) {
    const injectForm = inject(FORM);
    if (injectForm) return injectForm;
  }
  return {
    ...useFormData<D>(initFormData),
    ...useFields<D>(initFields),
    ...useFormRef(),
  };
}

export default useForm;
