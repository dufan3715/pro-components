<script lang="ts" setup>
import { ElCard, ElSpace, ElButton } from 'element-plus';
import { ProForm, useForm } from '@qin-ui/element-plus-pro';

type FormData = {
  name: string;
  age: number;
  birthday: string;
  address: string;
  enabled: boolean;
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
    label: '生日',
    path: 'birthday',
    component: 'date-picker',
  },
  {
    label: '启用状态',
    path: 'enabled',
    component: 'switch',
  },
  {
    label: '家庭地址',
    path: 'address',
    component: 'input',
    type: 'textarea',
    rows: 3,
  },
]);

const { formRef, formData } = form;

const reset = () => {
  formRef.value?.resetFields();
};

const submit = async () => {
  await formRef.value?.validate();
  console.log('表单提交数据:', { ...formData });
};
</script>

<template>
  <ElCard header="基础表单">
    <ProForm :form="form">
      <ElSpace>
        <ElButton @click="reset">重置表单</ElButton>
        <ElButton type="primary" native-type="submit" @click="submit">
          提交
        </ElButton>
      </ElSpace>
    </ProForm>
    <br />
    <div style="white-space: pre">表单数据对象：{{ formData }}</div>
  </ElCard>
</template>
