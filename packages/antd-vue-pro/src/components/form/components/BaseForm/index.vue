<!-- eslint-disable no-unused-vars, no-underscore-dangle -->
<script lang="ts" setup>
import { Form as AForm, FormProps as AFormProps } from 'ant-design-vue';
import { ref, computed, provide, onMounted, shallowReactive } from 'vue';
import { FormExpose, FormInstance } from 'ant-design-vue/es/form/Form';
import { cloneDeep, omit, set } from 'lodash-es';
import { useInjectProps, INJECT_KEYS } from '../../../component-provider';
import { BaseFormItem } from '..';
import {
  COMMAND,
  UPDATE_FORM_DATA,
  FORM_DATA,
  UPDATE_ACTIVE_PATH,
} from '../../constants';
import { useCommand } from '../../hooks';
import type {
  FormData,
  UpdateFormData,
  Fields,
  Grid,
  Form,
  SetActivePath,
} from '../../types';

// ?? 打包时dts插件抛异常 https://github.com/microsoft/TypeScript/issues/47663
interface FormProps extends AFormProps {
  scrollToFirstError?: boolean | Record<string, any>;
}

interface Props extends /* @vue-ignore */ FormProps {
  form?: Form;
  formData?: FormData;
  fields?: Fields;
  grid?: Grid;
  autoCommandDisabled?: boolean;
  activePath?: string;
}

defineOptions({
  name: 'BaseForm',
});

const props = withDefaults(defineProps<Props>(), {
  form: undefined,
  formData: () => ({}),
  fields: () => [],
  grid: false,
  autoCommandDisabled: false,
  activePath: undefined,
});

const injectProps = useInjectProps(INJECT_KEYS['pro-form']);
const injectAttrs = omit(injectProps, Object.keys(props));

type Emits = {
  'update:formData': [val: FormData];
  'update:activePath': [val: string | undefined];
};
const emit = defineEmits<Emits>();

const updateActivePath: SetActivePath = (path?: string) => {
  if (props.form) {
    props.form?.setActivePath?.(path);
  } else {
    emit('update:activePath', path);
  }
};

const _formData = computed(() =>
  props.form ? props.form?.formData.value : props.formData
);

const _fields = computed(() =>
  props.form ? props.form?.fields.value : props.fields
);

const updateFormData: UpdateFormData = (path, value) => {
  if (props.form) {
    props.form?.setFormData(path, value);
  } else {
    const newFormData = cloneDeep(_formData);
    set(newFormData, path, value);
    emit('update:formData', newFormData);
  }
  updateActivePath(path);
};

const command = computed(() => {
  return props.form && !props.autoCommandDisabled
    ? useCommand(props.form)
    : null;
});

const exposed: FormExpose = shallowReactive({} as any);

const formInstanceRef = ref<FormInstance | null>(null);
onMounted(() => {
  Object.assign(exposed, formInstanceRef.value);
  if (props.form) {
    if (props.form.setFormRef && !props.form.formRef?.value) {
      props.form.setFormRef(exposed);
    }
  }
});

provide(FORM_DATA, _formData);
provide(UPDATE_FORM_DATA, updateFormData);
provide(COMMAND, command);
provide(UPDATE_ACTIVE_PATH, updateActivePath);

defineExpose<FormExpose>(exposed);
</script>

<template>
  <AForm
    ref="formInstanceRef"
    :model="_formData"
    v-bind="{ ...injectAttrs, ...$attrs }">
    <BaseFormItem
      :fields="_fields"
      :grid="grid"
      :disabled="($attrs.disabled as boolean)" />
    <slot />
  </AForm>
</template>
