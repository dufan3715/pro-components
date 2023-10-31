<!-- eslint-disable no-unused-vars, no-underscore-dangle -->
<script lang="ts" setup>
import { Form as AForm, FormProps as AFormProps } from 'ant-design-vue';
import { ref, computed, provide, shallowReactive, onMounted } from 'vue';
import { FormExpose, FormInstance } from 'ant-design-vue/es/form/Form';
import { BaseFormItem } from '..';
import {
  COMMAND,
  UPDATE_FORM_DATA,
  UPDATE_REFS,
  FORM_DATA,
  UPDATE_ACTIVE_PATH,
} from '../../constants';
import { useCommand } from '../../hooks';
import type {
  FormData,
  Refs,
  UpdateFormData,
  UpdateRefs,
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

interface Expose extends FormExpose {
  refs: Refs;
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

type Emits = {
  'update:formData': [val: FormData];
  'update:activePath': [val: string | undefined];
};
const emit = defineEmits<Emits>();

const refs: Refs = {
  formItemRefs: {},
  fieldRefs: {},
};
const updateRefs: UpdateRefs = (path, childRef, type) => {
  if (!path) return;
  refs[type][path] = childRef;
};
const exposed: Expose = shallowReactive({ refs } as any);

const updateActivePath: SetActivePath = (path?: string) => {
  if (props.form) {
    props.form.setActivePath(path);
  } else {
    emit('update:activePath', path);
  }
};

const _formData = computed(() =>
  props.form ? props.form.formData.value : props.formData
);

const updateFormData: UpdateFormData = (value, path) => {
  if (props.form) {
    props.form.setFormData?.(path, value);
  } else {
    const keys = path.split('.');
    const newFormData = keys.reduce(
      ({ preData, cb }: any, key: string, index: number, arr: Fields) => {
        if (index === arr.length - 1) {
          return cb({ ...preData, [key]: value }) as any;
        }
        return {
          preData: preData[key] || {},
          cb: (data: FormData) => cb({ ...preData, [key]: data }),
        };
      },
      { preData: props.formData, cb: (data: FormData) => data }
    );
    emit('update:formData', newFormData);
  }
  updateActivePath(path);
};

const _fields = computed(() =>
  props.form ? props.form.fields.value : props.fields
);

const command = computed(() => {
  return props.form && !props.autoCommandDisabled
    ? useCommand({
        refs: exposed.refs,
        form: props.form,
      })
    : null;
});

const formInstanceRef = ref<FormInstance | null>(null);
onMounted(() => {
  Object.assign(exposed, formInstanceRef.value);
});

provide(FORM_DATA, _formData);
provide(UPDATE_FORM_DATA, updateFormData);
provide(UPDATE_REFS, updateRefs);
provide(COMMAND, command);
provide(UPDATE_ACTIVE_PATH, updateActivePath);

defineExpose<Expose>(exposed);
</script>

<template>
  <AForm ref="formInstanceRef" :model="_formData">
    <BaseFormItem :fields="_fields" :grid="grid" />
    <slot />
  </AForm>
</template>
