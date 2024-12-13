<!-- eslint-disable no-use-before-define -->
<script lang="ts" setup>
import {
  ProForm,
  useForm,
  ProComponentProvider,
  type ComponentVars,
  type Field,
  type Fields,
} from '@qin-ui/antd-vue-pro';
import { h } from 'vue';

const CodeContainer: Field['componentContainer'] = (p, ctx) => {
  return h(
    'div',
    {
      style: { display: 'flex', alignItems: 'center' },
    },
    [
      ctx.slots.default?.() as any,
      h(
        'a',
        {
          style: { marginLeft: '10px', whiteSpace: 'nowrap' },
          onClick: () => {
            proFormRef.value?.validateFields('username');
          },
        },
        '发送验证码'
      ),
    ]
  );
};

const initFields: Fields = [
  {
    label: '登记所在地（省/市/县、区）',
    key: '登记所在地（省/市/县、区）',
    component: 'cascader',
    slots: {},
    options: [],
  },
  {
    label: '用户名',
    key: 'username',
    component: 'input',
    rules: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  },
  {
    label: '密码',
    key: 'password',
    component: 'input',
    type: 'password',
    rules: [
      { required: true, message: '请输入密码' },
      { min: 4, message: '密码最小长度为5个字符' },
      { max: 18, message: '密码最大长度为18个字符' },
    ],
    valueFormatter: val => val?.trim(),
  },
  {
    label: '验证码',
    key: 'code',
    component: 'input-number',
    rules: [{ required: true, message: '请输入密码' }],
    componentContainer: CodeContainer,
  },
];

const form = useForm({}, initFields);
const { formRef: proFormRef } = form;

const componentVars: ComponentVars = {
  input: { maxlength: 50, valueFormatter: val => val?.trim() },
  textarea: { maxlength: 1000, valueFormatter: val => val?.trim() },
  'input-number': { max: 10 ** 12 - 1 },
};

const submit = () => {
  proFormRef.value?.validate().then(() => {
    console.log(form.formData.value);
  });
};

const test = () => {
  console.log('proFormRef.value: ', proFormRef.value);
  console.log('form: ', form);
};
</script>

<template>
  <div style="max-width: 500px; margin: 0 auto">
    <h1>hello world</h1>

    <ProComponentProvider :component-vars="componentVars">
      <ProForm ref="proFormRef" :form="form" />
    </ProComponentProvider>

    <button @click="submit">提交</button>
    <button @click="test">测试</button>

    <pre>{{ form.formData }}</pre>
  </div>
</template>

<style scoped lang="less"></style>
