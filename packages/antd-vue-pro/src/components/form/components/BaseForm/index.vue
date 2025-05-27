<!-- eslint-disable no-unused-vars, no-underscore-dangle -->
<script lang="ts" setup>
import { Form as AForm, FormProps as AFormProps } from 'ant-design-vue';
import { mergeProps, provide } from 'vue';
import { useInjectProps, INJECT_KEYS } from '../../../component-provider';
import { BaseFormItem } from '..';
import type { Form, Grid } from '../../types';
import { FORM } from '../../constants';

defineOptions({ name: 'ProForm', inheritAttrs: false });

// ?? 打包时dts插件抛异常 https://github.com/microsoft/TypeScript/issues/47663
export interface FormProps extends AFormProps {
  scrollToFirstError?: boolean | Record<string, any>;
}

export interface Props extends /* @vue-ignore */ FormProps {
  grid?: Grid;
  form: Form;
}

const props = withDefaults(defineProps<Props>(), {
  grid: false,
});

provide(FORM, props.form);

const { formData, fields, setFormRef } = props.form || {};

const injectAttrs = useInjectProps(INJECT_KEYS['pro-form']);
</script>

<template>
  <AForm
    :ref="el => setFormRef(el as any)"
    :model="formData"
    v-bind="mergeProps(injectAttrs, $attrs)"
  >
    <BaseFormItem :fields="fields" :grid="grid" />
    <slot />
  </AForm>
</template>
