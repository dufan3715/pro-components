<script lang="ts" setup generic="F extends Form<any> = Form">
/**
 * 配置驱动表单组件（移动端）
 *
 * @component ProForm
 * @description 按字段配置数组渲染移动端表单，管理表单实例、字段插槽与共享弹层。
 *
 * 架构设计说明 (Architecture Overview)
 *
 * [ 数据层 (Core) ]  =>  [ 绑定层 (ProForm) ]  =>  [ 渲染层 (BaseFormItems / BaseFormItem / BaseField) ]
 *
 * 1. 数据隔离：ProForm 本身不负责存储和管理表单状态，所有核心状态（formData, fields, 校验规则）
 *    均交由底层的 `useForm`（@qin-ui/pro-components-core）驱动。
 * 2. 上下文透传：通过 `provide` 将核心状态下发给子组件。
 * 3. 递归渲染：具体字段的解析交由 `<BaseFormItems>` 递归完成。
 *
 * 支持：
 * - 字段联动、嵌套字段、自定义组件
 * - 弹出层表单（Popup，移动端选择器场景）
 *
 * @template F - 表单实例类型
 * @param {F} [form] - useForm 返回的表单实例
 * @param {boolean} [disabled] - 表单级禁用状态；未提供时字段回退自身配置与 Provider 注入值
 * @param {...VanFormProps} ...attrs - Vant Form 的其余属性，经 attrs 透传
 *
 * @slot default - 默认插槽
 * @slot [path] - 以字段 path 命名的动态插槽
 *
 * @public
 */
import {
  Form as VanForm,
  Popup,
  type FormProps as VanFormProps,
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
  type Slot,
} from 'vue';
import { INJECT_CONFIG } from '../../../component-provider/constants';
import BaseFormItems from '../BaseFormItems/index.vue';
import { InjectionFormKey, InjectionFormSlotsKey } from '../../constants';
import type { VModelProps, PathProps } from '../../types';
import type { Path } from '../../../../shared/core';
import {
  camelizeProperties,
  createFormProxy,
  omitBy,
  useReactiveAttrs,
} from '../../../../shared/core';
import type { Form } from '../../hooks/useForm';
import { useForm } from '../../hooks/useForm';
import { InjectionPopupKey } from '../../hooks/useFormPopup';

defineOptions({ name: 'ProForm', inheritAttrs: false });

type FormProps = Partial<Omit<VanFormProps, 'model'>>;
type Props = { form?: F } & /* @vue-ignore */ FormProps;
const props = withDefaults(defineProps<Props>(), {
  form: undefined,
});

const attrs = useReactiveAttrs();

// 兜底表单实例：setup 同步期创建，未传 :form（含运行期置空）时经 currentForm 生效
const fallbackForm = useForm() as unknown as F;
const currentForm = computed(() => props.form ?? fallbackForm);

/*
 * 表单实例代理：操作全部转发至 currentForm 当前实例，供深层子组件跨层级访问；
 * 下游持有本代理即可，:form 运行期替换无需重绑；方法具有引用记忆化
 */
const formProxy = createFormProxy(() => currentForm.value);

provide(InjectionFormKey, formProxy);

/*
 * 弹层注入代理：路由到当前表单实例的 formPopup；
 * 未传 :form 时指向兜底实例，运行期替换 :form 后子组件无需重新注入
 */
provide(
  InjectionPopupKey,
  createFormProxy(() => currentForm.value?.formPopup)
);

const fields = computed(() => {
  const f = currentForm.value?.fields;
  return (Array.isArray(f) ? f : f?.value) ?? [];
});
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

/*
 * 从 ProComponentProvider 获取 ProForm 全局默认属性，按运行期变更响应式派生
 */
const config = INJECT_CONFIG['pro-form'];
const injectFormConfig = inject(config.injectionKey, config.default);
const injectAttrs = computed(() => toValue(injectFormConfig) || {});

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

/*
 * 共享弹层容器：模板内 <Popup> 的 show/close 直连 formPopup 状态
 * popup 字段的真实组件经 Teleport 挂载到 contentId 对应的 div；popupProps 剔除 container 后透传
 */
const popupProps = computed(() => {
  const rawPopupProps = currentForm.value?.formPopup?.props || {};
  const { container: _container, ...rest } = rawPopupProps;
  return rest;
});

const popupContentId = computed(() => {
  return (
    currentForm.value?.formPopup?.contentId?.value || 'pro-form-popup-content'
  );
});

const formAttrs = computed(() => {
  return mergeProps(
    injectAttrs.value,
    omitBy(camelizeProperties(attrs), value => value === undefined)
  );
});

/*
 * 表单级禁用状态：取实际下发给宿主 Form 的合并值（Provider 注入与显式属性），
 * 按宿主 Boolean prop 的转换规则判定——`''` 与同名属性形态为 true，其余取真值
 * （`disabled="false"` 等字符串与宿主一致地视为真）；
 * 未提供时不下发，字段层回退自身配置与 Provider 注入值
 */
const formDisabled = computed(() => {
  const d = formAttrs.value.disabled;
  if (d === undefined) return undefined;
  return d === '' || d === 'disabled' ? true : Boolean(d);
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
    <BaseFormItems :fields="fields" :disabled="formDisabled" />

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
