<script setup lang="ts">
import { ref } from 'vue';
import {
  ElCard,
  ElConfigProvider,
  ElRadioGroup,
  ElRadioButton,
} from 'element-plus';
import {
  ProComponentProvider,
  ProTable,
  useTable,
} from '@qin-ui/element-plus-pro';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import zhTw from 'element-plus/es/locale/lang/zh-tw';
import en from 'element-plus/es/locale/lang/en';

type Row = {
  name: string;
  age: number;
  gender: string;
};

type Lang = 'zh-CN' | 'zh-TW' | 'en-US';

// 切换 el-config-provider 的 locale，ProTable 内置文案（查询/重置/序号/占位符/共 X 条）随之切换
const lang = ref<Lang>('zh-CN');
const locales: Record<Lang, any> = {
  'zh-CN': zhCn,
  'zh-TW': zhTw,
  'en-US': en,
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
    {
      label: '生日',
      path: 'birthday',
      component: 'date-picker',
      type: 'daterange',
    },
  ],
  columns: [
    { prop: 'name', label: '姓名', minWidth: 120 },
    { prop: 'age', label: '年龄', width: 100 },
    { prop: 'gender', label: '性别', width: 100 },
  ],
});

const search = async () => {
  const { current, pageSize } = table.pageParam;
  table.dataSource.value = mockListData.slice(
    (current - 1) * pageSize,
    current * pageSize
  );
  table.setPageParam({ total });
};
</script>

<template>
  <ElCard class="pro-table-demo">
    <ElConfigProvider :locale="locales[lang]">
      <ElRadioGroup v-model="lang" style="margin-bottom: 16px">
        <ElRadioButton value="zh-CN">简体中文</ElRadioButton>
        <ElRadioButton value="zh-TW">繁體中文</ElRadioButton>
        <ElRadioButton value="en-US">English</ElRadioButton>
      </ElRadioGroup>

      <ProComponentProvider>
        <ProTable :table="table" :search="search" />
      </ProComponentProvider>
    </ElConfigProvider>
  </ElCard>
</template>
