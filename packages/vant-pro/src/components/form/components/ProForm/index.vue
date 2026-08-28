<script lang="ts" setup generic="F extends Form<any> = Form">
/**
 * @component ProForm
 * @description @qin-ui/vant-pro 配置驱动表单组件（移动端）
 *
 * 架构设计说明 (Architecture Overview)
 *
 * [ 数据层 (Core) ]  =>  [ 绑定层 (ProForm) ]  =>  [ 渲染层 (BaseFormItem / BaseField) ]
 *
 * 1. 数据隔离：ProForm 本身不负责存储和管理表单状态，所有核心状态（formData, fields, 校验规则）
 *    均交由底层的 `useForm`（@qin-ui/pro-components-core）驱动。
 * 2. 上下文透传：通过 `provide` 将核心状态下发给子组件，避免了深层嵌套的 Props 传递。
 * 3. 递归渲染：具体字段的解析交由 `<BaseFormItem>` 递归完成，实现了 UI 布局与表单逻辑的解耦。
 *
 * 通过配置驱动的方式快速构建移动端表单，支持：
 * - 字段联动、嵌套字段、自定义组件
 * - 弹出层表单（Popup，适用于移动端选择器场景）
 *
 * @template F - 表单实例类型
 * @param {F} [form] - useForm 返回的表单实例
 * @param {boolean} [disabled] - 全局表单禁用
 *
 * @slot default - 默认插槽
 * @slot [path] - 以字段 path 命名的动态插槽
 
 * @public
 */
import {
  Form as VanForm,
  Popup,
  type FormProps as VanFormProps,
} from '../../../../shared/ui';
import {
  inject,
  mergeProps,
  provide,
  type Slot,
  toValue,
  computed,
  useAttrs,
} from 'vue';
import { INJECT_CONFIG } from '../../../component-provider/constants';
import { BaseFormItem } from '..';
import { InjectionFormKey, InjectionFormSlotsKey } from '../../constants';
import type { VModelProps, PathProps } from '../../types';
import {
  Path,
  camelizeProperties,
  createFormProxy,
} from '../../../../shared/core';
import type { Form } from '../../hooks/useForm';
import { useForm } from '../../hooks/useForm';

defineOptions({ name: 'ProForm', inheritAttrs: false });

type FormProps = Partial<Omit<VanFormProps, 'model'>>;
type Props = { form?: F } & /* @vue-ignore */ FormProps;
const props = withDefaults(defineProps<Props>(), {
  form: undefined,
});

const attrs = useAttrs();

/**
 * 依赖注入中心：
 * 若外部未传 form 实例，则自动初始化内部表单实例；
 * 将 Form 实例注入到 Vue Context 中，供深层子组件跨层级直接访问数据和方法。
 */
const fallbackForm = props.form ? undefined : useForm();
const currentForm = computed(
  () => props.form ?? (fallbackForm as unknown as F)
);

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
const setFormRef = (el: any) => currentForm.value?.setFormRef?.(el);

let formInstanceCounter = 0;
const formInstanceKeyMap = new WeakMap<object, number>();
const getFormKey = (f: object) => {
  if (!formInstanceKeyMap.has(f)) {
    formInstanceKeyMap.set(f, ++formInstanceCounter);
  }
  return formInstanceKeyMap.get(f)!;
};
const formKey = computed(() => getFormKey(currentForm.value as any));

const config = INJECT_CONFIG['pro-form'];
const injectFormConfig = inject(config.injectionKey, config.default);
const injectAttrs = computed(() => toValue(injectFormConfig) || {});

type ExtractPath<T> = T extends Form<infer D> ? Path<D> : string;
type FieldSlotProps = VModelProps &
  PathProps & { disabled?: boolean; [x: string]: any };
type FieldSlots = Record<ExtractPath<F>, Slot<FieldSlotProps>>;

const slots = defineSlots<Partial<FieldSlots & { default: Slot }>>();

/**
 * 动态插槽映射中心 (Slot Teleporting)：
 * 在 setup 同步期直接提供响应式 slots 上下文容器，供深层 BaseField 按需动态获取插槽
 */
provide(InjectionFormSlotsKey, slots);

const popupProps = computed(() => {
  const rawPopupProps = currentForm.value?.formPopup?.props || {};
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { container: _container, ...rest } = rawPopupProps;
  return rest;
});

const popupContentId = computed(() => {
  return (
    currentForm.value?.formPopup?.contentId?.value || 'pro-form-popup-content'
  );
});

const formAttrs = computed(() => {
  return mergeProps(injectAttrs.value, camelizeProperties(attrs));
});
</script>

<template>
  <VanForm
    :key="formKey"
    :ref="setFormRef"
    v-bind="formAttrs"
    class="pro-form"
    @submit.prevent
  >
    <BaseFormItem :fields="fields" />

    <Popup
      v-if="currentForm?.formPopup"
      v-bind="popupProps"
      :show="currentForm.formPopup.visible.value"
      @close="currentForm.formPopup.close"
    >
      <div :id="popupContentId"></div>
    </Popup>

    <slot />
  </VanForm>
</template>
