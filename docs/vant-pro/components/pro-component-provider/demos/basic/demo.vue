<template>
  <ProComponentProvider :component-vars="config">
    <div class="demo-wrapper">
      <ProForm :form="form" />
    </div>
  </ProComponentProvider>
</template>

<script setup lang="ts">
import { ProComponentProvider, ProForm, useForm } from '@qin-ui/vant-pro';

const config = {
  'pro-form': {
    inputAlign: 'center', // 统一设置表单控件内容居中对齐
  },
  field: {
    clearable: true, // 统一让输入框带有清空按钮
  },
};

const form = useForm({}, [
  {
    component: 'picker',
    label: '选择城市',
    path: 'city',
    popup: true,
    columns: [
      { text: '北京', value: 'Beijing' },
      { text: '上海', value: 'Shanghai' },
    ],
  },
]);
</script>

<style scoped>
.demo-wrapper {
  max-width: 430px;
  padding: 16px;
  background: #f7f8fa;
  border-radius: 8px;
}
</style>
