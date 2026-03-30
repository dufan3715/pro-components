<script lang="ts" setup>
import {
  ElCard,
  ElSpace,
  ElButton,
  ElSwitch,
  ElRadioGroup,
  ElRadioButton,
} from 'element-plus';
import {
  ProTable,
  ProForm,
  useForm,
  useTable,
  type Field,
} from '@qin-ui/element-plus-pro';
import { computed, ref } from 'vue';
import { useData } from 'vitepress';

const { isDark } = useData();

type Row = {
  name: string;
  age: number;
  gender: string;
  birthday: string;
  address: string;
};

const table = useTable<Row>({
  searchFields: [
    { label: '姓名', path: 'name', component: 'input' },
    { label: '年龄', path: 'age', component: 'input-number' },
    { label: '性别', path: 'gender', component: 'input' },
    {
      label: '生日',
      path: 'birthday',
      component: 'date-picker',
      type: 'daterange',
    },
    { label: '筛选项a', path: 'a', component: 'input' },
    { label: '筛选项b', path: 'b', component: 'input' },
    { label: '筛选项c', path: 'c', component: 'input' },
    { label: '筛选项d', path: 'd', component: 'input' },
    { label: '地址', path: 'address', component: 'input' },
  ],
  columns: [
    { prop: 'name', label: '姓名', minWidth: 120 },
    { prop: 'age', label: '年龄', width: 100 },
    { prop: 'gender', label: '性别', width: 100 },
    { prop: 'birthday', label: '生日', minWidth: 140 },
    { prop: 'address', label: '家庭住址', minWidth: 160 },
  ],
});

const total = 888;
const mockListData = new Array(total).fill(null).map((_, index) => ({
  name: `张三${index}`,
  age: index,
  gender: index % 2 === 0 ? '男' : '女',
  birthday: '2023-01-01',
  address: '上海',
}));

const search = async () => {
  const { current, pageSize } = table.pageParam;
  return new Promise<void>(resolve => {
    setTimeout(() => {
      const list = mockListData.slice(
        (current - 1) * pageSize,
        current * pageSize
      );
      table.data.value = list;
      table.setPageParam({ total });
      resolve();
    }, 400);
  });
};

const key = ref(1);

const configForm = useForm<any, Field<any>>(
  {
    addIndexColumn: true,
    immediateSearch: false,
    control: { sizeControl: true, columnControl: true },
    searchFormConfig: {
      hidden: false,
      layout: 'grid',
      expand: { minExpandRows: 2, expandStatus: false },
    },
  },
  [
    {
      label: '首列添加索引（addIndexColumn）',
      component: 'switch',
      path: 'addIndexColumn',
    },
    {
      label: '立即执行一次 search（immediateSearch）',
      component: 'switch',
      path: 'immediateSearch',
      onChange: () => {
        table.data.value = [];
        key.value += 1;
      },
    },
    {
      label: '展示控制栏（control）',
      path: 'control',
      component: 'switch',
    },
    {
      label: '显示尺寸控制（control.sizeControl）',
      path: 'control.sizeControl',
      component: 'switch',
    },
    {
      label: '显示列控制（control.columnControl）',
      path: 'control.columnControl',
      component: 'switch',
    },
    {
      label: '隐藏搜索表单（searchFormConfig.hidden）',
      component: 'switch',
      path: 'searchFormConfig.hidden',
    },
    {
      label: '搜索表单布局（searchFormConfig.layout）',
      component: 'radio-group',
      path: 'searchFormConfig.layout',
      options: [
        { label: 'grid', value: 'grid' },
        { label: 'inline', value: 'inline' },
      ],
      onChange: () => {
        if (getFormData('searchFormConfig.layout') === 'inline') {
          setFormData('searchFormConfig.expand', false);
        }
      },
    },
    {
      label: '搜索表单展开（searchFormConfig.expand）',
      component: 'switch',
      path: 'searchFormConfig.expand',
    },
    {
      label: '搜索表单展开行数阈值（expand.minExpandRows）',
      path: 'searchFormConfig.expand.minExpandRows',
      component: 'input-number',
      componentStyle: { width: '100px' },
      precision: 0,
      min: 1,
      hidden: computed(() => !getFormData('searchFormConfig.expand')),
    },
    {
      label: '搜索表单初始展开状态（expand.expandStatus）',
      path: 'searchFormConfig.expand.expandStatus',
      component: 'switch',
      hidden: computed(() => !getFormData('searchFormConfig.expand')),
    },
  ]
);

const { formData, getFormData, setFormData } = configForm;

const isControlChecked = computed(() => {
  const control = formData.control as any;
  return control === true || !!control?.sizeControl || !!control?.columnControl;
});

const isSizeControlChecked = computed(() => {
  const control = formData.control as any;
  return control === true || !!control?.sizeControl;
});

const isColumnControlChecked = computed(() => {
  const control = formData.control as any;
  return control === true || !!control?.columnControl;
});

const setAllControl = (val: boolean) => {
  setFormData('control', {
    sizeControl: val,
    columnControl: val,
  });
};

const setControlPartial = (
  key: 'sizeControl' | 'columnControl',
  val: boolean
) => {
  const currentControl = getFormData('control');
  const fallback = {
    sizeControl: !!(currentControl === true),
    columnControl: !!(currentControl === true),
  };
  const next =
    currentControl && typeof currentControl === 'object'
      ? currentControl
      : fallback;
  setFormData('control', { ...next, [key]: val });
};

const setExpandEnabled = (val: boolean) => {
  if (!val) {
    setFormData('searchFormConfig.expand', false);
    return;
  }
  const currentExpand = getFormData('searchFormConfig.expand');
  if (currentExpand && typeof currentExpand === 'object') {
    setFormData('searchFormConfig.expand', currentExpand);
    return;
  }
  setFormData('searchFormConfig.expand', {
    minExpandRows: 2,
    expandStatus: false,
  });
};
</script>

<template>
  <!-- eslint-disable vue/valid-v-slot -->
  <ElCard
    class="pro-table-demo"
    :body-style="{
      background: isDark ? '#141414' : '#f7f8f9',
      overflow: 'hidden',
    }"
  >
    <ElSpace align="start" style="width: 100%">
      <ProForm :form="configForm" style="width: min(100%, 700px)">
        <template #control>
          <ElSwitch
            :model-value="isControlChecked"
            @update:model-value="setAllControl"
          />
        </template>
        <template #control.sizeControl>
          <ElSwitch
            :model-value="isSizeControlChecked"
            @update:model-value="val => setControlPartial('sizeControl', val)"
          />
        </template>
        <template #control.columnControl>
          <ElSwitch
            :model-value="isColumnControlChecked"
            @update:model-value="val => setControlPartial('columnControl', val)"
          />
        </template>
        <template #searchFormConfig.layout="{ modelValue }">
          <ElRadioGroup
            :model-value="modelValue"
            @update:model-value="
              val => setFormData('searchFormConfig.layout', val)
            "
          >
            <ElRadioButton value="grid">grid</ElRadioButton>
            <ElRadioButton value="inline">inline</ElRadioButton>
          </ElRadioGroup>
        </template>
        <template #searchFormConfig.expand>
          <ElSwitch
            :model-value="!!formData.searchFormConfig?.expand"
            @update:model-value="setExpandEnabled"
          />
        </template>
      </ProForm>
      <code style="white-space: pre">{{ configForm.formData }}</code>
    </ElSpace>

    <ProTable
      v-bind="{ ...configForm.formData }"
      :key="key"
      :table="table"
      :search="search"
      class="pro-table"
    >
      <template #button-bar>
        <ElButton>button-bar 插槽</ElButton>
      </template>
      <template #toolbar>
        <ElButton>toolbar 插槽</ElButton>
      </template>
    </ProTable>
  </ElCard>
</template>

<style scoped lang="less">
.vp-doc .pro-table-demo {
  :deep(.pro-table) {
    table {
      display: table;
      margin: 0;
      overflow-x: initial;

      tr {
        background-color: initial;
        border-top: initial;
        transition: initial;
      }

      th,
      td {
        border: initial;
      }
    }
  }
}
</style>
