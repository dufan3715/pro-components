<script lang="ts" setup>
import { Card, Space, Switch, Button } from 'antdv-next';
import { ProTable, ProForm, useForm, useTable } from '@qin-ui/antdv-next-pro';
import type { Field } from '@qin-ui/antdv-next-pro';
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
    { label: '生日', path: 'birthday', component: 'range-picker' },
    { label: '筛选项a', path: 'a', component: 'input' },
    { label: '筛选项b', path: 'b', component: 'input' },
    { label: '筛选项c', path: 'c', component: 'input' },
    { label: '筛选项d', path: 'd', component: 'input' },
  ],
  columns: [
    { title: '姓名', dataIndex: 'name' },
    { title: '年龄', dataIndex: 'age' },
    { title: '性别', dataIndex: 'gender' },
    { title: '生日', dataIndex: 'birthday' },
    { title: '家庭住址', dataIndex: 'address' },
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
      table.dataSource.value = list;
      table.setPageParam({ total: total });
      resolve();
    }, 600);
  });
};

const key = ref(1);

const form = useForm<any, Field<any>>(
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
      label: '立即执行一次search（immediateSearch）',
      component: 'switch',
      path: 'immediateSearch',
      onChange: () => {
        table.dataSource.value = [];
        key.value += 1;
      },
    },
    { label: '展示控制栏（control）', path: 'control', modelProp: 'checked' },
    {
      label: '尺寸控制（control.sizeControl）',
      path: 'control.sizeControl',
      modelProp: 'checked',
    },
    {
      label: '列控制（control.columnControl）',
      path: 'control.columnControl',
      modelProp: 'checked',
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
      label: '展开搜索表单（searchFormConfig.expand）',
      path: 'searchFormConfig.expand',
      modelProp: 'checked',
    },
    {
      label: '展开行数阈值（expand.minExpandRows）',
      path: 'searchFormConfig.expand.minExpandRows',
      component: 'input-number',
      componentStyle: { width: '100px' },
      precision: 0,
      min: 1,
      hidden: computed((): boolean => !getFormData('searchFormConfig.expand')),
    },
    {
      label: '初始展开状态（expand.expandStatus）',
      path: 'searchFormConfig.expand.expandStatus',
      component: 'switch',
      hidden: computed((): boolean => !getFormData('searchFormConfig.expand')),
    },
  ]
);
const { formData, getFormData, setFormData } = form;
</script>

<template>
  <!-- eslint-disable vue/valid-v-slot -->
  <Card
    class="pro-table-demo"
    :styles="{
      body: { background: isDark ? '#141414' : '#f7f8f9', overflow: 'hidden' },
    }"
  >
    <Space align="start">
      <ProForm :form="form" style="width: 700px">
        <template #control="{ checked, ...rest }">
          <Switch
            :checked="
              checked?.sizeControl || checked?.columnControl || checked === true
            "
            v-bind="rest"
          />
        </template>
        <template #control.sizeControl="{ checked, ...rest }">
          <Switch
            :checked="checked || formData.control === true"
            v-bind="rest"
          />
        </template>
        <template #control.columnControl="{ checked, ...rest }">
          <Switch
            :checked="checked || formData.control === true"
            v-bind="rest"
          />
        </template>
        <template #searchFormConfig.expand="{ checked, ...rest }">
          <Switch :checked="!!checked" v-bind="rest" />
        </template>
      </ProForm>
      <code style="white-space: pre">
        {{ form.formData }}
      </code>
    </Space>
    <ProTable
      v-bind="{ ...form.formData }"
      :key="key"
      :table="table"
      :search="search"
      class="pro-table"
    >
      <template #button-bar>
        <Button>button-bar 插槽</Button>
      </template>
      <template #toolbar>
        <Button>toolbar 插槽</Button>
      </template>
    </ProTable>
  </Card>
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
