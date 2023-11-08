<script lang="ts" setup>
import { Button } from 'ant-design-vue';
import { DownOutlined } from '@ant-design/icons-vue';
import { onMounted, ref } from 'vue';
import ProForm, { type ProFormInstance, type UseForm } from '../../form';

defineOptions({
  name: 'SearchForm',
  inheritAttrs: false,
});

const proFormRef = ref<ProFormInstance | null>();
const expandStatus = ref(true);

type Props = {
  form: ReturnType<UseForm>;
};

defineProps<Props>();

type Emits = {
  search: [];
  reset: [];
};
const emit = defineEmits<Emits>();

let initProFormHeight = 'unset';
const HEIGHT_THRESHOLD = 32;
const showExpandToggle = ref(false);

const expand = () => {
  expandStatus.value = !expandStatus.value;
};

onMounted(() => {
  const proFormEl = proFormRef.value?.$el;
  const { height = 0 } = proFormEl?.getBoundingClientRect?.() || {};
  initProFormHeight = height;
  showExpandToggle.value = height > HEIGHT_THRESHOLD;
  expandStatus.value = false;
});
</script>

<template>
  <div class="search">
    <ProForm
      ref="proFormRef"
      :form="form"
      :grid="{ gutter: [24, 16] }"
      :style="{
        overflow: 'hidden',
        height: `${expandStatus ? initProFormHeight : HEIGHT_THRESHOLD}px`,
      }"
      class="pro-form expand-transition"></ProForm>
    <div class="buttons">
      <Button @click="emit('reset')">重置</Button>
      <Button type="primary" @click="emit('search')">查询</Button>
      <Button
        v-if="showExpandToggle"
        style="padding-left: 8px"
        type="link"
        @click="expand">
        {{ expandStatus ? '收起' : '展开' }}
        <DownOutlined
          class="expand-transition"
          :style="{ transform: `rotate(${expandStatus ? -180 : 0}deg)` }" />
      </Button>
    </div>
  </div>
</template>

<style scoped lang="less">
.search {
  display: flex;
  gap: 24px;

  .pro-form {
    flex: 1;

    :deep {
      .ant-form-item {
        margin-bottom: 0;
      }
    }
  }

  .buttons {
    display: flex;
    gap: 8px;
  }

  .expand-transition {
    transition: all 0.25s;
  }
}
</style>
