<script lang="ts" setup>
import {
  ElCard,
  ElSpace,
  ElButton,
  ElSwitch,
  ElRadioGroup,
  ElRadioButton,
  ElText,
} from 'element-plus';
import {
  Field,
  Fields,
  ProForm,
  useForm,
  type ProFormProps,
} from '@qin-ui/element-plus-pro';
import { computed, h, ref, toValue, watch } from 'vue';
import { useData } from 'vitepress';

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
  family: Family;
  educations: Education[];
};

const getEducationFields = (index: number): Fields<Education> => [
  {
    path: `educations.${index}.no`,
    component: () =>
      h(ElText, { tag: 'b' }, () => {
        return `经历${index + 1}`;
      }),
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
    hidden: computed(() =>
      ['middle', 'high'].includes(getFormData(`educations.${index}.stage`))
    ),
    rules: [{ required: true, message: '请输入专业' }],
    span: 5,
  },
  {
    path: `educations.${index}.dateRange`,
    component: 'date-picker',
    type: 'daterange',
    startPlaceholder: '入学时间',
    endPlaceholder: '毕业时间',
    span: 6,
  },
  {
    span: computed(() => {
      const disciplineField = getField(`educations.${index}.discipline`);
      return toValue(disciplineField?.hidden) ? 7 : 2;
    }),
    componentContainer: (_, ctx) =>
      h(
        'div',
        {
          style: {
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            height: '100%',
          },
        },
        ctx.slots.default?.()
      ),
    component: props =>
      getFormData('educations')?.length > 1
        ? h(
            ElButton,
            {
              ...props,
              type: 'danger',
              plain: true,
              onClick: () => deleteEducation(index),
            },
            () => '删除'
          )
        : undefined,
  },
];

const getAddEducationButtonField = (): Field<FormData> => ({
  span: 24,
  hidden: getFormData('educations')?.length >= 3,
  component: props =>
    h(
      ElButton,
      {
        ...props,
        type: 'primary',
        plain: true,
        style: { width: '100%' },
        onClick: addEducation,
      },
      () => '添加教育经历'
    ),
});

const form = useForm<FormData>(
  {
    family: {
      city: '',
      maritalStatus: '',
      spouseName: '',
      spousePhone: '',
      address: '',
    },
    educations: [{} as any],
  },
  [
    {
      formItemContainer: (_, ctx) =>
        h(ElCard, { header: '个人信息' }, ctx.slots),
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
          disabledDate: (current: any) => {
            return current?.valueOf?.() > Date.now();
          },
          onChange: val => {
            if (!val) {
              setFormData('age', undefined as any);
              return;
            }
            const timestamp = (val as any).valueOf?.() ?? val;
            const age =
              new Date().getFullYear() - new Date(timestamp).getFullYear();
            setFormData('age', Number.isNaN(age) ? (undefined as any) : age);
          },
        },
        {
          path: 'age',
          label: '年龄',
          component: 'input-number',
          rules: [{ required: true, message: '请输入年龄' }],
        },
        { path: 'phone', label: '手机号码', component: 'input' },
        { path: 'email', label: '邮箱', component: 'input' },
      ],
    },
    {
      path: 'family',
      formItemContainer: (_, ctx) =>
        h(
          ElCard,
          { header: '家庭信息', style: { margin: '20px 0' } },
          ctx.slots
        ),
      fields: [
        {
          path: 'family.city',
          label: '所在城市',
          component: 'cascader',
        },
        {
          path: 'family.maritalStatus',
          label: '婚姻状况',
          component: 'radio-group',
          options: [
            { label: '已婚', value: 'married' },
            { label: '未婚', value: 'unmarried' },
          ],
        },
        {
          path: 'family.spouseName',
          label: '配偶姓名',
          component: 'input',
        },
        {
          path: 'family.spousePhone',
          label: '配偶电话',
          component: 'input',
        },
        {
          path: 'family.address',
          label: '家庭地址',
          component: 'input',
          type: 'textarea',
          rows: 3,
        },
      ],
    },
    {
      path: 'educations',
      grid: { gutter: 4 },
      formItemContainer: (_, ctx) =>
        h(ElCard, { header: '教育信息' }, ctx.slots),
      fields: [],
    },
  ]
);

const { formRef, formData, getFormData, setFormData, setField } = form;
const { getField } = form;

watch(
  () => getFormData('educations'),
  val => {
    const values: Education[] = val?.length > 0 ? val : [{} as any];
    const educationFields = values
      .reduce((pre, _, index) => {
        return [...pre, ...getEducationFields(index)];
      }, [] as Fields)
      .concat(getAddEducationButtonField());
    setField('educations', {
      fields: educationFields,
    });
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

const grid = ref(false);
const layout = ref<'horizontal' | 'vertical'>('horizontal');
const labelPosition = computed<NonNullable<ProFormProps['labelPosition']>>(
  () => {
    return layout.value === 'vertical' ? 'top' : 'right';
  }
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
  <ElCard
    header="复杂表单"
    :body-style="{ background: isDark ? '#141414' : '#f7f8f9' }"
  >
    <ElSpace direction="vertical" :size="20" style="margin-bottom: 20px">
      <div>
        <span style="margin-right: 8px; font-weight: 600"
          >element-plus 表单布局：</span
        >
        <ElRadioGroup v-model="layout">
          <ElRadioButton value="horizontal">水平</ElRadioButton>
          <ElRadioButton value="vertical">垂直</ElRadioButton>
        </ElRadioGroup>
      </div>
      <div>
        <span style="margin-right: 8px; font-weight: 600">启用 grid：</span>
        <ElSwitch v-model="grid" />
      </div>
    </ElSpace>

    <ProForm :form="form" :grid="grid" :label-position="labelPosition">
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
