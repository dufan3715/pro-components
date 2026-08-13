<script setup lang="ts">
import { ref } from 'vue';
import { Card, ConfigProvider, RadioGroup, RadioButton } from 'antdv-next';
import {
  ProComponentProvider,
  ProTable,
  ProTableProps,
  useTable,
} from '@qin-ui/antdv-next-pro';
import zhCN from 'antdv-next/locale/zh_CN';
import zhTW from 'antdv-next/locale/zh_TW';
import enUS from 'antdv-next/locale/en_US';

type Row = {
  name: string;
  age: number;
  gender: string;
};

type Lang = 'zh-CN' | 'zh-TW' | 'en-US';

// 切换 ConfigProvider 的 locale，ProTable 内置文案（查询/重置/序号/占位符/共 X 条）随之切换
const lang = ref<Lang>('zh-CN');
const locales: Record<Lang, any> = {
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  'en-US': enUS,
};

const total = 100;
const mockListData = new Array(total).fill(null).map((_, index) => ({
  name: `张三${index}`,
  age: index,
  gender: index % 2 === 0 ? '男' : '女',
}));

const table = useTable<Row>({
  searchFields: [
    { label: '姓名', path: 'name', component: 'input' },
    {
      label: '性别',
      path: 'gender',
      component: 'select',
      options: [
        { label: '男', value: '男' },
        { label: '女', value: '女' },
      ],
    },
  ],
  columns: [
    { title: '姓名', dataIndex: 'name' },
    { title: '年龄', dataIndex: 'age' },
    { title: '性别', dataIndex: 'gender' },
  ],
});

const search: ProTableProps['search'] = async () => {
  const { current, pageSize } = table.pageParam;
  table.dataSource.value = mockListData.slice(
    (current - 1) * pageSize,
    current * pageSize
  );
  table.setPageParam({ total });
};
</script>

<template>
  <Card class="pro-table-demo">
    <ConfigProvider :locale="locales[lang]">
      <RadioGroup
        v-model:value="lang"
        button-style="solid"
        style="margin-bottom: 16px"
      >
        <RadioButton value="zh-CN">简体中文</RadioButton>
        <RadioButton value="zh-TW">繁體中文</RadioButton>
        <RadioButton value="en-US">English</RadioButton>
      </RadioGroup>

      <ProComponentProvider>
        <ProTable :table="table" :search="search" />
      </ProComponentProvider>
    </ConfigProvider>
  </Card>
</template>
