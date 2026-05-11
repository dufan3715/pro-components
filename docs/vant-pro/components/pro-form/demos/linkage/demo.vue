<script lang="ts" setup>
import { computed, h, ref, watch } from 'vue';
import { Button, Radio, Space } from 'vant';
import { ProForm, useForm } from '@qin-ui/vant-pro';

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
    direction: 'horizontal',
    slots: {
      default: () => [
        h(Radio, { name: 'married' }, () => '已婚'),
        h(Radio, { name: 'unmarried' }, () => '未婚'),
      ],
    },
    onChange: () => {
      setFormData(({ maritalStatus }) => ({ maritalStatus }));
      spouseAgeHidden.value = formData.maritalStatus !== 'married';
    },
  },
  {
    path: 'spouseName',
    label: '配偶姓名',
    component: 'field',
    // [!code highlight]
    // 方式1. 使用 vue computed 进行依赖关联
    hidden: computed((): boolean => formData.maritalStatus !== 'married'),
  },
  {
    path: 'spouseAge',
    label: '配偶年龄',
    component: 'stepper',
    // [!code highlight]
    // 方式2. 使用 vue ref 进行依赖关联
    hidden: spouseAgeHidden,
  },
  {
    path: 'spousePhone',
    label: '配偶联系方式',
    component: 'field',
    type: 'tel',
  },
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
  formRef.value?.resetValidation();
  setFormData({});
};

const submit = async () => {
  await formRef.value?.validate();
  console.log('表单提交数据:', { ...formData });
};
</script>

<template>
  <div class="demo-wrapper">
    <ProForm :form="form">
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
