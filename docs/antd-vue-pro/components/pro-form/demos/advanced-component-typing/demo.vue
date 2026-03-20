<script lang="ts" setup>
import { Card, TypographyText } from 'ant-design-vue';
import { ProComponentProvider, ProForm, useForm } from '@qin-ui/antd-vue-pro';
import CustomInput from '../custom-component/CustomInput.vue';

type FormData = {
  name: string;
  description: string;
};

const form = useForm<FormData>(
  { name: '', description: '很长很长的一段描述' },
  [
    {
      label: '输入框（覆盖 input）',
      path: 'name',
      component: 'input',
      extra: '这里会渲染 CustomInput',
    },
    {
      label: '文本（拓展自定义组件 text）',
      path: 'description',
      component: 'text', // [!code highlight]
      extra: '这里会渲染 TypographyText',
    },
  ]
);

const componentMap = {
  text: TypographyText, // [!code highlight]
  input: CustomInput, // [!code highlight]
};

const componentVars = {
  text: {
    modelProp: 'content', // 为 TypographyText 添加全局默认modelProp
  },
};
</script>

<template>
  <ProComponentProvider
    :component-map="componentMap"
    :component-vars="componentVars"
  >
    <Card title="高级：拓展、覆盖组件">
      <ProForm :form="form" />
    </Card>
  </ProComponentProvider>
</template>
