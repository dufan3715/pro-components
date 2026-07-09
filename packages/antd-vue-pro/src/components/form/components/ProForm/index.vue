<script lang="ts" setup generic="F extends Form<any> = Form">
/**
 * @component ProForm
 * @description @qin-ui/antd-vue-pro 配置驱动表单组件
 *
 * 架构设计说明 (Architecture Overview)
 *
 * [ 数据层 (Core) ]  =>  [ 绑定层 (ProForm) ]  =>  [ 渲染层 (BaseFormItem / BaseField) ]
 *
 * 1. 数据隔离：ProForm 本身不负责存储和管理表单状态，所有核心状态（formData, fields, 校验规则）
 *    均交由底层的 `useForm`（@qin-ui/pro-components-core）驱动。
 * 2. 上下文透传：通过 `provide` 将核心状态下发给子组件，避免了深层嵌套的 Props 传递。
 * 3. 递归渲染：网格布局和具体字段的解析交由 `<BaseFormItem>` 递归完成，实现了 UI 布局与表单逻辑的解耦。
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
 * @param {...FormProps} ...attrs - Ant Design Vue Form 组件的其他属性
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
import { Form as AForm, FormProps as AFormProps } from '../../../../shared/ui';
import { inject, mergeProps, provide, type Slot, watchEffect } from 'vue';
import { INJECT_CONFIG } from '../../../component-provider/constants';
import { BaseFormItem } from '..';
import { InjectionFormKey, TeleportComponentNamePrefix } from '../../constants';
import type { Grid, VModelProps, PathProps } from '../../types';
import { Path, camelizeProperties } from '../../../../shared/core';
import type { Form } from '../../hooks/useForm';

defineOptions({ name: 'ProForm', inheritAttrs: false });

type FormProps = Partial<Omit<AFormProps, 'model'>>;

type Props = { grid?: Grid; form?: F } & /* @vue-ignore */ FormProps;
const { grid = false, form = {} as F } = defineProps<Props>();

/**
 * 依赖注入中心：
 * 将 Core 包生成的 Form 实例注入到 Vue 的 Context 中。
 * 供深层子组件（如 BaseFormItem, BaseField, 自定义插槽）跨层级直接访问数据和方法。
 */
provide(InjectionFormKey, form as F);

const { formData, fields, setFormRef } = form as F;

const config = INJECT_CONFIG['pro-form'];

// 从 ProComponentProvider 获取全局配置，与传入的 props 合并
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
/**
 * 动态插槽映射中心 (Slot Teleporting)：
 * 目的：将 ProForm 上以 Field Path 命名的插槽，动态注册为全局可访问的 Context。
 * 实现：BaseField 组件在渲染对应字段时，会通过 inject 尝试获取对应的 Prefix+Path，
 *      如果存在，则将插槽内容渲染到深层的具体位置，从而突破了组件嵌套层级的限制。
 */
watchEffect(() => {
  Object.keys(slots).forEach(name => {
    if (name === 'default') return;
    provide(`${TeleportComponentNamePrefix}${name}`, (slots as any)[name]);
  });
});
</script>

<template>
  <AForm
    :ref="(el: any) => setFormRef?.(el)"
    :model="formData"
    v-bind="mergeProps(injectAttrs, camelizeProperties($attrs))"
    class="pro-form"
  >
    <BaseFormItem :fields="fields" :grid="grid" />
    <slot />
  </AForm>
</template>
