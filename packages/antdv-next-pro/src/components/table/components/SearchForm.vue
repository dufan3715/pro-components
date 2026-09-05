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
 * 3. 网格布局下支持展开/折叠（溢出检测与初值自动展开见下方机制说明）
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
  type Component,
  type DefineComponent,
} from 'vue';
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
  form: undefined,
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
          gutter: [props.columnGap, props.rowGap] as [number, number],
          style: { flex: 1, marginRight: '12px' },
        },
        style: {
          display: 'flex',
          overflow: 'hidden',
          height: heightStyle.value,
        },
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
