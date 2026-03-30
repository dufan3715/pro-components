<script lang="ts" setup>
import { Card } from 'antdv-next';
import { ProComponentProvider, ProForm, useForm } from '@qin-ui/antdv-next-pro';
import CustomInput from '../custom-component/CustomInput.vue';
import TextDisplay from './TextDisplay.vue';

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
      component: 'text',
      extra: '这里会渲染 TextDisplay',
    },
  ]
);

const componentMap = {
  text: TextDisplay,
  input: CustomInput,
};

const componentVars = {
  text: {
    modelProp: 'content',
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
