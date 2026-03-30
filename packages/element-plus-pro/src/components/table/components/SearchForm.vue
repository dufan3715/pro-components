<script lang="ts">
type Expand = {
  // 网格布局时默认展开行数量
  minExpandRows?: number;
  // 网格布局时展开状态
  expandStatus?: boolean;
};

type _FormProps = Pick<
  Partial<FormProps>,
  | 'disabled'
  | 'labelPosition'
  | 'labelWidth'
  | 'inline'
  | 'inlineMessage'
  | 'statusIcon'
  | 'showMessage'
  | 'size'
>;

type ButtonProps = { onClick: () => void };
type ExpandButtonProps = ButtonProps & { expandStatus: boolean };

export type SearchFormProps = {
  form: Form;
  layout?: 'grid' | 'inline';
  expand?: boolean | Expand;
  searchButton?: Component<ButtonProps> | DefineComponent<ButtonProps>;
  resetButton?: Component<ButtonProps> | DefineComponent<ButtonProps>;
  expandButton?:
    | Component<ExpandButtonProps>
    | DefineComponent<ExpandButtonProps>;
} & /* @vue-ignore */ _FormProps &
  AllowedComponentProps;
</script>

<script lang="ts" setup>
import { Space, Button, FormProps } from '../../../shared/ui';
import {
  AllowedComponentProps,
  computed,
  ref,
  watch,
  watchEffect,
  type Component,
  type DefineComponent,
} from 'vue';
import ProForm from '../../form';
import { type Form } from '../../form';
import DownOutlined from './icons/DownOutlined.vue';

defineOptions({ name: 'SearchForm' });

const {
  layout = 'grid',
  expand = true,
  searchButton = undefined,
  resetButton = undefined,
  expandButton = undefined,
  form,
} = defineProps<SearchFormProps>();

type Emits = {
  (e: 'search'): void;
  (e: 'reset'): void;
};
const emit = defineEmits<Emits>();

const proFormHeight = ref<'unset' | number>('unset');
const collapseHeight = ref(0);
let rowHeight = 32;
const rowGap = 16;
const columnGap = 24;

const computedExpand = computed(() => {
  if (!expand) return false;
  if (expand === true) return { minExpandRows: 2, expandStatus: false };
  return {
    minExpandRows: Math.max(Math.floor(expand.minExpandRows ?? 2), 1),
    expandStatus: expand.expandStatus ?? false,
  };
});

const showExpandToggle = ref(false);

const expandStatus = ref(true);

const changeExpandStatus = () => {
  expandStatus.value = !expandStatus.value;
};

const { formRef, getFormData } = form;

const setInitExpandStatus = () => {
  expandStatus.value = false;
  if (formRef.value && expand) {
    const formEl = (formRef.value as any).$el;
    const formItemsEl = formEl.querySelectorAll(
      "[class*='-form-item'] > [path]"
    );
    const observer = new IntersectionObserver(
      entries => {
        expandStatus.value = entries.some(e => {
          if (e.intersectionRatio === 0) {
            const path = e.target.getAttribute('path');
            const searchFieldValue = path ? getFormData?.(path) : undefined;
            return ![null, undefined].includes(searchFieldValue);
          }
          return (expand as any).expandStatus;
        });
        observer.disconnect();
      },
      { root: formEl }
    );
    formItemsEl.forEach((element: Element) => {
      observer.observe(element);
    });
  }
};

watch(
  [
    () => form?.fields.value?.filter((f: any) => !f.hidden)?.length,
    () => formRef.value,
  ],
  () => {
    if (!expandStatus.value || !formRef.value) return;
    const proFormEl = (formRef.value as any)?.$el;
    const { height = 0 } = proFormEl?.getBoundingClientRect?.() || {};
    proFormHeight.value = height;
    rowHeight = proFormEl
      ?.querySelector("[class*='-form-item']")
      ?.getBoundingClientRect?.()?.height;
  },
  { flush: 'post', immediate: true }
);

watchEffect(
  () => {
    if (typeof proFormHeight.value !== 'number') return;
    if (layout === 'grid' && computedExpand.value) {
      const { minExpandRows } = computedExpand.value;
      collapseHeight.value = Math.min(
        minExpandRows * rowHeight + (minExpandRows - 1) * rowGap,
        +proFormHeight.value
      );
      showExpandToggle.value = +proFormHeight.value - collapseHeight.value > 1;
      if (showExpandToggle.value) {
        setInitExpandStatus();
      }
    } else {
      showExpandToggle.value = false;
    }
  },
  { flush: 'post' }
);

const layoutProps = computed(() =>
  layout === 'grid'
    ? {
        grid: {
          gutter: columnGap,
          style: { rowGap: `${rowGap}px` },
        },
        style: {
          display: 'flex',
          overflow: 'hidden',
          columnGap: `${columnGap}px`,
          height: `${expandStatus.value ? proFormHeight.value : collapseHeight.value}px`,
        },
      }
    : {
        inline: true,
        style: {
          display: 'flex',
          flexWrap: 'wrap',
          gap: `${rowGap}px ${columnGap}px`,
        },
        grid: false,
      }
);

const onReset = () => {
  emit('reset');
};

const onSearch = () => {
  emit('search');
};
</script>

<template>
  <ProForm
    v-bind="layoutProps"
    :form="form"
    class="pro-table_search-form transition"
    @keyup.enter="onSearch"
  >
    <Space alignment="start" class="pro-table_search-form_button-group">
      <slot name="reset-button" @click="onReset">
        <component :is="resetButton" v-if="resetButton" @click="onReset" />
        <Button
          v-else
          class="pro-table_search-form_reset-button"
          @click="onReset"
          >重置</Button
        >
      </slot>
      <slot name="search-button" @click="onSearch">
        <component :is="searchButton" v-if="searchButton" @click="onSearch" />
        <Button
          v-else
          class="pro-table_search-form_search-button"
          type="primary"
          native-type="submit"
          @click="onSearch"
        >
          查询
        </Button>
      </slot>
      <slot name="expand-button" @click="changeExpandStatus">
        <template v-if="showExpandToggle">
          <component
            :is="expandButton"
            v-if="expandButton"
            :expand-status="expandStatus"
            @click="changeExpandStatus"
          />
          <Button
            v-else
            text
            class="pro-table_search-form_expand-toggle-button"
            @click="changeExpandStatus"
          >
            {{ expandStatus ? '收起' : '展开' }}
            <DownOutlined
              class="transition"
              style="margin-left: 4px"
              :style="{ transform: `rotate(${expandStatus ? -180 : 0}deg)` }"
            />
          </Button>
        </template>
      </slot>
    </Space>
  </ProForm>
</template>

<style scoped lang="less">
.pro-table_search-form {
  :deep {
    [class*='-form-item'] {
      margin: 0;
    }
  }
  &_expand-toggle-button {
    display: flex;
    align-items: center;
    padding: 0;
    padding-left: 4px;
  }

  .transition {
    transition: all 0.25s;
  }
}
</style>
