<script lang="ts" setup>
import { computed } from 'vue';
import type { Field } from '../../types';
import { isPlainObject } from '../../../../shared/core';

type Props = {
  field: Field;
};
const props = defineProps<Props>();

type GroupedFieldAttrs = {
  componentProps: Record<string, any>;
};

const groupedAttributes = computed<GroupedFieldAttrs>(() => {
  let componentProps: Record<string, any> = {};

  if (isPlainObject(props.field)) {
    // prettier-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { path, formItemContainer, fields, hidden, extraProps, ...rest } =
    props.field as any;
    componentProps = rest;
  }

  return { componentProps };
});
</script>

<template>
  <slot v-bind="groupedAttributes"></slot>
</template>
