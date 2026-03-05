<script lang="ts" setup>
import { Card } from 'ant-design-vue';
import {
  ProComponentProvider,
  type ComponentVars,
  ProForm,
  useForm,
  ProTable,
  useTable,
} from '@qin-ui/antd-vue-pro';

type FormData = {
  name: string;
  age: number;
  gender: string;
  birthday: string;
  education: string;
  hobby: string[];
  address: string;
};

const form = useForm<FormData>({}, [
  {
    label: '姓名',
    path: 'name',
    component: 'input',
    rules: [{ required: true, message: '请输入姓名' }],
  },
  {
    label: '年龄',
    path: 'age',
    component: 'input-number',
    precision: 0,
    rules: [{ required: true, message: '请输入年龄' }],
  },
  {
    label: '性别',
    path: 'gender',
    component: 'radio-group',
    options: [
      { label: '男', value: 1 },
      { label: '女', value: 2 },
    ],
  },
  { label: '出生日期', path: 'birthday', component: 'date-picker' },
  {
    label: '学历',
    path: 'education',
    component: 'select',
    options: [
      { label: '高中', value: 'high_school' },
      { label: '大专', value: 'college' },
      { label: '本科', value: 'bachelor' },
      { label: '硕士', value: 'master' },
    ],
  },
  {
    label: '兴趣爱好',
    path: 'hobby',
    component: 'checkbox-group',
    options: [
      { label: '唱歌', value: 'sing' },
      { label: '跳舞', value: 'dance' },
      { label: '打篮球', value: 'basketball' },
    ],
  },
  { label: '家庭地址', path: 'address', component: 'textarea' },
]);

const table = useTable<FormData>({
  searchFields: form.fields.value.map(item => ({
    ...item,
    rules: undefined,
    component: 'input' as any,
  })),
  columns: [
    { title: '姓名', dataIndex: 'name' },
    { title: '年龄', dataIndex: 'age' },
    { title: '性别', dataIndex: 'gender' },
    { title: '家庭住址', dataIndex: 'address' },
    { title: '兴趣爱好', dataIndex: 'hobby' },
    { title: '操作', dataIndex: 'action' },
  ],
});

const componentVars: ComponentVars = {
  'pro-form': {
    grid: { gutter: 40 },
    layout: 'vertical',
  },
  'pro-table': {
    control: { sizeControl: false },
    searchFormConfig: { layout: 'inline' },
  },
  input: { maxlength: 20 },
  'input-number': { min: 0, max: 10 ** 6 - 1 },
  textarea: { maxlength: 100 },
};
</script>

<template>
  <ProComponentProvider :component-vars="componentVars">
    <code style="white-space: pre">componentVars: {{ componentVars }}</code>
    <Card title="表单" style="margin-top: 24px">
      <ProForm :form="form" grid></ProForm>
    </Card>
    <Card title="表格" style="margin-top: 24px">
      <ProTable class="pro-table" :table="table"></ProTable>
    </Card>
  </ProComponentProvider>
</template>

<style scoped lang="less">
.vp-doc .pro-table {
  :deep {
    table {
      display: table;
      margin: 0;
      overflow-x: initial;

      tr {
        background-color: initial;
        border-top: initial;
        transition: initial;
      }

      th,
      td {
        border: initial;
      }
    }
  }
}
</style>
