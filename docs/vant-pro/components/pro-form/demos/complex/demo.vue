<script lang="ts" setup>
import { computed, h, markRaw, watch } from 'vue';
import { Space, Button, CellGroup, Divider, Radio } from 'vant';
import { Field, Fields, ProForm, useForm } from '@qin-ui/vant-pro';

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

const getEducationFields = (index: number): Fields<Education> => [
  {
    path: `educations.${index}.no`,
    component: () => h(Divider, () => `经历${index + 1}`),
  },
  {
    path: `educations.${index}.school`,
    component: 'field',
    label: '学校名称',
    placeholder: '请输入学校名称',
    rules: [{ required: true, message: '请输入学校名称' }],
  },
  {
    path: `educations.${index}.stage`,
    component: 'picker',
    label: '教育阶段',
    placeholder: '请选择教育阶段',
    popup: true,
    columns: computed(() => {
      return [
        { text: '初中', value: 'middle' },
        { text: '高中', value: 'high' },
        { text: '大学', value: 'university' },
      ].map(item => ({
        ...item,
        disabled: getFormData('educations')?.some(
          education => education.stage?.[0] === item.value
        ),
      }));
    }),
    rules: [{ required: true, message: '请选择教育阶段' }],
  },
  {
    path: `educations.${index}.discipline`,
    component: 'field',
    label: '专业',
    placeholder: '请输入专业',
    rules: [{ required: true, message: '请输入专业' }],
    // [!code highlight]
    // 表单字段、数据逻辑关联
    hidden: computed(() =>
      ['middle', 'high'].includes(getFormData(`educations.${index}.stage`)?.[0])
    ),
  },
  {
    componentContainer: (_, ctx) =>
      h('div', { style: 'padding: 8px 16px;' }, ctx.slots),
    type: 'danger',
    onClick: () => deleteEducation(index),
    component: props =>
      getFormData('educations')?.length > 1
        ? h(
            Button,
            { ...props, block: true, plain: true, size: 'small' },
            () => '删除'
          )
        : undefined,
  },
];

// [!code highlight]
// 嵌套字段多模块表单
const form = useForm<FormData>({}, [
  {
    fieldContainer: (_, ctx) =>
      h(CellGroup, { title: '个人信息', inset: true }, ctx.slots),
    fields: [
      {
        path: 'name',
        label: '姓名',
        component: 'field',
        placeholder: '请输入姓名',
        rules: [{ required: true, message: '请输入姓名' }],
      },
      {
        path: 'gender',
        label: '性别',
        component: 'radio-group',
        direction: 'horizontal',
        slots: {
          default: () => [
            h(Radio, { name: 'male' }, () => '男'),
            h(Radio, { name: 'female' }, () => '女'),
          ],
        },
        rules: [{ required: true, message: '请选择性别' }],
      },
      {
        path: 'birthday',
        label: '出生日期',
        component: 'date-picker',
        isLink: true,
        popup: true,
        rules: [{ required: true, message: '请选择出生日期' }],
        onChange: val => {
          setFormData(
            'age',
            val &&
              new Date().getFullYear() - new Date(val.valueOf()).getFullYear()
          );
        },
      },
      {
        path: 'age',
        label: '年龄',
        component: 'stepper',
        rules: [{ required: true, message: '请输入年龄' }],
      },
      {
        path: 'phone',
        label: '手机号码',
        component: 'field',
        type: 'tel',
        placeholder: '请输入手机号码',
        rules: [{ required: true, message: '请输入' }],
      },
      {
        path: 'email',
        label: '邮箱',
        component: 'field',
        type: 'email',
        placeholder: '请输入邮箱',
        rules: [{ required: true, message: '请输入' }],
      },
    ],
  },
  {
    path: 'family',
    fieldContainer: (_, ctx) =>
      h(CellGroup, { title: '家庭信息', inset: true }, ctx.slots),
    fields: [
      {
        path: 'family.city',
        label: '所在城市',
        component: 'picker',
        isLink: true,
        popup: true,
        columns: [{ text: '北京', value: 'Beijing' }],
      },
      {
        path: 'family.address',
        label: '家庭地址',
        component: 'field',
        type: 'textarea',
      },
      {
        path: 'family.maritalStatus',
        label: '婚姻状况',
        component: 'radio-group',
        direction: 'horizontal',
        slots: {
          default: () => [
            h(Radio, { name: 'married' }, () => '已婚'),
            h(Radio, { name: 'unmarried' }, () => '未婚'),
          ],
        },
      },
      { path: 'family.spouseName', label: '配偶姓名', component: 'field' },
      {
        path: 'family.spousePhone',
        label: '配偶联系方式',
        component: 'field',
        type: 'tel',
      },
    ],
  },
  {
    path: 'educations',
    fieldContainer: (_, ctx) =>
      h(CellGroup, { title: '教育信息', inset: true }, ctx.slots),
    fields: [],
  },
]);

const { formRef, formData, getFormData, setFormData, setField } = form;

const getAddEducationButtonField = (): Field => ({
  hidden: getFormData('educations')?.length >= 3,
  type: 'primary',
  block: true,
  plain: true,
  onClick: addEducation,
  componentContainer: (_, ctx) =>
    h('div', { style: 'padding: 16px;' }, ctx.slots),
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
    const values: Education[] = val?.length > 0 ? val : [{} as any];
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
        <Space direction="vertical" fill>
          <Button type="primary" native-type="submit" block @click="submit">
            提交
          </Button>
          <Button block @click="reset">重置表单</Button>
        </Space>
      </div>
    </ProForm>
    <br />
    <div
      style="padding: 16px; overflow-x: auto; font-size: 14px; white-space: pre"
    >
      表单数据对象：{{ formData }}
    </div>
  </div>
</template>

<style scoped>
.demo-wrapper {
  max-width: 430px;
  padding-top: 16px;
  overflow: hidden;
  background: #f7f8fa;
  border-radius: 8px;
}
</style>
