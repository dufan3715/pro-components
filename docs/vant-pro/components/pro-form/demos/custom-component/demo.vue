<script lang="ts" setup>
import { markRaw } from 'vue';
import { Space, Button } from 'vant';
import { ProForm, useForm } from '@qin-ui/vant-pro';
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
    componentStyle: {
      width: `100%`,
      color: 'green',
    },
    placeholder: '请输入姓氏',
  },
  {
    label: '名字',
    path: 'lastName',
    componentStyle: { width: `100%`, color: 'blue' },
    placeholder: '请输入名字',
  },
]);

const { formRef, formData } = form;

const reset = () => {
  formRef.value?.resetValidation();
  form.resetFormData();
};

const submit = async () => {
  await formRef.value?.validate();
  console.log('表单提交数据:', { ...formData });
};
</script>

<template>
  <div class="demo-wrapper">
    <ProForm :form="form">
      <!-- [!code highlight] -->
      <!-- 方式2 使用ProForm插槽 -->
      <template #lastName="scoped">
        <CustomInput v-bind="scoped" />
      </template>
      <div style="margin: 16px">
        <Space>
          <Button @click="reset">重置表单</Button>
          <Button type="primary" native-type="submit" @click="submit"
            >提交</Button
          >
        </Space>
      </div>
    </ProForm>
    <br />
    <div style="padding: 16px; font-size: 14px; white-space: pre">
      表单数据对象：{{ formData }}
    </div>
  </div>
</template>

<style scoped>
.demo-wrapper {
  max-width: 430px;
  padding: 16px;
  overflow: hidden;
  background: #f7f8fa;
  border-radius: 8px;
}
</style>
