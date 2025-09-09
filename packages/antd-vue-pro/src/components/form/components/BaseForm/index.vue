<script lang="ts" setup generic="F extends Form<any> = Form">
import {
  Form as UIForm,
  FormProps as UIFormProps,
} from '../../../../shared/ui';
import { inject, mergeProps, provide, type Slot, watchEffect } from 'vue';
import { INJECT_CONFIG } from '../../../component-provider';
import { BaseFormItem } from '..';
import { FORM, TeleportComponentNamePrefix } from '../..';
import type { Grid, VModelProps, PathProps, Form } from '../..';
import { Path } from '../../../../shared/types';
import { camelizeProperties } from '../../../../shared/utils';

defineOptions({ name: 'ProForm', inheritAttrs: false });

type FormProps = Partial<Omit<UIFormProps, 'model'>>;

type Props = { grid?: Grid; form?: F } & /* @vue-ignore */ FormProps;
const props = withDefaults(defineProps<Props>(), {
  grid: false,
  form: () => ({}) as F,
});

provide(FORM, props.form as F);

const { formData, fields, setFormRef } = props.form as F;

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
  >
    <BaseFormItem :fields="fields" :grid="grid" />
    <slot />
  </UIForm>
</template>
