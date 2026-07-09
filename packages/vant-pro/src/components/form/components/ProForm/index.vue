<script lang="ts" setup generic="F extends Form<any> = Form">
/**
 * @component ProForm
 * @description @qin-ui/vant-pro 配置驱动表单组件（移动端）
 *
 * 通过配置驱动的方式快速构建移动端表单，支持：
 * - 字段联动、嵌套字段、自定义组件
 * - 弹出层表单（Popup，适用于移动端选择器场景）
 *
 * @template F - 表单实例类型
 * @param {Form<D>} [form] - useForm 返回的表单实例
 *
 * @slot default - 默认插槽
 * @slot [path] - 以字段 path 命名的动态插槽
 
 * @public
 */
import { Form as VanForm, Popup } from '../../../../shared/ui';
import {
  inject,
  mergeProps,
  provide,
  type Slot,
  watchEffect,
  toValue,
  computed,
} from 'vue';
import { INJECT_CONFIG } from '../../../component-provider/constants';
import { BaseFormItem } from '..';
import { InjectionFormKey, TeleportComponentNamePrefix } from '../../constants';
import type { VModelProps, PathProps } from '../../types';
import { Path, camelizeProperties } from '../../../../shared/core';
import type { Form } from '../../hooks/useForm';
import { useForm } from '../../hooks/useForm';

defineOptions({ name: 'ProForm', inheritAttrs: false });

type Props = { form?: F };
const props = defineProps<Props>();

const form = props.form || (useForm(true) as F);

// 将表单实例通过依赖注入传递给子组件（BaseFormItem、BaseField 等）
provide(InjectionFormKey, form as F);

const { fields, setFormRef, formPopup } = form as F;

const formFields = computed(() => {
  const f = toValue(fields);
  return Array.isArray(f) ? f : [];
});

const config = INJECT_CONFIG['pro-form'];
const injectAttrs = inject(config.injectionKey, config.default);

type ExtractPath<T> = T extends Form<infer D> ? Path<D> : string;
type FieldSlotProps = VModelProps &
  PathProps & { disabled?: boolean; [x: string]: any };
type FieldSlots = Record<ExtractPath<F>, Slot<FieldSlotProps>>;

const slots = defineSlots<Partial<FieldSlots & { default: Slot }>>();
// 将非 default 插槽注册为 teleport 组件源，供 BaseField 动态渲染
// 例如 <template #username> 会注册为 TeleportComponentNamePrefix + 'username'
watchEffect(() => {
  Object.keys(slots).forEach(name => {
    if (name === 'default') return;
    provide(`${TeleportComponentNamePrefix}${name}`, (slots as any)[name]);
  });
});

const popupProps = computed(() => {
  // 从 ProComponentProvider 获取全局配置，与传入的 props 合并
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { container, ...rest } = formPopup.props;
  return rest;
});
</script>

<template>
  <VanForm
    :ref="(el: any) => setFormRef?.(el)"
    v-bind="mergeProps(injectAttrs, camelizeProperties($attrs))"
    class="pro-form"
  >
    <BaseFormItem :fields="formFields" />

    <Popup
      v-bind="popupProps"
      :show="formPopup.visible.value"
      @close="formPopup.close"
    >
      <div id="pro-form-popup-content"></div>
    </Popup>

    <slot />
  </VanForm>
</template>
