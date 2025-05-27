<script lang="ts" setup>
import { toPath } from 'lodash-es';
import { computed, inject, provide, toValue } from 'vue';
import { PATH } from '../../constants';

type Props = {
  fieldName?: string | number;
  fieldKey?: string;
  parentPath?: string;
};
const props = defineProps<Props>();

const injectParentPath = inject(PATH, undefined);

const path = computed(() => {
  const pPath = toValue(props.parentPath ?? injectParentPath);
  const pathValue = props.fieldName ?? [pPath, props.fieldKey].filter(Boolean);
  return toPath(pathValue).join('.');
});

provide(PATH, path);
</script>

<template>
  <slot :path="path" />
</template>
