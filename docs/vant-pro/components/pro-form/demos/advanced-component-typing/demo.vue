<script lang="ts" setup>
import { ProComponentProvider, ProForm, useForm } from '@qin-ui/vant-pro';
import { TextEllipsis } from 'vant';
import CustomInput from '../custom-component/CustomInput.vue';

type FormData = {
  name: string;
  description: string;
};

const form = useForm<FormData>(
  {
    name: '',
    description:
      '很长很长很长很长很长很长很长很长很长很长很长很长很长很长的一段描述',
  },
  [
    {
      label: '自定义输入框（覆盖 field）',
      path: 'name',
      component: 'field',
    },
    {
      label: '自定义拓展组件',
      path: 'description',
      component: 'textEllipsis',
      modelProp: 'content',
    },
  ]
);

const componentMap = {
  field: CustomInput, // [!code highlight]
  textEllipsis: TextEllipsis, // [!code highlight]
};

const componentVars = {
  field: {
    // 全局默认
  },
};
</script>

<template>
  <ProComponentProvider
    :component-map="componentMap"
    :component-vars="componentVars"
  >
    <div class="demo-wrapper">
      <ProForm :form="form" label-width="fit-content" />
    </div>
  </ProComponentProvider>
</template>

<style scoped>
.demo-wrapper {
  max-width: 430px;
  padding: 16px;
  overflow: hidden;
  background: #f7f8fa;
  border-radius: 8px;
}
</style>
