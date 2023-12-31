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
  name: 'BaseFormItems',
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
  const baseFormItemsProps = pick(field, [
    ...formItemPropKeys,
    ...customItemPropsKeys,
  ]);
  delete baseFormItemsProps.className;
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
    ...baseFormItemsProps,
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
    :component="grid ? NGrid : undefined"
    v-bind="grid ? withDefaultGrid : undefined">
    <template
      v-for="(field, index) of fields"
      :key="getPath(field.key) || index">
      <component
        :is="grid ? NGridItem : ContainerFragment"
        v-if="field && !field.hidden"
        v-bind="grid ? withDefaultGridItem(field) : undefined">
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
              <BaseFormItems
                :grid="field.grid ?? grid"
                :fields="field.fields"
                :path="getPath(field.key)">
              </BaseFormItems>
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
            <template v-if="field.slots?.label ?? field.label" #label>
              <SlotComponent
                :component="((field.slots?.label ?? field.label) as any )"
                v-bind="{ path: getPath(field.key) }" />
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
