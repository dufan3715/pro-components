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
  | 'hideRequiredMark'
  | 'labelAlign'
  | 'labelCol'
  | 'labelWrap'
  | 'name'
  | 'wrapperCol'
>;

export type SearchFormProps = {
  form: Form;
  layout?: 'grid' | 'inline';
  expand?: boolean | Expand;
} & /* @vue-ignore */ _FormProps &
  AllowedComponentProps;
</script>

<script lang="ts" setup>
import { Space, Button, FormProps } from '../../../shared/ui';
import { AllowedComponentProps, computed, ref, watch, watchEffect } from 'vue';
import ProForm, { Form } from '../../form';
import DownOutlined from './icons/DownOutlined.vue';

defineOptions({ name: 'SearchForm' });

const props = withDefaults(defineProps<SearchFormProps>(), {
  layout: 'grid',
  expand: true,
});

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
  if (!props.expand) return false;
  if (props.expand === true) return { minExpandRows: 2, expandStatus: false };
  return {
    minExpandRows: Math.max(Math.floor(props.expand.minExpandRows ?? 2), 1),
    expandStatus: props.expand.expandStatus ?? false,
  };
});

const showExpandToggle = ref(false);

const expandStatus = ref(true);

const changeExpandStatus = () => {
  expandStatus.value = !expandStatus.value;
};

const { formRef, getFormData } = props.form;

const setInitExpandStatus = () => {
  expandStatus.value = false;
  if (formRef.value && props.expand) {
    const formEl = formRef.value.$el;
    const formItemsEl = formEl.querySelectorAll('.ant-form-item>[path]');
    const observer = new IntersectionObserver(
      entries => {
        expandStatus.value = entries.some(e => {
          if (e.intersectionRatio === 0) {
            const path = e.target.getAttribute('path');
            const searchFieldValue = path ? getFormData?.(path) : undefined;
            return ![null, undefined].includes(searchFieldValue);
          }
          return (props.expand as any).expandStatus;
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
    () => props.form?.fields.value?.filter(f => !f.hidden)?.length,
    () => formRef.value,
  ],
  () => {
    if (!expandStatus.value || !formRef.value) return;
    const proFormEl = formRef.value?.$el;
    const { height = 0 } = proFormEl?.getBoundingClientRect?.() || {};
    proFormHeight.value = height;
    rowHeight = proFormEl
      ?.querySelector('.ant-form-item')
      ?.getBoundingClientRect?.()?.height;
  },
  { flush: 'post', immediate: true }
);

watchEffect(
  () => {
    if (typeof proFormHeight.value !== 'number') return;
    if (props.layout === 'grid' && computedExpand.value) {
      const { minExpandRows } = computedExpand.value;
      collapseHeight.value = Math.min(
        minExpandRows * rowHeight + (minExpandRows - 1) * rowGap,
        +proFormHeight.value
      );
      showExpandToggle.value = +proFormHeight.value > collapseHeight.value;
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
  props.layout === 'grid'
    ? {
        grid: {
          gutter: [columnGap, rowGap] as [number, number],
          style: { flex: 1, marginRight: '12px' },
        },
        style: {
          display: 'flex',
          overflow: 'hidden',
          height: `${expandStatus.value ? proFormHeight.value : collapseHeight.value}px`,
        },
      }
    : {
        layout: 'inline',
        style: { gap: `${rowGap}px ${columnGap}px` },
        grid: false,
      }
);
</script>

<template>
  <ProForm v-bind="layoutProps" :form="form" class="search-form transition">
    <Space align="start">
      <Button @click="emit('reset')">重置</Button>
      <Button type="primary" html-type="submit" @click="emit('search')">
        查询
      </Button>
      <Button
        v-if="showExpandToggle"
        type="link"
        class="expand-toggle-button"
        @click="changeExpandStatus"
      >
        {{ expandStatus ? '收起' : '展开' }}
        <DownOutlined
          class="transition"
          style="margin-left: 4px"
          :style="{ transform: `rotate(${expandStatus ? -180 : 0}deg)` }"
        />
      </Button>
    </Space>
  </ProForm>
</template>

<style scoped lang="less">
.search-form {
  :deep {
    .ant-form-item {
      margin: 0;
    }
  }
}

.expand-toggle-button {
  display: flex;
  align-items: center;
  padding: 0;
  padding-left: 4px;
}

.transition {
  transition: all 0.25s;
}
</style>
