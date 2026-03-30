<script lang="ts" setup>
import { ElCard, ElSpace, ElButton } from 'element-plus';
import { ProForm, useForm } from '@qin-ui/element-plus-pro';
import { computed, ref, watch } from 'vue';

type FormData = {
  married: boolean;
  spouseName: string;
  spouseAge: number;
  spousePhone: string;
};

const spouseAgeHidden = ref(true);

const form = useForm<FormData>({ married: false }, [
  {
    path: 'married',
    label: '是否已婚',
    component: 'switch',
    onChange: () => {
      spouseAgeHidden.value = !formData.married;
    },
  },
  {
    path: 'spouseName',
    label: '配偶姓名',
    component: 'input',
    hidden: computed((): boolean => !formData.married),
  },
  {
    path: 'spouseAge',
    label: '配偶年龄',
    component: 'input-number',
    hidden: spouseAgeHidden,
  },
  {
    path: 'spousePhone',
    label: '配偶联系方式',
    component: 'input',
  },
]);

const { formRef, formData, setField } = form;

watch(
  () => formData.married,
  val => {
    setField('spousePhone', { hidden: !val });
  },
  { immediate: true }
);

const reset = () => {
  formRef.value?.resetFields();
};

const submit = async () => {
  await formRef.value?.validate();
  console.log('表单提交数据:', { ...formData });
};
</script>

<template>
  <ElCard header="联动逻辑处理">
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
