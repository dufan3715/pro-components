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
} from '@qin-ui/antd-vue-pro';
// } from '../../packages/antd-vue-pro/src';
import { Card, Button, Space } from 'ant-design-vue';
import { h, ref, computed } from 'vue';

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
            formRef.value?.validateFields('username');
          },
        },
        '发送验证码'
      ),
    ]
  );
};
console.log('CodeContainer: ', CodeContainer);

type Data = {
  username: string;
  age: number;
  password: string;
  code: number;
  user: {
    name: string;
    age: number;
  };
};

const usernameHidden = ref(false);

const prefix = ref('prefix');

const getInitFields = (): Fields<Data> => [
  {
    label: '用户',
    key: 'user',
    fields: [
      {
        label: '姓名',
        key: computed(() => `name-${prefix.value}`),
        component: 'input',
      },
      {
        label: '年龄',
        key: 'age',
        component: 'input-number',
      },
    ],
  },
  // {
  //   label: '用户名',
  //   key: 'username',
  //   // component: 'input',
  //   component: computed(() => (formData.age === 18 ? 'input' : 'select')),
  //   rules: [
  //     {
  //       required: computed(() => formData.age === 18),
  //       message: '请输入用户名',
  //       trigger: 'blur',
  //     },
  //   ],
  //   componentClassName: 'abc',
  //   componentStyle: {
  //     width: '100%',
  //   },
  //   onFocus: () => {
  //     console.log('focus');
  //   },
  // disabled: computed(() => formData.age === 18),
  //   hidden: usernameHidden,
  // },
  {
    label: '年龄',
    key: 'age',
    component: 'input-number',
  },
  // {
  //   label: computed(() => '密码'),
  //   key: 'password',
  //   component: 'input',
  //   type: 'password',
  //   rules: [
  //     { required: true, message: '请输入密码' },
  //     { min: 4, message: '密码最小长度为5个字符' },
  //     { max: 18, message: '密码最大长度为18个字符' },
  //   ],
  //   valueFormatter: val => val?.trim(),
  // },
  // {
  //   label: '验证码',
  //   key: 'code',
  //   component: 'input-number',
  //   rules: [{ required: true, message: '请输入密码' }],
  //   componentContainer: CodeContainer,
  // },
];

const form = useForm<Data>(false);
console.log('form: ', form);
const { formRef, formData, fields, getField } = form;
console.log('formData: ', formData);
fields.value = getInitFields();

const componentVars: ComponentVars = {
  input: {
    maxlength: 50,
    valueFormatter: val => val?.trim(),
  },
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
    console.log(form.formData);
  });
};

const search = (param: any) => {
  console.log('param: ', param);
};
</script>

<template>
  <div>
    <h1>@qin-ui/antd-vue-pro</h1>

    <button @click="usernameHidden = !usernameHidden">提交</button>

    <input v-model="prefix" />

    <ProComponentProvider :component-vars="componentVars">
      <Space direction="vertical" :size="24">
        <div>{{ componentVars }}</div>
        <pre>{{ getField('username') }}</pre>

        <Space>
          <Card title="ProForm">
            <ProForm :form="form">
              <Button type="primary" html-type="submit" @click="submit">
                提交
              </Button>
            </ProForm>
          </Card>
          <pre>{{ form.formData }}</pre>
          <pre>{{ form.activePath }}</pre>
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
