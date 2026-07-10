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
  searchButton?: Component<ButtonProps> | DefineComponent<ButtonProps> | false;
  resetButton?: Component<ButtonProps> | DefineComponent<ButtonProps> | false;
  expandButton?:
    | Component<ExpandButtonProps>
    | DefineComponent<ExpandButtonProps>
    | false;
  rowGap?: number;
  columnGap?: number;
} & /* @vue-ignore */ _FormProps &
  AllowedComponentProps;
</script>

<script lang="ts" setup>
/**
 * @component SearchForm
 * @description ProTable 的搜索表单子组件
 *
 * ## 核心功能
 *
 * 1. 内部渲染 ProForm，使用 table.searchForm 管理搜索条件
 * 2. 支持 grid（网格）和 inline（行内）两种布局
 * 3. 网格布局下支持展开/折叠：通过 IntersectionObserver 自动检测哪些字段溢出
 * 4. 提供搜索、重置、展开/折叠按钮（支持自定义）
 *
 * ## 展开/折叠机制
 *
 * 1. 首次渲染后，测量 ProForm 的实际高度
 * 2. 根据 minExpandRows 计算折叠高度（默认 2 行）
 * 3. 如果实际高度 > 折叠高度，显示展开/折叠按钮
 * 4. 使用 IntersectionObserver 检测隐藏字段是否有值，有值则自动展开
 */
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
  rowGap = 16,
  columnGap = 24,
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

/*
 * 使用 IntersectionObserver 检测折叠状态下隐藏字段是否有值
 * 如果有值则自动展开，让用户看到已填写的搜索条件
 */
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
          // 如果隐藏字段（intersectionRatio === 0）有值，则自动展开
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
    () => expand,
  ],
  () => {
    if (!expand || !expandStatus.value || !formRef.value) return;
    const proFormEl = (formRef.value as any)?.$el;
    const { height = 0 } = proFormEl?.getBoundingClientRect?.() || {};
    proFormHeight.value = height;
    rowHeight = proFormEl
      ?.querySelector("[class*='-form-item']")
      ?.getBoundingClientRect?.()?.height;
  },
  { flush: 'post', immediate: true }
);

/*
 * 计算折叠高度和是否显示展开按钮
 * 折叠高度 = minExpandRows * 行高 + (minExpandRows - 1) * 行间距
 * 如果实际高度与折叠高度差异 > 1px，说明有字段溢出，显示展开按钮
 */
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
        <template v-if="resetButton !== false">
          <component :is="resetButton" v-if="resetButton" @click="onReset" />
          <Button
            v-else
            class="pro-table_search-form_reset-button"
            @click="onReset"
            >重置</Button
          >
        </template>
      </slot>
      <slot name="search-button" @click="onSearch">
        <template v-if="searchButton !== false">
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
        </template>
      </slot>
      <slot name="expand-button" @click="changeExpandStatus">
        <template v-if="expandButton !== false && showExpandToggle">
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
