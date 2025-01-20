<script lang="ts" setup>
import { Space, Button, FormProps } from 'ant-design-vue';
import { DownOutlined } from '@ant-design/icons-vue';
import { computed, onMounted, ref } from 'vue';
import { get } from 'lodash-es';
import ProForm, { type ProFormInstance, type UseForm } from '../../form';

defineOptions({
  name: 'SearchForm',
  inheritAttrs: false,
});

type Props = {
  form: ReturnType<UseForm>;
  layout?: 'grid' | 'inline';
  minExpandRows?: number;
  defaultExpandStatus?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
  layout: 'grid',
  minExpandRows: 1,
  defaultExpandStatus: false,
});

type Emits = {
  search: [];
  reset: [];
};
const emit = defineEmits<Emits>();

let proFormHeight = 'unset';
let collapseHeight = 0;
const rowGap = 16;
const columnGap = 24;

const showExpandToggle = ref(false);

const proFormRef = ref<ProFormInstance | null>();
const expandStatus = ref(true);

const expand = () => {
  expandStatus.value = !expandStatus.value;
};

const setInitExpandStatus = () => {
  expandStatus.value = false;
  if (proFormRef.value) {
    const formEl = proFormRef.value.$el;
    const formItemsEl = formEl.querySelectorAll('.ant-form-item>[path]');
    const observer = new IntersectionObserver(
      entries => {
        expandStatus.value = entries.some(e => {
          if (e.intersectionRatio === 0) {
            const path = e.target.getAttribute('path');
            const searchFieldValue = path
              ? get(props.form.formData.value, path)
              : undefined;
            return ![null, undefined].includes(searchFieldValue);
          }
          return props.defaultExpandStatus;
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

onMounted(() => {
  if (props.layout === 'grid') {
    const proFormEl = proFormRef.value?.$el;
    const { height = 0 } = proFormEl?.getBoundingClientRect?.() || {};
    proFormHeight = height;
    const rowHeight = proFormEl
      .querySelector('.ant-form-item')
      ?.getBoundingClientRect?.()?.height;
    collapseHeight =
      props.minExpandRows * rowHeight + (props.minExpandRows - 1) * rowGap;
    showExpandToggle.value = height > collapseHeight;
    if (showExpandToggle.value) {
      setInitExpandStatus();
    }
  }
});

const layoutProps = computed<FormProps>(() =>
  props.layout === 'grid'
    ? {
        grid: {
          gutter: [columnGap, rowGap],
          style: { flex: 1, marginRight: '12px' },
        },
        style: {
          display: 'flex',
          overflow: 'hidden',
          height: `${expandStatus.value ? proFormHeight : collapseHeight}px`,
        },
      }
    : {
        layout: 'inline',
        style: { gap: `${rowGap}px ${columnGap}px` },
      }
);
</script>

<template>
  <ProForm
    ref="proFormRef"
    :form="form"
    v-bind="layoutProps"
    class="pro-form expand-transition">
    <Space align="start">
      <Button @click="emit('reset')">重置</Button>
      <Button type="primary" html-type="submit" @click="emit('search')">
        查询
      </Button>
      <Button v-if="showExpandToggle" type="link" @click="expand">
        {{ expandStatus ? '收起' : '展开' }}
        <DownOutlined
          class="expand-transition"
          :style="{ transform: `rotate(${expandStatus ? -180 : 0}deg)` }" />
      </Button>
    </Space>
  </ProForm>
</template>

<style scoped lang="less">
.pro-form {
  :deep {
    .ant-form-item {
      margin: 0;
    }
  }
}

.expand-transition {
  transition: all 0.25s;
}
</style>
