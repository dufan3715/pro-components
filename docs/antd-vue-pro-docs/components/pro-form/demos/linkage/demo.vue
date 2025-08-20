<script lang="ts" setup>
import { Card, Space, Button } from 'ant-design-vue';
import { ProForm, useForm } from '@qin-ui/antd-vue-pro';
import { computed, ref, watch } from 'vue';

type FormData = {
  maritalStatus: string;
  spouseName: string;
  spouseAge: number;
  spousePhone: string;
};

const spouseAgeHidden = ref(true);

const form = useForm<FormData>({}, [
  {
    path: 'maritalStatus',
    label: '婚姻状况',
    component: 'radio-group',
    options: [
      { label: '已婚', value: 'married' },
      { label: '未婚', value: 'unmarried' },
    ],
    onChange: () => {
      setFormData(({ maritalStatus }) => ({ maritalStatus }));
      spouseAgeHidden.value = formData.maritalStatus !== 'married';
    },
  },
  {
    path: 'spouseName',
    label: '配偶姓名',
    component: 'input',
    // [!code highlight]
    // 方式1. 使用 vue computed 进行依赖关联
    hidden: computed(() => formData.maritalStatus !== 'married'),
  },
  {
    path: 'spouseAge',
    label: '配偶年龄',
    component: 'input-number',
    // [!code highlight]
    // 方式2. 使用 vue ref 进行依赖关联
    hidden: spouseAgeHidden,
  },
  { path: 'spousePhone', label: '配偶联系方式', component: 'input' },
]);

const { formRef, formData, setFormData, setField } = form;

watch(
  () => formData.maritalStatus,
  val => {
    // [!code highlight]
    // 方式3. 使用 vue watch 动态调整字段配置
    setField('spousePhone', { hidden: val !== 'married' });
  },
  { immediate: true }
);

const reset = () => {
  formRef.value?.resetFields();
};

const submit = async () => {
  await formRef.value?.validateFields();
  console.log('表单提交数据:', { ...formData });
};
</script>

<template>
  <Card title="联动逻辑处理">
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
