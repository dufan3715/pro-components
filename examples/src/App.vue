<script lang="ts" setup>
import { ProForm, useForm } from '@sq/naive-ui-pro/es';

const form = useForm({}, [
  { label: '用户名', key: 'username', component: 'input' },
  { label: '密码', key: 'password', component: 'input', type: 'password' },
  { label: '验证码', key: 'code', component: 'input' },
]);
</script>

<template>
  <h1>hello world</h1>

  <ProForm :form="form" />

  <pre>{{ form.formData }}</pre>
</template>

<style scoped lang="less"></style>
