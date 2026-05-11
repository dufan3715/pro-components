<script lang="ts" setup generic="F extends Form<any> = Form">
import { Form as UIForm, Popup } from '../../../../shared/ui';
import {
  inject,
  mergeProps,
  provide,
  type Slot,
  watchEffect,
  toValue,
  computed,
} from 'vue';
import { INJECT_CONFIG } from '../../../component-provider';
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
watchEffect(() => {
  Object.keys(slots).forEach(name => {
    if (name === 'default') return;
    provide(`${TeleportComponentNamePrefix}${name}`, (slots as any)[name]);
  });
});

const popupProps = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { container, ...rest } = formPopup.props;
  return rest;
});
</script>

<template>
  <UIForm
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
  </UIForm>
</template>
