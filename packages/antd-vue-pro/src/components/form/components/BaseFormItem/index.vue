<script lang="ts" setup>
import { memoize, omitBy, pick, pickBy, toPath } from 'lodash-es';
import {
  type ColProps as GridItemProps,
  type RowProps as GridProps,
  type FormItemProps,
  FormItem,
  Row as AGrid,
  Col as AGridItem,
} from 'ant-design-vue';
import { formItemProps } from 'ant-design-vue/es/form';
import { colProps as gridItemProps } from 'ant-design-vue/es/grid/Col';
import { computed, inject } from 'vue';
import { useProviderDisabled } from 'ant-design-vue/es/config-provider/DisabledContext';
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
  'hideFeedback',
] as const;

defineOptions({
  name: 'BaseFormItem',
});

type Props = {
  grid?: Grid;
  fields: Fields;
  path?: string;
  disabled?: boolean;
};

type ProFormPropKeys = Array<
  | keyof FormItemProps
  | keyof GridItemProps
  | (typeof customItemPropsKeys)[number]
>;

const props = withDefaults(defineProps<Props>(), {
  grid: undefined,
  path: undefined,
  disabled: undefined,
});

useProviderDisabled(computed(() => props.disabled));

const updateRefs = inject(UPDATE_REFS);

const getPath = (fieldKey: Field['key']) => {
  return [props.path, fieldKey].filter(Boolean).join('.');
};

const setFormItemRef = (el: any, field: Field) => {
  if (!el) return;
  const path = getPath(field.key);
  updateRefs?.('formItemRefs', path, el);
};

const proFormPropKeys = computed<ProFormPropKeys>(() => {
  return [
    ...formItemPropKeys,
    ...customItemPropsKeys,
    ...(props.grid ? gridItemPropKeys : []),
  ] as ProFormPropKeys;
});

const withDefault = (field: Field): Field => {
  const baseFormItemProps = pickBy(
    field as any,
    (v, k) => formItemPropKeys.includes(k) || k.startsWith('data-form-item')
  );
  const defaultProps = {
    validateFirst: true,
  };
  return {
    ...defaultProps,
    ...baseFormItemProps,
  };
};

const omitFormItemProps = memoize((field: Field) => {
  return omitBy(
    field as any,
    (v, k) =>
      proFormPropKeys.value.includes(k as any) || k.startsWith('data-form-item')
  );
});

const withDefaultGrid = computed(() => {
  if (props.grid) {
    const defaultGrid: GridProps = { gutter: 24 };
    return props.grid === true
      ? defaultGrid
      : { ...defaultGrid, ...props.grid };
  }
  return props.grid;
});

const withDefaultGridItem = memoize((field: Field) => {
  const fieldGridItemProps = pick(field as any, gridItemPropKeys);
  return {
    span: field.fields ? 24 : 8,
    ...fieldGridItemProps,
  };
});
</script>

<template>
  <ContainerFragment
    :component="grid ? AGrid : undefined"
    v-bind="withDefaultGrid">
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
            :hide-feedback="field.hideFeedback"
            :name="path ? toPath(getPath(field.key)) : getPath(field.key)"
            :path="getPath(field.key)">
            <template v-if="field.fields">
              <BaseFormItem
                :grid="field.grid ?? grid"
                :fields="field.fields"
                :path="getPath(field.key)"
                :disabled="field.disabled">
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
                v-bind="{ path: getPath(field.key) }"
                :component="slot" />
            </template>
          </FormItem>
        </ContainerFragment>
      </component>
    </template>
  </ContainerFragment>
</template>
<style lang="less">
.ant-form-item:has(> [hide-feedback='true']) {
  margin-bottom: 0;
}
</style>
