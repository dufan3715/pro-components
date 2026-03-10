<script lang="ts" setup>
import {
  Card,
  Space,
  Button,
  Switch,
  RadioGroup,
  RadioButton,
  Flex,
  Rate,
} from 'antdv-next';
import {
  Fields,
  ProForm,
  ProComponentProvider,
  useForm,
} from '@qin-ui/antdv-next-pro';
import { computed, h, ref, watch } from 'vue';
import { useData } from 'vitepress';

declare module '@qin-ui/antdv-next-pro' {
  interface ComponentMap {
    'custom-rate': typeof Rate;
  }
}

const componentMap = {
  'custom-rate': Rate,
};

const { isDark } = useData();

type User = {
  name: string;
  gender: string;
  birthday: string;
  age: number;
  phone: string;
  email: string;
};

type Family = {
  city: string;
  address: string;
  maritalStatus: string;
  spouseName: string;
  spousePhone: string;
};

type Education = {
  school: string;
  stage: string;
  discipline: string;
  dateRange: [string, string];
};

type FormData = User & {
  rating?: number;
  family: Family;
  educations: Education[];
};

const getEducationFields = (index: number): Fields => [
  {
    path: `educations.${index}.school`,
    label: '学校名称',
    component: 'input',
    placeholder: '请输入学校名称',
    rules: [{ required: true, message: '请输入学校名称' }],
    span: 6,
  },
  {
    path: `educations.${index}.stage`,
    label: '教育阶段',
    component: 'select',
    placeholder: '请选择',
    options: computed(() => [
      { label: '初中', value: 'middle' },
      { label: '高中', value: 'high' },
      { label: '大学', value: 'university' },
    ]),
    rules: [{ required: true, message: '请选择教育阶段' }],
    span: 5,
  },
  {
    path: `educations.${index}.discipline`,
    label: '专业',
    component: 'input',
    placeholder: '请输入专业',
    // [!code highlight]
    // 表单字段、数据逻辑关联
    hidden: computed(() =>
      ['middle', 'high'].includes(getFormData(`educations.${index}.stage`))
    ),
    span: 5,
  },
  {
    path: `educations.${index}.dateRange`,
    label: '在校时间',
    component: 'range-picker',
    placeholder: ['入学时间', '毕业时间'],
    span: 6,
  },
  {
    span: 2,
    componentContainer: (_, ctx) =>
      h(
        Flex,
        {
          justify: 'flex-end',
          align: 'center',
          formItemStyle: { height: '100%', paddingTop: '30px' },
        },
        ctx.slots
      ),
    component: props =>
      getFormData('educations')?.length > 1
        ? h(
            Button,
            {
              ...props,
              type: 'link',
              danger: true,
              onClick: () => deleteEducation(index),
            },
            () => '删除'
          )
        : undefined,
  },
];

// [!code highlight]
// 嵌套字段多模块表单
const form = useForm<FormData>({}, [
  {
    formItemContainer: (_, ctx) => h(Card, { title: '个人信息' }, ctx.slots),
    fields: [
      {
        path: 'name',
        label: '姓名',
        component: 'input',
        rules: [{ required: true, message: '请输入姓名' }],
      },
      {
        path: 'gender',
        label: '性别',
        component: 'radio-group',
        options: [
          { label: '男', value: 'male' },
          { label: '女', value: 'female' },
        ],
        rules: [{ required: true, message: '请选择性别' }],
      },
      {
        path: 'birthday',
        label: '出生日期',
        component: 'date-picker',
        rules: [{ required: true, message: '请选择出生日期' }],
      },
      {
        path: 'age',
        label: '年龄',
        component: 'input-number',
        rules: [{ required: true, message: '请输入年龄' }],
      },
      { path: 'phone', label: '手机号码', component: 'input' },
      { path: 'email', label: '邮箱', component: 'input' },
      {
        path: 'rating',
        label: '满意度',
        component: 'custom-rate',
      },
    ],
  },
  {
    path: 'family',
    formItemContainer: (_, ctx) =>
      h(
        Card,
        { title: '家庭信息', formItemStyle: { margin: '24px 0' } },
        ctx.slots
      ),
    fields: [
      {
        path: 'family.maritalStatus',
        label: '婚姻状况',
        component: 'radio-group',
        options: [
          { label: '已婚', value: 'married' },
          { label: '未婚', value: 'unmarried' },
        ],
      },
      { path: 'family.spouseName', label: '配偶姓名', component: 'input' },
      { path: 'family.spousePhone', label: '配偶联系方式', component: 'input' },
      { path: 'family.address', label: '家庭地址', component: 'textarea' },
    ],
  },
  {
    path: 'educations',
    grid: { gutter: 4 },
    formItemContainer: (_, ctx) => h(Card, { title: '教育信息' }, ctx.slots),
    fields: [],
  },
]);

const { formRef, formData, getFormData, setFormData, setField } = form;

// [!code highlight]
// 表单字段、数据动态增删
watch(
  () => getFormData('educations'),
  val => {
    const values = val?.length > 0 ? val : [{} as any];
    const educationFields: Fields = values.reduce((preVal, _, i) => {
      return [...preVal, ...getEducationFields(i)];
    }, [] as any[]);
    educationFields.push({
      span: 24,
      hidden: getFormData('educations')?.length >= 3,
      component: props =>
        h(
          Button,
          {
            ...props,
            type: 'primary',
            block: true,
            ghost: true,
            onClick: addEducation,
          },
          () => '添加教育经历'
        ),
    });
    setField('educations', { fields: educationFields });
  },
  { immediate: true }
);

function addEducation() {
  setFormData('educations', (preVal = [{}]) => [...preVal, {}]);
}

function deleteEducation(index: number) {
  setFormData('educations', (preVal = []) =>
    preVal.filter((_, i) => i !== index)
  );
}

// [!code highlight]
// 动态调整表单 grid 布局
const grid = ref(false);
// [!code highlight]
// 动态调整表单 layout 布局
const layout = ref<'horizontal' | 'vertical'>('horizontal');

const reset = () => {
  formRef.value?.resetFields();
};

const submit = async () => {
  await formRef.value?.validate();
  console.log('表单提交数据:', { ...formData });
};
</script>

<template>
  <ProComponentProvider :component-map="componentMap">
    <Card
      title="复杂表单"
      :body-style="{ background: isDark ? '#141414' : '#f7f8f9' }"
    >
      <Space direction="vertical" :size="24" style="margin-bottom: 24px">
        <div>
          <span style="margin-right: 8px; font-weight: 600">表单布局：</span>
          <RadioGroup v-model:value="layout">
            <RadioButton value="horizontal">水平</RadioButton>
            <RadioButton value="vertical">垂直</RadioButton>
          </RadioGroup>
        </div>
        <div>
          <span style="margin-right: 8px; font-weight: 600"
            >启用 grid 网格布局：</span
          >
          <Switch v-model:value="grid" />
        </div>
      </Space>
      <ProForm :form="form" :grid="grid" :layout="layout">
        <Space>
          <Button @click="reset">重置表单</Button>
          <Button type="primary" html-type="submit" @click="submit"
            >提交</Button
          >
        </Space>
      </ProForm>
      <br />
      <div style="white-space: pre">表单数据对象：{{ formData }}</div>
    </Card>
  </ProComponentProvider>
</template>
