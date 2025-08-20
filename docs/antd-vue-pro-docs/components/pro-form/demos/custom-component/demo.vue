<script lang="ts" setup>
import { markRaw } from 'vue';
import { Card, Space, Button } from 'ant-design-vue';
import { ProForm, useForm } from '@qin-ui/antd-vue-pro';
import CustomInput from './CustomInput.vue';

type FormData = {
  firstName: string;
  lastName: string;
};

const form = useForm<FormData>({}, [
  {
    label: '姓氏',
    path: 'firstName',
    // [!code highlight]
    // 方式1：使用Field中 component 属性
    component: markRaw(CustomInput),
    componentStyle: { width: '400px', borderColor: 'green' },
    placeholder: '请输入姓氏',
  },
  {
    label: '名字',
    path: 'lastName',
    componentStyle: { width: '400px', borderColor: 'blue' },
    placeholder: '请输入名字',
  },
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
  <Card title="自定义组件使用示例">
    <ProForm :form="form">
      <!-- [!code highlight] -->
      <!-- 方式2 使用ProForm插槽 -->
      <template #lastName="scoped">
        <CustomInput v-bind="scoped" />
      </template>
      <Space>
        <Button @click="reset">重置表单</Button>
        <Button type="primary" html-type="submit" @click="submit">提交</Button>
      </Space>
    </ProForm>
    <br />
    <div style="white-space: pre">表单数据对象：{{ formData }}</div>
  </Card>
</template>
