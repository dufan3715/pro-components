<script lang="ts">
type Expand = {
  // 网格布局时默认展开行数量
  minExpandRows?: number;
  // 网格布局时展开状态
  expandStatus?: boolean;
};

type _FormProps = Pick<
  Partial<FormProps>,
  | 'colon'
  | 'disabled'
  | 'labelAlign'
  | 'labelCol'
  | 'labelWrap'
  | 'name'
  | 'wrapperCol'
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
  onBeforeUnmount,
  type Component,
  type DefineComponent,
} from 'vue';
import ProForm from '../../form';
import { type Form } from '../../form';
import DownOutlined from './icons/DownOutlined.vue';
import { useLocale } from '../../../locale';

defineOptions({ name: 'SearchForm' });

const { t } = useLocale();

const props = withDefaults(defineProps<SearchFormProps>(), {
  layout: 'grid',
  expand: true,
  searchButton: undefined,
  resetButton: undefined,
  expandButton: undefined,
  rowGap: 16,
  columnGap: 24,
  form: undefined,
});

type Emits = {
  (e: 'search'): void;
  (e: 'reset'): void;
};
const emit = defineEmits<Emits>();

const proFormHeight = ref<'unset' | number>('unset');
const collapseHeight = ref(0);
const rowHeight = ref(32);

let resizeObserver: ResizeObserver | null = null;
let intersectionObserver: IntersectionObserver | null = null;

const cleanupObservers = () => {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  if (intersectionObserver) {
    intersectionObserver.disconnect();
    intersectionObserver = null;
  }
};

onBeforeUnmount(() => {
  cleanupObservers();
});

const computedExpand = computed(() => {
  if (!props.expand) return false;
  if (props.expand === true) return { minExpandRows: 2, expandStatus: false };
  return {
    minExpandRows: Math.max(Math.floor(props.expand.minExpandRows ?? 2), 1),
    expandStatus: props.expand.expandStatus ?? false,
  };
});

const showExpandToggle = ref(false);

const expandStatus = ref(true);

const updateHeights = () => {
  if (!props.expand || !props.form?.formRef?.value) return;
  const proFormEl = (props.form.formRef.value as any)?.$el;
  if (!proFormEl) return;

  const itemHeight = proFormEl
    ?.querySelector("[class*='-form-item']")
    ?.getBoundingClientRect?.()?.height;
  if (itemHeight && itemHeight > 0) {
    rowHeight.value = itemHeight;
  }

  // 使用 scrollHeight 测量自然展开高度，突破固定高度与 overflow: hidden 样式的自引用限制
  const naturalHeight =
    proFormEl.scrollHeight || proFormEl.getBoundingClientRect?.()?.height || 0;
  if (naturalHeight > 0) {
    proFormHeight.value = naturalHeight;
  }
};

// 手动展开/收起标记：置位后自动测量不再覆盖用户操作
const isManualToggle = ref(false);

const changeExpandStatus = () => {
  isManualToggle.value = true;
  expandStatus.value = !expandStatus.value;
};

// 检查字段是否有值（非 null、非 undefined、非空字符串、非空数组、非空对象）
const hasFieldValue = (val: any) =>
  val !== null &&
  val !== undefined &&
  val !== '' &&
  !(Array.isArray(val) && val.length === 0) &&
  !(typeof val === 'object' && Object.keys(val).length === 0);

/*
 * 使用 IntersectionObserver 检测折叠状态下隐藏字段是否有值
 * 如果有值则自动展开，让用户看到已填写的搜索条件
 */
const setInitExpandStatus = () => {
  if (isManualToggle.value) return;
  const initStatus = computedExpand.value
    ? computedExpand.value.expandStatus
    : false;
  expandStatus.value = initStatus;
  if (props.form?.formRef?.value && computedExpand.value) {
    const formEl = (props.form.formRef.value as any).$el;
    const formItemsEl = formEl?.querySelectorAll?.(
      "[class*='-form-item'] > [path]"
    );
    if (!formItemsEl || formItemsEl.length === 0) return;
    if (intersectionObserver) {
      intersectionObserver.disconnect();
    }
    intersectionObserver = new IntersectionObserver(
      entries => {
        if (isManualToggle.value) return;
        expandStatus.value = entries.some(e => {
          // 如果隐藏字段（intersectionRatio === 0）有值，则自动展开
          if (e.intersectionRatio === 0) {
            const path = e.target.getAttribute('path');
            const searchFieldValue = path
              ? props.form?.getFormData?.(path)
              : undefined;
            return hasFieldValue(searchFieldValue);
          }
          return computedExpand.value
            ? computedExpand.value.expandStatus
            : false;
        });
        intersectionObserver?.disconnect();
      },
      { root: formEl }
    );
    formItemsEl.forEach((element: Element) => {
      intersectionObserver?.observe(element);
    });
  }
};

watch(
  [
    () => props.form?.fields.value?.filter(f => !f.hidden)?.length,
    () => props.form?.formRef?.value,
    () => props.expand,
  ],
  () => {
    updateHeights();
  },
  { flush: 'post', immediate: true }
);

watch(
  () => props.form?.formRef?.value,
  val => {
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    const formEl = (val as any)?.$el;
    if (formEl && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateHeights();
      });
      resizeObserver.observe(formEl);
    }
  },
  { immediate: true }
);

watchEffect(
  () => {
    if (typeof proFormHeight.value !== 'number') return;
    if (props.layout === 'grid' && computedExpand.value) {
      const { minExpandRows } = computedExpand.value;
      collapseHeight.value = Math.min(
        minExpandRows * rowHeight.value + (minExpandRows - 1) * props.rowGap,
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

const layoutProps = computed(() => {
  const currentHeight = expandStatus.value
    ? proFormHeight.value
    : collapseHeight.value;
  const heightStyle =
    currentHeight !== 'unset' && currentHeight !== undefined
      ? `${currentHeight}px`
      : undefined;

  return props.layout === 'grid'
    ? {
        grid: {
          gutter: [props.columnGap, props.rowGap] as [number, number],
          style: { flex: 1, marginRight: '12px' },
        },
        style: { display: 'flex', overflow: 'hidden', height: heightStyle },
      }
    : {
        layout: 'inline' as any,
        style: { gap: `${props.rowGap}px ${props.columnGap}px` },
        grid: false,
      };
});

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
    :form="props.form"
    class="pro-table_search-form transition"
  >
    <Space align="start" class="pro-table_search-form_button-group">
      <slot name="reset-button" :on-reset="onReset">
        <template v-if="props.resetButton !== false">
          <component
            :is="props.resetButton"
            v-if="props.resetButton"
            @click="onReset"
          />
          <Button
            v-else
            class="pro-table_search-form_reset-button"
            @click="onReset"
            >{{ t('table.reset') }}</Button
          >
        </template>
      </slot>
      <slot name="search-button" :on-search="onSearch">
        <template v-if="props.searchButton !== false">
          <component
            :is="props.searchButton"
            v-if="props.searchButton"
            @click="onSearch"
          />
          <Button
            v-else
            class="pro-table_search-form_search-button"
            type="primary"
            html-type="submit"
            @click="onSearch"
          >
            {{ t('table.query') }}
          </Button>
        </template>
      </slot>
      <slot
        name="expand-button"
        :expand-status="expandStatus"
        :change-expand-status="changeExpandStatus"
      >
        <template v-if="props.expandButton !== false && showExpandToggle">
          <component
            :is="props.expandButton"
            v-if="props.expandButton"
            :expand-status="expandStatus"
            @click="changeExpandStatus"
          />
          <Button
            v-else
            type="link"
            class="pro-table_search-form_expand-toggle-button"
            @click="changeExpandStatus"
          >
            {{ expandStatus ? t('table.collapse') : t('table.expand') }}
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
  :deep([class*='-form-item']) {
    margin: 0;
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
