<script lang="ts" setup>
import { computed, inject, mergeProps, toValue } from 'vue';
import {
  GridItemProps,
  FormItemProps,
  gridItemProps,
  formItemProps,
} from '../../../../shared/ui';
import { INJECT_CONFIG } from '../../../component-provider';
import type { Base, Field } from '../../types';
import { FORM_ITEM_SLOT_KEYS } from '../../constants';
import { isPlainObject } from '../../../../shared/utils';

const formItemPropKeys = Object.keys(formItemProps()).concat(['container']);
const gridItemPropKeys = Object.keys(gridItemProps());

type Props = {
  field: Field<any>;
};
const props = defineProps<Props>();

const config = INJECT_CONFIG['pro-form-item'];
const injectFormItemProps = inject(config.injectionKey, config.default);

type GroupedFieldAttrs = {
  gridItemProps: GridItemProps;
  formItemProps: FormItemProps & Pick<Base, 'container'>;
  formItemSlots: Record<(typeof FORM_ITEM_SLOT_KEYS)[number], any>;
  componentProps: Record<string, any>;
};

const groupedAttributes = computed<GroupedFieldAttrs>(() => {
  let gridItemProps: Record<string, any> = {};
  let formItemProps: Record<string, any> = {};
  const componentProps: Record<string, any> = { slots: {} };
  const formItemSlots: Record<string, any> = {};

  if (isPlainObject(props.field)) {
    // prettier-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { path, name, fields, className, style, hidden, span, getFormItemRef, getComponentRef, getFormItemComputedProps, getComponentComputedProps, slots = {}, ...rest } =
    props.field as any;
    const {
      class: injectClassName,
      style: injectStyle,
      span: injectSpan,
      xs,
      sm,
      md,
      lg,
      xl,
      xxl,
      ...injectRest
    } = injectFormItemProps;

    const initGridItemProps =
      span || span === 0
        ? { span }
        : { xs, sm, md, lg, xl, xxl, span: injectSpan };

    gridItemProps = fields ? { span: span ?? 24 } : initGridItemProps;
    formItemProps = mergeProps(
      injectRest,
      { class: injectClassName, style: injectStyle },
      { class: toValue(className), style: toValue(style) }
    );

    Object.keys(rest).forEach(k => {
      if (gridItemPropKeys.includes(k)) {
        gridItemProps[k] = rest[k];
      } else if (
        formItemPropKeys.includes(k) ||
        k.startsWith('data-form-item')
      ) {
        formItemProps[k as keyof FormItemProps] = rest[k];
      } else {
        componentProps[k] = rest[k];
      }
    });
    Object.keys(slots).forEach(k => {
      if (FORM_ITEM_SLOT_KEYS.includes(k as any)) {
        formItemSlots[k] = slots[k];
      } else {
        componentProps['slots'][k] = slots[k];
      }
    });
  }

  return { gridItemProps, formItemProps, componentProps, formItemSlots };
});
</script>

<template>
  <slot v-bind="groupedAttributes"></slot>
</template>
