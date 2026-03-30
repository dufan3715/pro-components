<script setup lang="ts">
import { ElCard, ElTag } from 'element-plus';
import { h } from 'vue';
import { ProTable, useTable } from '@qin-ui/element-plus-pro';

type Row = {
  name: string;
  age: number;
  city: string;
  status: 'online' | 'offline';
};

const table = useTable<Row>({
  columns: [
    { prop: 'name', label: '姓名', minWidth: 120 },
    {
      prop: 'age',
      label: '年龄',
      width: 100,
      formatter: row => `${row.age} 岁`,
    },
    {
      prop: 'status',
      label: '状态(render)',
      width: 140,
      render: ({ row }) =>
        h(ElTag, { type: row.status === 'online' ? 'success' : 'info' }, () =>
          row.status === 'online' ? '在线' : '离线'
        ),
    },
    {
      prop: 'city',
      label: '城市',
      minWidth: 140,
    },
  ],
  data: [
    { name: '张三', age: 25, city: '上海', status: 'online' },
    { name: '李四', age: 31, city: '杭州', status: 'offline' },
    { name: '王五', age: 29, city: '深圳', status: 'online' },
  ],
});
</script>

<template>
  <ElCard>
    <ProTable :table="table" :pagination="false" :control="false" />
  </ElCard>
</template>
