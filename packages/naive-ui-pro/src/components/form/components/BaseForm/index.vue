<!-- eslint-disable no-unused-vars, no-new-func, no-underscore-dangle -->
<script lang="ts" setup>
import { NForm, type FormProps } from 'naive-ui';
import { computed, provide, shallowReactive } from 'vue';
import { BaseFormItems } from '..';
import {
  COMMAND,
  UPDATE_FORM_DATA,
  UPDATE_REFS,
  FORM_DATA,
} from '../../constants';
import { useCommand } from '../../hooks';
import type {
  FormData,
  FormRef,
  Refs,
  UpdateFormData,
  UpdateRefs,
  Fields,
  Grid,
  Form,
} from '../../types';

interface Props extends /* @vue-ignore */ FormProps {
  form?: Form;
  formData?: FormData;
  fields?: Fields;
  grid?: Grid;
  autoCommandDisabled?: boolean;
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
});

type Emits = {
  'update:formData': [val: FormData];
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
const exposed: FormRef = shallowReactive({ refs });

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

provide(FORM_DATA, _formData);
provide(UPDATE_FORM_DATA, updateFormData);
provide(UPDATE_REFS, updateRefs);
provide(COMMAND, command);

defineExpose<FormRef>(exposed);
</script>

<template>
  <n-form :model="_formData">
    <BaseFormItems :fields="_fields" :grid="props.grid" />
  </n-form>
</template>

<style scoped lang="less"></style>
