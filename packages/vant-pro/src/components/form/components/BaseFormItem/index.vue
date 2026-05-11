<script lang="ts" setup>
import { computed, toValue } from 'vue';
import { toPath } from '../../../../shared/core';
import type { Fields } from '../../types';
import {
  BaseField,
  ContainerFragment,
  GroupedFieldAttrs,
  PathProvider,
} from '..';

defineOptions({ name: 'BaseFormItem', inheritAttrs: false });

type Props = {
  fields?: Fields;
};

const props = defineProps<Props>();

const validFields = computed(() => {
  const f = toValue(props.fields);
  if (!Array.isArray(f)) return [];
  return f.filter(field => !toValue(field.hidden));
});
</script>

<template>
  <template
    v-for="(field, index) in validFields"
    :key="toPath(toValue(field.path || index)).join('.') || index"
  >
    <PathProvider :path="toValue(field.path) as any">
      <template #default="{ path }">
        <GroupedFieldAttrs :field="field">
          <template #default="{ componentProps }">
            <template v-if="field.fields">
              <ContainerFragment
                :component="field.fieldContainer"
                :path="path"
                v-bind="componentProps"
              >
                <BaseFormItem :fields="field.fields" />
              </ContainerFragment>
            </template>
            <template v-else>
              <BaseField v-bind="componentProps" :path="path" />
            </template>
          </template>
        </GroupedFieldAttrs>
      </template>
    </PathProvider>
  </template>
</template>
