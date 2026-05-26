<script lang="ts" setup generic="F extends Form<any> = Form">
/**
 * @component ProForm
 * @description @qin-ui/antd-vue-pro 配置驱动表单组件
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
 * @template F - 表单实例类型，继承自 Form<D>
 *
 * @param {Form<D>} [form] - useForm 返回的表单实例
 * @param {boolean | GridProps} [grid=false] - 是否启用网格布局
 * @param {...FormProps} ...attrs - Ant Design Vue Form 组件的其他属性
 *
 * @slot default - 默认插槽，可用于添加额外内容
 * @slot [path] - 以字段 path 命名的动态插槽，可用于自定义字段渲染
 *
 * @example
 * ```vue
 * <template>
 *   <ProForm :form="form" :fields="fields" @submit="handleSubmit">
 *     <template #name="{ value, disabled }">
 *       <a-input :value="value" :disabled="disabled" />
 *     </template>
 *   </ProForm>
 * </template>
 * ```
 */
import {
  Form as UIForm,
  FormProps as UIFormProps,
} from '../../../../shared/ui';
import { inject, mergeProps, provide, type Slot, watchEffect } from 'vue';
import { INJECT_CONFIG } from '../../../component-provider/constants';
import { BaseFormItem } from '..';
import { InjectionFormKey, TeleportComponentNamePrefix } from '../../constants';
import type { Grid, VModelProps, PathProps } from '../../types';
import { Path, camelizeProperties } from '../../../../shared/core';
import type { Form } from '../../hooks/useForm';

defineOptions({ name: 'ProForm', inheritAttrs: false });

type FormProps = Partial<Omit<UIFormProps, 'model'>>;

type Props = { grid?: Grid; form?: F } & /* @vue-ignore */ FormProps;
const { grid = false, form = {} as F } = defineProps<Props>();

provide(InjectionFormKey, form as F);

const { formData, fields, setFormRef } = form as F;

const config = INJECT_CONFIG['pro-form'];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { grid: _injectGrid, ...injectAttrs } = inject(
  config.injectionKey,
  config.default
);

type ExtractPath<T> = T extends Form<infer D> ? Path<D> : string;
type FieldSlotProps = VModelProps &
  PathProps & { disabled?: boolean; [x: string]: any };
type FieldSlots = Record<ExtractPath<F>, Slot<FieldSlotProps>>;

const slots = defineSlots<Partial<FieldSlots & { default: Slot }>>();
watchEffect(() => {
  Object.keys(slots).forEach(name => {
    if (name === 'default') return;
    provide(`${TeleportComponentNamePrefix}${name}`, (slots as any)[name]);
  });
});
</script>

<template>
  <UIForm
    :ref="(el: any) => setFormRef?.(el)"
    :model="formData"
    v-bind="mergeProps(injectAttrs, camelizeProperties($attrs))"
    class="pro-form"
  >
    <BaseFormItem :fields="fields" :grid="grid" />
    <slot />
  </UIForm>
</template>
