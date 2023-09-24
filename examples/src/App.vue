<script lang="ts" setup>
import {
  ProForm,
  useForm,
  ProComponentProvider,
  type ComponentVars,
} from '@qin-ui/naive-ui-pro/es';

const form = useForm({}, [
  { label: '用户名', key: 'username', component: 'input' },
  { label: '密码', key: 'password', component: 'input', type: 'password' },
  { label: '验证码', key: 'code', component: 'input-number' },
]);

const componentVars: ComponentVars = {
  proFormField: {
    input: { maxlength: 100 },
    'input.textarea': { maxlength: 1000 },
    'input-number': { max: 9 },
  },
};
</script>

<template>
  <h1>hello world</h1>

  <ProComponentProvider :component-vars="componentVars">
    <ProForm :form="form" />
  </ProComponentProvider>

  <pre>{{ form.formData }}</pre>
</template>

<style scoped lang="less"></style>
