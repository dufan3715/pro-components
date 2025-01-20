<!-- eslint-disable no-unused-vars, no-underscore-dangle -->
<script lang="ts" setup>
import { Form as AForm, FormProps as AFormProps } from 'ant-design-vue';
import { ref, provide, onMounted, shallowReactive } from 'vue';
import { FormExpose, FormInstance } from 'ant-design-vue/es/form/Form';
import { omit } from 'lodash-es';
import { useInjectProps, INJECT_KEYS } from '../../../component-provider';
import { BaseFormItem } from '..';
import {
  UPDATE_FORM_DATA,
  FORM_DATA,
  UPDATE_ACTIVE_PATH,
} from '../../constants';
import type { UpdateFormData, Grid, Form } from '../../types';

// ?? 打包时dts插件抛异常 https://github.com/microsoft/TypeScript/issues/47663
interface FormProps extends AFormProps {
  scrollToFirstError?: boolean | Record<string, any>;
}

interface Props extends /* @vue-ignore */ FormProps {
  grid?: Grid;
  form: Partial<Form>;
}

defineOptions({
  name: 'BaseForm',
});

const props = withDefaults(defineProps<Props>(), {
  form: () => ({}),
  grid: false,
});

const {
  setActivePath: updateActivePath,
  setFormData,
  formData = {},
  fields = [],
  setFormRef,
  formRef,
} = props.form;

const injectProps = useInjectProps(INJECT_KEYS['pro-form']);
const injectAttrs = omit(injectProps, Object.keys(props));

const updateFormData: UpdateFormData = (path, value) => {
  setFormData?.(path, value);
  updateActivePath?.(path);
};

const exposed: FormExpose = shallowReactive({} as any);

const formInstanceRef = ref<FormInstance | null>(null);
onMounted(() => {
  Object.assign(exposed, formInstanceRef.value);
  if (setFormRef && !formRef?.value) {
    setFormRef(exposed);
  }
});

provide(FORM_DATA, formData);
provide(UPDATE_FORM_DATA, updateFormData);
provide(UPDATE_ACTIVE_PATH, updateActivePath as any);

defineExpose<FormExpose>(exposed);
</script>

<template>
  <AForm
    ref="formInstanceRef"
    :model="formData"
    v-bind="{ ...injectAttrs, ...$attrs }">
    <BaseFormItem
      :fields="fields"
      :grid="grid"
      :disabled="($attrs.disabled as boolean)" />
    <slot />
  </AForm>
</template>
