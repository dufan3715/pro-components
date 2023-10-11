<script lang="ts" setup>
import { memoize, omit, pick } from 'lodash-es';
import {
  type ColProps as GridItemProps,
  type RowProps as GridProps,
  type FormItemProps,
  FormItem,
  Row as AGrid,
  Col as AGridItem,
} from 'ant-design-vue';
import { formItemProps } from 'ant-design-vue/es/form';
import { rowProps as gridItemProps } from 'ant-design-vue/es/grid/Row';
import { computed, inject } from 'vue';
import type { Field, Fields, Grid } from '../../types';
import { BaseField, SlotComponent, ContainerFragment } from '..';
import { UPDATE_REFS, FORM_ITEM_SLOT_KEYS } from '../../constants';

const formItemPropKeys = Object.keys(formItemProps());
const gridItemPropKeys = Object.keys(gridItemProps());

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
    });
  }
  return {
    ...defaultProps,
    ...baseFormItemProps,
    container: undefined,
  };
};

const omitFormItemProps = memoize((field: Field) => {
  return omit(field, proFormPropKeys.value);
});

const defaultGrid: GridProps = {
  gutter: 24,
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
    :component="grid ? AGrid : undefined"
    v-bind="grid ? withDefaultGrid : undefined">
    <template
      v-for="(field, index) of fields"
      :key="getPath(field.key) || index">
      <component
        :is="grid ? AGridItem : ContainerFragment"
        v-if="field && !field.hidden"
        v-bind="grid ? withDefaultGridItem(field) : undefined">
        <ContainerFragment
          :component="field.container"
          :path="getPath(field.key)">
          <FormItem
            v-bind="withDefault(field)"
            :ref="(el: any) => setFormItemRef(el, field)"
            :class="field.className"
            :style="field.style"
            :path="getPath(field.key)">
            <template v-if="field.fields">
              <BaseFormItem
                :grid="field.grid ?? grid"
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
            <template v-for="(slot, name) in field.slots" :key="name" #[name]>
              <SlotComponent
                v-if="FORM_ITEM_SLOT_KEYS.includes(name)"
                v-bind="{ path }"
                :component="slot" />
            </template>
          </FormItem>
        </ContainerFragment>
      </component>
    </template>
  </ContainerFragment>
</template>
