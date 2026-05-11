<script setup lang="ts">
import { useForm, ProForm } from '@qin-ui/vant-pro';
import { Button, Space, Radio, Checkbox } from 'vant';
import { h } from 'vue';

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
    component: 'field',
    rules: [{ required: true, message: '请输入姓名' }],
  },
  {
    label: '年龄',
    path: 'age',
    component: 'stepper',
    rules: [{ required: true, message: '请输入年龄' }],
  },
  {
    label: '性别',
    path: 'gender',
    component: 'radio-group',
    direction: 'horizontal',
    slots: {
      default: () => [
        h(Radio, { name: 1 }, () => '男'),
        h(Radio, { name: 2 }, () => '女'),
      ],
    },
  },
  {
    label: '出生日期',
    path: 'birthday',
    component: 'date-picker',
    popup: true,
    placeholder: '请选择出生日期',
  },
  {
    label: '学历',
    path: 'education',
    component: 'picker',
    popup: true,
    placeholder: '请选择学历',
    columns: [
      { text: '高中', value: 'high_school' },
      { text: '大专', value: 'college' },
      { text: '本科', value: 'bachelor' },
      { text: '硕士', value: 'master' },
    ],
  },
  {
    label: '兴趣爱好',
    path: 'hobby',
    component: 'checkbox-group',
    shape: 'square',
    direction: 'horizontal',
    slots: {
      default: () => [
        h(Checkbox, { name: 'sing' }, () => '唱歌'),
        h(Checkbox, { name: 'dance' }, () => '跳舞'),
        h(Checkbox, { name: 'basketball' }, () => '打篮球'),
      ],
    },
  },
  { label: '家庭地址', path: 'address', component: 'field', type: 'textarea' },
]);

const { formRef, formData, formPopup, setFormData } = form;

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
    <!-- [!code highlight] -->
    <!-- 3. 向ProForm表单组件传入创建的表单对象 -->
    <ProForm :form="form">
      <div style="margin: 16px">
        <Space>
          <Button @click="reset">重置表单</Button>
          <Button type="primary" native-type="submit" @click="submit">
            提交
          </Button>
        </Space>
      </div>
    </ProForm>
    <br />
    <div style="padding: 16px; font-size: 14px; white-space: pre">
      表单数据对象：{{ formData }}
    </div>

    <pre>{{ formPopup }}</pre>
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
