<script lang="ts" setup>
import {
  Card,
  Space,
  Button,
  TypographyText,
  Switch,
  Radio,
} from 'ant-design-vue';
import { Field, Fields, ProForm, useForm } from '@qin-ui/antd-vue-pro';
import { computed, h, markRaw, ref, toValue, watch } from 'vue';
import { Flex } from 'ant-design-vue';

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
  family: Family;
  educations: Education[];
};

const getEducationFields = (index): Fields<Education> => [
  {
    path: `educations.${index}.no`,
    component: () =>
      h(TypographyText, { strong: true }, () => `经历${index + 1}`),
    span: 2,
  },
  {
    path: `educations.${index}.school`,
    component: 'input',
    placeholder: '请输入学校名称',
    rules: [{ required: true, message: '请输入学校名称' }],
    span: 5,
  },
  {
    path: `educations.${index}.stage`,
    component: 'select',
    placeholder: '请选择教育阶段',
    options: computed(() => {
      return [
        { label: '初中', value: 'middle' },
        { label: '高中', value: 'high' },
        { label: '大学', value: 'university' },
      ].map(item => ({
        ...item,
        disabled: getFormData('educations')?.some(
          education => education.stage === item.value
        ),
      }));
    }),
    rules: [{ required: true, message: '请选择教育阶段' }],
    span: 4,
  },
  {
    path: `educations.${index}.discipline`,
    component: 'input',
    placeholder: '请输入专业',
    rules: [{ required: true, message: '请输入专业' }],
    span: 5,
    // [!code highlight]
    // 表单字段、数据逻辑关联
    hidden: computed(() =>
      ['middle', 'high'].includes(getFormData(`educations.${index}.stage`))
    ),
  },
  {
    path: `educations.${index}.dateRange`,
    component: 'range-picker',
    placeholder: ['入学时间', '毕业时间'],
    span: 6,
  },
  {
    span: computed(() => {
      const disciplineField = getField(`educations.${index}.discipline`);
      return toValue(disciplineField?.hidden) ? 7 : 2;
    }),
    componentContainer: (_, ctx) => h(Flex, { justify: 'flex-end' }, ctx.slots),
    type: 'text',
    danger: true,
    onClick: () => deleteEducation(index),
    component: props =>
      getFormData('educations')?.length > 1
        ? h(Button, props, () => '删除')
        : undefined,
  },
];

// [!code highlight]
// 嵌套字段多模块表单
const form = useForm<FormData>({}, [
  {
    container: (_, ctx) => h(Card, { title: '个人信息' }, ctx.slots),
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
        slots: { extra: '选择出生日期时自动填入年龄' },
        disabledDate: current => {
          return current.isAfter(new Date());
        },
        onChange: val => {
          setFormData(
            'age',
            new Date().getFullYear() - new Date(val).getFullYear()
          );
        },
      },
      {
        path: 'age',
        label: '年龄',
        component: 'input-number',
        rules: [{ required: true, message: '请输入年龄' }],
        slots: { addonAfter: '岁' },
      },
      {
        path: 'phone',
        label: '手机号码',
        component: 'input',
        rules: [{ required: true, message: '请输入' }],
      },
      {
        path: 'email',
        label: '邮箱',
        component: 'input',
        rules: [{ required: true, message: '请输入' }],
      },
    ],
  },
  {
    path: 'family',
    container: (_, ctx) =>
      h(Card, { title: '家庭信息', style: { margin: '24px 0' } }, ctx.slots),
    fields: [
      { path: 'family.city', label: '所在城市', component: 'cascader' },
      { path: 'family.address', label: '家庭地址', component: 'textarea' },
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
    ],
  },
  {
    path: 'educations',
    grid: { gutter: 4 },
    container: (_, ctx) => h(Card, { title: '教育信息' }, ctx.slots),
    fields: [],
  },
]);

const { formRef, formData, getFormData, setFormData, setField, getField } =
  form;

const getAddEducationButtonField = (): Field => ({
  span: 24,
  hidden: getFormData('educations')?.length >= 3,
  noStyle: true,
  type: 'primary',
  block: true,
  ghost: true,
  onClick: addEducation,
  component: markRaw(Button),
  slots: {
    default: '添加教育经历',
  },
});

// [!code highlight]
// 表单字段、数据动态增删
watch(
  () => getFormData('educations'),
  val => {
    const values: Education[] = val?.length > 0 ? val : [{}];
    const educationFields = values
      .reduce((preVal, curVal, i) => {
        return [...preVal, ...getEducationFields(i)];
      }, [] as Fields)
      .concat(getAddEducationButtonField());
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
const layout = ref('horizontal');

const reset = () => {
  formRef.value?.resetFields();
};

const submit = async () => {
  await formRef.value?.validateFields();
  console.log('表单提交数据:', { ...formData });
};
</script>

<template>
  <Card title="复杂表单" :body-style="{ background: '#f7f8f9' }">
    <Space direction="vertical" :size="24" style="margin-bottom: 24px">
      <div>
        <TypographyText strong>ant-design-vue 表单布局：</TypographyText>
        <Radio.Group v-model:value="layout">
          <Radio value="horizontal">水平</Radio>
          <Radio value="vertical">垂直</Radio>
        </Radio.Group>
      </div>
      <div>
        <TypographyText strong>启用 grid 网格布局：</TypographyText>
        <Switch v-model:checked="grid" />
      </div>
    </Space>
    <ProForm :form="form" :grid="grid" :layout="layout">
      <Space>
        <Button @click="reset">重置表单</Button>
        <Button type="primary" html-type="submit" @click="submit">提交</Button>
      </Space>
    </ProForm>
    <br />
    <div style="white-space: pre">表单数据对象：{{ formData }}</div>
  </Card>
</template>
