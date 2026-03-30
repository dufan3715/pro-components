<script lang="ts" setup>
import { markRaw } from 'vue';
import { ElCard, ElSpace, ElButton } from 'element-plus';
import { ProForm, useForm } from '@qin-ui/element-plus-pro';
import CustomInput from './CustomInput.vue';

type FormData = {
  firstName: string;
  lastName: string;
};

const form = useForm<FormData>({}, [
  {
    label: '姓氏',
    path: 'firstName',
    component: markRaw(CustomInput),
    placeholder: '请输入姓氏',
  },
  {
    label: '名字',
    path: 'lastName',
    placeholder: '请输入名字',
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
  <ElCard header="自定义组件使用示例">
    <ProForm :form="form">
      <template #lastName="scoped">
        <CustomInput v-bind="scoped" />
      </template>
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
