<script lang="ts" setup>
import { ElCard } from 'element-plus';
import {
  ProComponentProvider,
  ProForm,
  useForm,
} from '@qin-ui/element-plus-pro';
import CustomInput from '../custom-component/CustomInput.vue';
import TextDisplay from './TextDisplay.vue';

declare module '@qin-ui/element-plus-pro' {
  interface ComponentMap {
    text: typeof TextDisplay;
    input: typeof CustomInput;
  }
}

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
      label: '文本（拓展组件 text）',
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
    <ElCard header="高级：拓展、覆盖组件">
      <ProForm :form="form" />
    </ElCard>
  </ProComponentProvider>
</template>
