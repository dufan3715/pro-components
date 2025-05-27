<script lang="ts" setup>
import { toPath } from 'lodash-es';
import {
  type RowProps as GridProps,
  FormItem,
  Row as AGrid,
  Col as AGridItem,
} from 'ant-design-vue';
import { FormItemInstance } from 'ant-design-vue/es/form';
import { computed, ref } from 'vue';
import { useProviderDisabled } from 'ant-design-vue/es/config-provider/DisabledContext';
import type { Field, Fields, Grid, WithInstanceGetter } from '../../types';
import { BaseField, SlotComponent, ContainerFragment } from '..';
import PathProvider from '../PathProvider/index.vue';
import MixinFieldAttrs from '../MixinFieldAttrs/index.vue';

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

const validFields = computed(() => props.fields.filter(field => !field.hidden));

useProviderDisabled(computed(() => props.disabled));

const formItemRefs = ref<FormItemInstance[]>();

const setFormItemRef = (el: any, field: Field) => {
  if (!el) return;
  if ((field as WithInstanceGetter<Field>)?.getFormItemRef?.() === el) return;
  Object.assign(field, { getFormItemRef: () => el });
};

const setComponentRef = (el: any, field: Field) => {
  if (!el) return;
  if ((field as WithInstanceGetter<Field>)?.getComponentRef?.() === el) return;
  Object.assign(field, { getComponentRef: () => el });
};

const withDefaultGridProps = computed(() => {
  if (props.grid) {
    const defaultGrid: GridProps = { gutter: 24 };
    return props.grid === true
      ? defaultGrid
      : { ...defaultGrid, ...props.grid };
  }
  return props.grid;
});
</script>

<template>
  <ContainerFragment
    :component="grid ? AGrid : undefined"
    v-bind="withDefaultGridProps"
  >
    <template v-for="(field, index) of validFields" :key="index">
      <PathProvider
        :field-name="(field as any).name"
        :field-key="(field as any).key"
      >
        <template #default="{ path }">
          <MixinFieldAttrs :field="field">
            <template
              #default="{
                gridItemProps,
                formItemProps,
                componentProps,
                formItemSlots,
              }"
            >
              <ContainerFragment
                :component="grid ? AGridItem : undefined"
                v-bind="gridItemProps"
              >
                <ContainerFragment :component="field.container" :path="path">
                  <FormItem
                    v-bind="formItemProps"
                    ref="formItemRefs"
                    :name="toPath(path)"
                    :path="path"
                    @vue:mounted="
                      () => setFormItemRef(formItemRefs?.[index], field)
                    "
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
                        :grid="field.grid ?? grid"
                        :fields="field.fields"
                        :disabled="field.disabled"
                      >
                      </BaseFormItem>
                    </template>
                    <template v-else-if="field.component">
                      <BaseField
                        v-bind="componentProps"
                        :path="path"
                        @set-component-ref="
                          (el: any) => setComponentRef(el, field)
                        "
                      >
                      </BaseField>
                    </template>
                    <template v-else> missing "component" prop </template>
                  </FormItem>
                </ContainerFragment>
              </ContainerFragment>
            </template>
          </MixinFieldAttrs>
        </template>
      </PathProvider>
    </template>
  </ContainerFragment>
</template>
