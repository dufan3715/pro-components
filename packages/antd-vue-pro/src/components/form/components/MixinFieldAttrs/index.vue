<script lang="ts" setup>
import { computed, mergeProps, toValue } from 'vue';
import { colProps as gridItemProps } from 'ant-design-vue/es/grid/Col';
import { formItemProps } from 'ant-design-vue/es/form';
import { FORM_ITEM_SLOT_KEYS } from '../../constants';
import { INJECT_KEYS, useInjectProps } from '../../../component-provider';

const formItemPropKeys = Object.keys(formItemProps());
const gridItemPropKeys = Object.keys(gridItemProps());

type Props = {
  field: any;
};
const props = defineProps<Props>();

const injectFormItemProps = useInjectProps(INJECT_KEYS['pro-form-item']);

const groupedAttributes = computed(() => {
  // prettier-ignore
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { slots = {}, fields, getFormItemRef, getComponentRef, className, style, hidden, container, hideFeedback, ...rest } =
    props.field;
  const { injectClassName, injectStyle, ...injectRest } = injectFormItemProps;

  const gridItemProps: Record<string, any> = { span: fields ? 24 : 8 };
  const formItemProps: Record<string, any> = mergeProps(
    injectRest,
    { class: toValue(className), style: toValue(style) },
    { class: injectClassName, style: injectStyle },
    { style: toValue(hideFeedback) ? { marginBottom: 0 } : {} }
  );
  const componentProps: Record<string, any> = { slots: {} };
  const formItemSlots: Record<string, any> = {};

  Object.keys(rest).forEach(k => {
    if (gridItemPropKeys.includes(k)) {
      gridItemProps[k] = props.field[k];
    } else if (formItemPropKeys.includes(k) || k.startsWith('data-form-item')) {
      formItemProps[k] = props.field[k];
    } else {
      componentProps[k] = props.field[k];
    }
  });
  Object.keys(slots).forEach(k => {
    if (FORM_ITEM_SLOT_KEYS.includes(k as any)) {
      formItemSlots[k] = slots[k];
    } else {
      componentProps['slots'][k] = slots[k];
    }
  });
  return { gridItemProps, formItemProps, componentProps, formItemSlots };
});
</script>

<template>
  <slot v-bind="groupedAttributes"></slot>
</template>
