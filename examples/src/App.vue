<!-- eslint-disable no-use-before-define -->
<script lang="ts" setup>
import {
  ProTable,
  useTable,
  ProForm,
  useForm,
  ProComponentProvider,
  type ComponentVars,
  type Field,
  type Fields,
} from '@qin-ui/antd-vue-pro/src';
import { Card, Button, Space } from 'ant-design-vue';
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

type Data = {
  username: string;
  age: number;
  password: string;
  code: number;
};

const getInitFields = (): Fields<Data> => [
  {
    label: '用户名',
    key: 'username',
    component: 'input',
    rules: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  },
  {
    label: '年龄',
    key: 'age',
    component: 'input-number',
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

const form = useForm<Data>({}, getInitFields());
const { formRef } = form;

const componentVars: ComponentVars = {
  input: { maxlength: 50, valueFormatter: val => val?.trim() },
  textarea: { maxlength: 1000, valueFormatter: val => val?.trim() },
  'input-number': { max: 10 ** 12 - 1 },
};

const table = useTable({
  searchFields: [
    { key: 'a', label: 'a', component: 'input' },
    { key: 'b', label: 'b', component: 'input' },
    { key: 'c', label: 'c', component: 'input' },
  ],
});

const submit = () => {
  formRef.value?.validate().then(() => {
    console.log(form.formData.value);
  });
};

const search = (param: any) => {
  console.log('param: ', param);
};
</script>

<template>
  <div>
    <h1>@qin-ui/antd-vue-pro</h1>

    <ProComponentProvider :component-vars="componentVars">
      <Space direction="vertical" :size="24">
        <div>{{ componentVars }}</div>

        <Space>
          <Card title="ProForm">
            <ProForm ref="formRef" :form="form">
              <Button type="primary" html-type="submit" @click="submit">
                提交
              </Button>
            </ProForm>
          </Card>
          <pre>{{ form.formData }}</pre>
        </Space>

        <Space>
          <Card title="ProTable">
            <ProTable :table="table" @change="search" @search="search" />
          </Card>
          <pre>{{ table.searchParam }}</pre>
        </Space>
      </Space>
    </ProComponentProvider>
  </div>
</template>

<style lang="less">
html {
  width: 100%;
  height: 100%;
  background-color: #f6f7f8;
}
</style>
