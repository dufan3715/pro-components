<script lang="ts" setup generic="F extends Form<any> = Form">
/**
 * 配置驱动表单组件
 *
 * @component ProForm
 *
 * 架构设计说明 (Architecture Overview)
 *
 * [ 数据层 (Core) ]  =>  [ 绑定层 (ProForm) ]  =>  [ 渲染层 (BaseFormItem / BaseField) ]
 *
 * 1. 数据隔离：ProForm 本身不负责存储和管理表单状态，所有核心状态（formData, fields, 校验规则）
 *    均交由底层的 `useForm`（@qin-ui/pro-components-core）驱动。
 * 2. 上下文透传：通过 `provide` 将核心状态下发给子组件。
 * 3. 递归渲染：网格布局和具体字段的解析交由 `<BaseFormItem>` 递归完成。
 *
 * @public
 *
 * 通过配置驱动的方式快速构建表单，支持：
 * - 字段联动（通过 setField、watch 等实现）
 * - 嵌套字段（通过 fields 递归配置）
 * - 自定义组件（通过 component 属性和 custom 类型）
 * - 网格布局（通过 grid 属性）
 * - 动态插槽（以字段 path 命名的插槽）
 * - 全局配置注入（通过 ProComponentProvider）
 *
 * @template F - 表单实例类型
 *
 * @param {F} [form] - useForm 返回的表单实例
 * @param {boolean | GridProps} [grid=false] - 是否启用网格布局
 * @param {...FormProps} ...attrs - antdv-next Form 组件的其他属性
 *
 * @slot default - 默认插槽，可用于添加额外内容
 * @slot [path] - 以字段 path 命名的动态插槽，可用于自定义字段渲染
 *
 * @example
 * ```vue
 * <template>
 *   <ProForm :form="form" @submit="handleSubmit">
 *     <template #name="{ value, disabled }">
 *       <a-input :value="value" :disabled="disabled" />
 *     </template>
 *   </ProForm>
 * </template>
 * ```
 */
import type { FormProps as AFormProps } from '../../../../shared/ui';
import {
  Form as AForm,
  useDisabledContext,
  useDisabledContextProvider,
} from '../../../../shared/ui';
import {
  computed,
  inject,
  mergeProps,
  onUpdated,
  provide,
  shallowRef,
  toValue,
  triggerRef,
  useAttrs,
  type Slot,
} from 'vue';
import { INJECT_CONFIG } from '../../../component-provider/constants';
import BaseFormItem from '../BaseFormItem/index.vue';
import { InjectionFormKey, InjectionFormSlotsKey } from '../../constants';
import type { Grid, VModelProps, PathProps } from '../../types';
import type { Path } from '../../../../shared/core';
import { camelizeProperties, createFormProxy } from '../../../../shared/core';
import { useForm, type Form } from '../../hooks/useForm';

defineOptions({ name: 'ProForm', inheritAttrs: false });

type MyFormProps = Partial<Omit<AFormProps, 'model'>>;

type Props = { grid?: Grid; form?: F } & /* @vue-ignore */ MyFormProps;
const props = withDefaults(defineProps<Props>(), {
  grid: false,
  form: undefined,
});

const attrs: any = useAttrs();
// 显式 attrs.disabled（含 '' / 'true' 字符串形态）归一为 boolean 后下发禁用上下文；未显式指定时下发上层上下文的值
const parentDisabled = useDisabledContext();
useDisabledContextProvider(
  computed(() => {
    const d = attrs.disabled;
    if (d === undefined) return parentDisabled.value;
    return d === '' || d === true || d === 'true';
  }) as any
);

/**
 * 依赖注入中心：
 * 未传 form 实例（含运行期置空）时回退内部表单实例；
 * 将 Form 实例注入到 Vue Context 中，供深层子组件跨层级直接访问数据和方法。
 */
// 兜底表单实例：setup 同步期创建，未传 :form（含运行期置空）时经 currentForm 生效
const fallbackForm = useForm() as unknown as F;
const currentForm = computed(() => props.form ?? fallbackForm);

/**
 * 表单实例代理：操作全部转发至 currentForm 当前实例；
 * 下游持有本代理即可，:form 运行期替换无需重绑；方法具有引用记忆化。
 */
const formProxy = createFormProxy(() => currentForm.value);

provide(InjectionFormKey, formProxy);

const fields = computed(() => {
  const f = currentForm.value?.fields;
  return (Array.isArray(f) ? f : f?.value) ?? [];
});
const formData = computed(() => currentForm.value?.formData);
const setFormRef = (el: any) => currentForm.value?.setFormRef?.(el);

/*
 * formKey 子树重挂载契约：以 WeakMap 为每个 form 实例生成自增 key，绑定到原生 Form 的 :key
 * :form 运行期替换为全新实例时强制整棵表单子树重新挂载，重置宿主校验状态与深层字段非受控状态
 */
let formInstanceCounter = 0;
const formInstanceKeyMap = new WeakMap<object, number>();
const getFormKey = (f: object) => {
  if (f == null) return 0;
  if (!formInstanceKeyMap.has(f)) {
    formInstanceKeyMap.set(f, ++formInstanceCounter);
  }
  return formInstanceKeyMap.get(f)!;
};
const formKey = computed(() => getFormKey(currentForm.value as any));

const config = INJECT_CONFIG['pro-form'];
const injectFormConfig = inject(config.injectionKey, config.default);

/** 从 ProComponentProvider 获取全局配置，响应式派生以支持动态配置变更 */
const injectAttrs = computed(() => {
  const { grid: _injectGrid, ...rest } = toValue(injectFormConfig) || {};
  return rest;
});

const formAttrs = computed(() => {
  return mergeProps(injectAttrs.value, camelizeProperties(attrs));
});

type ExtractPath<T> = T extends Form<infer D> ? Path<D> : string;
type FieldSlotProps = VModelProps &
  PathProps & { disabled?: boolean; [x: string]: any };
type FieldSlots = Record<ExtractPath<F>, Slot<FieldSlotProps>>;

const slots = defineSlots<Partial<FieldSlots & { default: Slot }>>();

/*
 * 动态插槽映射中心 (Slot Teleporting)：
 * 向深层 BaseField 提供 ProForm 的具名插槽，父级运行期增删插槽后下游可感知
 */
const formSlotsRef = shallowRef<Record<string, any>>(slots);
onUpdated(() => {
  triggerRef(formSlotsRef);
});
provide(InjectionFormSlotsKey, formSlotsRef);
</script>

<template>
  <AForm
    :key="formKey"
    :ref="setFormRef"
    :model="formData"
    v-bind="formAttrs"
    class="pro-form"
  >
    <BaseFormItem :fields="fields" :grid="props.grid" />
    <slot />
  </AForm>
</template>
