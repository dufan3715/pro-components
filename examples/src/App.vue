<script lang="ts" setup>
import {
  ProForm,
  useForm,
  ProComponentProvider,
  type ComponentVars,
  type ProFormInstance,
  type Field,
  type Fields,
} from '@qin-ui/antd-vue-pro';
import { h, ref } from 'vue';

const proFormRef = ref<ProFormInstance | null>(null);

const CodeContainer: Field['componentContainer'] = (p, ctx) => {
  return h(
    'div',
    {
      style: { display: 'flex', alignItems: 'center' },
    },
    [
      ctx.slots.default?.(),
      h(
        'a',
        {
          style: { marginLeft: '10px', whiteSpace: 'nowrap' },
          onClick: () => {
            proFormRef.value?.validateFields('username');
          },
        },
        '发送验证码'
      ),
    ]
  );
};

const initFields: Fields = [
  {
    label: '用户名',
    key: 'username',
    component: 'input',
    rules: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  },
  {
    label: '密码',
    key: 'password',
    component: 'input',
    type: 'password',
    rules: [
      { required: true, message: '请输入密码' },
      { min: 4, message: '密码最小长度为5个字符' },
      { max: 18, message: '密码最大长度为18个字符' },
    ],
  },
  {
    label: '验证码',
    key: 'code',
    component: 'input-number',
    rules: [{ required: true, message: '请输入密码' }],
    componentContainer: CodeContainer,
  },
];

const form = useForm({}, initFields);

const componentVars: ComponentVars = {
  proFormField: {
    input: { maxlength: 50 },
    textarea: { maxlength: 1000 },
    'input-number': { max: 10 ** 12 - 1 },
  },
};

const submit = () => {
  proFormRef.value?.validate().then(() => {
    console.log(form.formData.value);
  });
};
</script>

<template>
  <div style="max-width: 500px; margin: 0 auto">
    <h1>hello world</h1>

    <ProComponentProvider :component-vars="componentVars">
      <ProForm ref="proFormRef" :form="form" />
    </ProComponentProvider>

    <button @click="submit">提交</button>

    <pre>{{ form.formData }}</pre>
  </div>
</template>

<style scoped lang="less"></style>
