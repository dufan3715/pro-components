<script lang="ts" setup>
import { ElCard } from 'element-plus';
import { ProTable, useTable } from '@qin-ui/element-plus-pro';

type Row = {
  name: string;
  age: number;
  birthday: string;
  address: string;
};

const table = useTable<Row>({
  searchFields: [
    { label: '姓名', path: 'name', component: 'input' },
    { label: '年龄', path: 'age', component: 'input-number' },
  ],
  columns: [
    { prop: 'name', label: '姓名', minWidth: 120 },
    { prop: 'age', label: '年龄', width: 100 },
    { prop: 'birthday', label: '生日', minWidth: 140 },
    { prop: 'address', label: '家庭住址', minWidth: 160 },
  ],
});

const total = 120;
const mockListData = new Array(total).fill(null).map((_, index) => ({
  name: `张三${index}`,
  age: index % 50,
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
</script>

<template>
  <ElCard class="pro-table-demo">
    <ProTable :table="table" :search="search" class="pro-table" />
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
