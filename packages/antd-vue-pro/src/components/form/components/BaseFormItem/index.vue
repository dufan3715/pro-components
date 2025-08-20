<script lang="ts" setup>
import { getObject, toPath } from '../../../../shared/utils';
import {
  FormItem,
  Grid as UIGrid,
  GridItem as UIGridItem,
  GridProps,
  useProviderDisabled,
} from '../../../../shared/ui';
import { computed, inject, toValue } from 'vue';
import type { Fields, Grid } from '../../types';
import { BaseField, SlotComponent, ContainerFragment } from '..';
import PathProvider from '../PathProvider/index.vue';
import GroupedFieldAttrs from '../GroupedFieldAttrs/index.vue';
import { INJECT_CONFIG } from '../../../component-provider';

defineOptions({ name: 'BaseFormItem', inheritAttrs: false });

type Props = {
  grid?: Grid;
  fields?: Fields;
  disabled?: boolean;
};
const props = withDefaults(defineProps<Props>(), {
  grid: undefined,
  fields: () => [],
  disabled: undefined,
});

const validFields = computed(() =>
  props.fields.filter?.(field => !field.hidden)
);

useProviderDisabled(computed(() => props.disabled));

const config = INJECT_CONFIG['pro-form'];

const { grid: injectGrid } = inject(config.injectionKey, config.default);

const enableGrid = computed(() => {
  if (props.grid !== undefined) return !!props.grid;
  return !!injectGrid;
});

const computedGridProps = computed<GridProps>(() => {
  return enableGrid.value
    ? { ...getObject(injectGrid), ...getObject(props.grid) }
    : {};
});

const formItemRefs: any[] = [];
const componentRefs: any[] = [];

const onFormItemMounted = (index: number, formItemProps?: any) => {
  const field = validFields.value[index];
  Object.assign(field, {
    getFormItemRef: () => formItemRefs[index],
    getFormItemComputedProps: () => formItemProps,
  });
};

const onComponentMounted = (index: number) => {
  const field = validFields.value[index];
  Object.assign(field, {
    getComponentRef: () => componentRefs[index]?.getComponentRef(),
    getComponentComputedProps: () =>
      componentRefs[index]?.getComponentComputedProps(),
  });
};
</script>

<template>
  <ContainerFragment
    :component="enableGrid ? UIGrid : undefined"
    v-bind="computedGridProps"
  >
    <PathProvider
      v-for="({ path: _path, name: _name, ...field }, index) of validFields"
      :key="toPath(toValue((_name ?? _path) as any)).join('.') || index"
      v-bind="{ path: (_name ?? _path) as any }"
    >
      <template #default="{ path }">
        <GroupedFieldAttrs :field="field">
          <template
            #default="{
              gridItemProps,
              formItemProps: { container, ...formItemProps },
              componentProps,
              formItemSlots,
            }"
          >
            <ContainerFragment
              :component="enableGrid ? UIGridItem : undefined"
              v-bind="gridItemProps"
            >
              <ContainerFragment :component="container" :path="path">
                <FormItem
                  v-bind="formItemProps"
                  :ref="el => (formItemRefs[index] = el)"
                  :name="toPath(path)"
                  :path="path"
                  @vue:mounted="onFormItemMounted(index, formItemProps)"
                >
                  <template
                    v-for="(slot, name) in formItemSlots"
                    :key="name"
                    #[name]="scoped"
                  >
                    <SlotComponent
                      :path="path"
                      :component="slot"
                      v-bind="scoped"
                    />
                  </template>
                  <template v-if="field.fields">
                    <BaseFormItem
                      :grid="(field as any).grid ?? grid"
                      :fields="field.fields"
                      :disabled="field.disabled"
                    />
                  </template>
                  <template v-else>
                    <BaseField
                      :ref="el => (componentRefs[index] = el)"
                      v-bind="componentProps"
                      :path="path"
                      @vue:mounted="onComponentMounted(index)"
                    />
                  </template>
                </FormItem>
              </ContainerFragment>
            </ContainerFragment>
          </template>
        </GroupedFieldAttrs>
      </template>
    </PathProvider>
  </ContainerFragment>
</template>
