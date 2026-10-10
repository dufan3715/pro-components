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
 * 3. 网格布局下支持展开/折叠
 * 4. 提供搜索、重置、展开/折叠按钮（支持自定义）
 *
 * ## 展开/折叠行为
 *
 * 1. 内容高度超出折叠高度（由 minExpandRows 决定，默认 2 行）时显示展开/折叠按钮
 * 2. 隐藏区域存在搜索值时自动展开
 * 3. 用户手动切换后保持手动状态，不随重新测量回退
 *
 * @param {Form} form - 搜索表单实例，由 table.searchForm 提供
 * @param {'grid' | 'inline'} [layout] - 布局形态，默认 'grid'
 * @param {boolean | Expand} [expand] - 展开配置，默认 true
 * @param {Component<ButtonProps> | DefineComponent<ButtonProps> | false} [searchButton] - 自定义搜索按钮，false 时不渲染
 * @param {Component<ButtonProps> | DefineComponent<ButtonProps> | false} [resetButton] - 自定义重置按钮，false 时不渲染
 * @param {Component<ExpandButtonProps> | DefineComponent<ExpandButtonProps> | false} [expandButton] - 自定义展开/折叠按钮，false 时不渲染
 * @param {number} [rowGap] - 行间距，默认 16
 * @param {number} [columnGap] - 列间距，默认 24
 *
 * @slot reset-button - 重置按钮插槽，作用域参数 onReset
 * @slot search-button - 搜索按钮插槽，作用域参数 onSearch
 * @slot expand-button - 展开/折叠按钮插槽，作用域参数 expandStatus / changeExpandStatus
 */
import type { FormProps } from '../../../shared/ui';
import { Space, Button } from '../../../shared/ui';
import type { AllowedComponentProps } from 'vue';
import { computed, nextTick, type Component, type DefineComponent } from 'vue';
import ProForm from '../../form/components/ProForm/index.vue';
import { type Form } from '../../form/hooks/useForm';
import DownOutlined from './icons/DownOutlined.vue';
import { useLocale } from '../../../locale';
import { useSearchFormExpand } from '../../../shared/core';

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
});

type Emits = {
  (e: 'search'): void;
  (e: 'reset'): void;
};
const emit = defineEmits<Emits>();

const { showExpandToggle, expandStatus, changeExpandStatus, heightStyle } =
  useSearchFormExpand(props);

const layoutProps = computed(() => {
  return props.layout === 'grid'
    ? {
        grid: {
          gutter: props.columnGap,
          style: { rowGap: `${props.rowGap}px` },
        },
        style: {
          display: 'flex',
          overflow: 'hidden',
          columnGap: `${props.columnGap}px`,
          height: heightStyle.value,
        },
      }
    : {
        inline: true,
        style: {
          display: 'flex',
          flexWrap: 'wrap',
          gap: `${props.rowGap}px ${props.columnGap}px`,
        },
        grid: false,
      };
});

const onReset = () => {
  emit('reset');
};

// 同一 tick 内 click 与 submit 只放行首个触达者，下一 tick 释放标记
let searchTriggeredInTick = false;

const emitSearch = () => {
  searchTriggeredInTick = true;
  nextTick(() => {
    searchTriggeredInTick = false;
  });
  emit('search');
};

// 默认查询按钮为 native-type=submit：点击与回车统一经表单 submit 事件触发
const onSearchSubmit = () => {
  if (searchTriggeredInTick) return;
  emitSearch();
};

// 自定义查询按钮与 search-button 插槽经 click 触发
const onSearchClick = () => {
  if (searchTriggeredInTick) return;
  emitSearch();
};
</script>

<template>
  <ProForm
    v-bind="layoutProps"
    :form="props.form"
    class="pro-table_search-form transition"
    @submit.prevent="onSearchSubmit"
  >
    <Space alignment="start" class="pro-table_search-form_button-group">
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
          >
            {{ t('table.reset') }}
          </Button>
        </template>
      </slot>
      <slot name="search-button" :on-search="onSearchClick">
        <template v-if="props.searchButton !== false">
          <component
            :is="props.searchButton"
            v-if="props.searchButton"
            @click="onSearchClick"
          />
          <Button
            v-else
            class="pro-table_search-form_search-button"
            type="primary"
            native-type="submit"
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
            text
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
