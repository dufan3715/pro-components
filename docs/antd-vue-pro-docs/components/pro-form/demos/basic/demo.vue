<script lang="ts" setup>
import { Card, Space, Button } from 'ant-design-vue';
import { ProForm, useForm } from '@qin-ui/antd-vue-pro';

// [!code highlight]
// 1. 定义表单数据类型（可选，定义数据类型后创建表单对象会推断提示字段path）
type FormData = {
  name: string;
  age: number;
  gender: string;
  birthday: string;
  education: string;
  hobby: string[];
  address: string;
};

// [!code highlight]
// 2. 使用useForm hook创建表单对象
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

const { formRef, formData } = form;

const reset = () => {
  formRef.value?.resetFields();
};

const submit = async () => {
  await formRef.value?.validateFields();
  console.log('表单提交数据:', { ...formData });
};
</script>

<template>
  <Card title="基础表单">
    <!-- [!code highlight] -->
    <!-- 3. 向ProForm表单组件传入创建的表单对象 -->
    <ProForm :form="form">
      <Space>
        <Button @click="reset">重置表单</Button>
        <Button type="primary" html-type="submit" @click="submit">提交</Button>
      </Space>
    </ProForm>
    <br />
    <div style="white-space: pre">表单数据对象：{{ formData }}</div>
  </Card>
</template>
