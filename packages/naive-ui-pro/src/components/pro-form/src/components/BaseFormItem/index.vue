<script lang="ts" setup>
import { memoize, omit, pick } from 'lodash-es';
import {
  type GridItemProps,
  type FormItemProps,
  NFormItem,
  NGrid,
  NGridItem,
  GridProps,
} from 'naive-ui';
import { formItemPropKeys } from 'naive-ui/es/form/src/FormItem';
import { gridItemPropKeys } from 'naive-ui/es/grid/src/GridItem';
import { computed, inject } from 'vue';
import type { Field, Fields, Grid } from '../../types';
import { BaseField, SlotComponent, ContainerFragment } from '..';
import { UPDATE_REFS } from '../../constants';

memoize.Cache = WeakMap;

const customItemPropsKeys = [
  'style',
  'className',
  'hidden',
  'container',
] as const;

defineOptions({
  name: 'BaseFormItem',
});

type Props = {
  grid?: Grid;
  fields: Fields;
  path?: string;
};

type ProFormPropKeys = Array<
  | keyof FormItemProps
  | keyof GridItemProps
  | (typeof customItemPropsKeys)[number]
>;

const props = defineProps<Props>();

const updateRefs = inject(UPDATE_REFS);

const getPath = (fieldKey: Field['key']) => {
  if (props.path) {
    if (fieldKey) {
      return `${props.path}.${fieldKey}`;
    }
    return props.path;
  }
  return fieldKey || '';
};

const setFormItemRef = (el: any, field: Field) => {
  if (!el) return;
  const path = getPath(field.key);
  updateRefs?.(path, el, 'formItemRefs');
};

const proFormPropKeys = computed<ProFormPropKeys>(() => {
  return [
    ...formItemPropKeys,
    ...customItemPropsKeys,
    ...(props.grid ? gridItemPropKeys : []),
  ] as ProFormPropKeys;
});

const withDefault = (field: Field): any => {
  const baseFormItemProps = pick(field, [
    ...formItemPropKeys,
    ...customItemPropsKeys,
  ]);
  delete baseFormItemProps.className;
  const defaultProps = {
    first: true,
  };
  if (field.fields) {
    Object.assign(defaultProps, {
      showFeedback: false,
      labelStyle: {
        display: 'block',
        ...(<object>field.labelStyle || {}),
      },
    });
  }
  return {
    ...defaultProps,
    ...baseFormItemProps,
    label: undefined,
    container: undefined,
  };
};

const omitFormItemProps = memoize((field: Field) => {
  return omit(field, proFormPropKeys.value);
});

const defaultGrid: GridProps = {
  cols: 24,
  xGap: 24,
};
const withDefaultGrid = computed(() => {
  if (props.grid) {
    if (typeof props.grid === 'boolean') {
      return defaultGrid;
    }
    return { ...defaultGrid, ...props.grid };
  }
  return undefined;
});

const withDefaultGridItem = memoize((field: Field) => {
  const defaultSpan = field.fields ? 24 : 8;
  const fieldGridItemProps = pick(field, gridItemPropKeys);
  return {
    ...fieldGridItemProps,
    span: field.span ?? defaultSpan,
  };
});
</script>

<template>
  <ContainerFragment
    :component="props.grid ? NGrid : undefined"
    v-bind="props.grid ? withDefaultGrid : undefined">
    <template
      v-for="(field, index) of fields"
      :key="getPath(field.key) || index">
      <component
        :is="props.grid ? NGridItem : ContainerFragment"
        v-if="field && !field.hidden"
        v-bind="props.grid ? withDefaultGridItem(field) : undefined">
        <ContainerFragment
          :component="field.container"
          :path="getPath(field.key)">
          <NFormItem
            v-bind="withDefault(field)"
            :ref="(el: any) => setFormItemRef(el, field)"
            :class="field.className"
            :style="field.style"
            :path="getPath(field.key)">
            <template v-if="field.fields">
              <BaseFormItem
                :grid="field.grid ?? props.grid"
                :fields="field.fields"
                :path="getPath(field.key)">
              </BaseFormItem>
            </template>
            <template v-else-if="!field.component">
              missing "component" prop
            </template>
            <template v-else>
              <BaseField
                v-bind="omitFormItemProps(field)"
                :label="field.label"
                :path="getPath(field.key)" />
            </template>
            <template #label>
              <SlotComponent
                :component="field.label"
                :path="getPath(field.key)" />
            </template>
          </NFormItem>
        </ContainerFragment>
      </component>
    </template>
  </ContainerFragment>
</template>

<style scoped lang="less">
:deep(.n-form-item-blank:has(.n-form-item-blank)) {
  display: block;
}
</style>
