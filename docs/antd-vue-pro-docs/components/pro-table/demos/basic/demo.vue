<script lang="ts" setup>
import { Card } from 'ant-design-vue';
import { ProTable, ProTableProps, useTable } from '@qin-ui/antd-vue-pro';

// [!code highlight]
// 1. 定义表格行数据类型（可选）
type Row = {
  name: string;
  age: number;
  gender: string;
  birthday: string;
  address: string;
};

// [!code highlight]
// 2. 使用useTable hook创建table对象
const table = useTable<Row>({
  searchFields: [
    { label: '姓名', path: 'name', component: 'input' },
    { label: '年龄', path: 'age', component: 'input-number' },
    { label: '性别', path: 'gender', component: 'select' },
    { label: '生日', path: 'birthday', component: 'range-picker' },
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

// [!code highlight]
// 3. 定义表格数据获取方法search
const search: ProTableProps['search'] = async ({ current, pageSize }) => {
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
</script>

<template>
  <Card class="pro-table-demo" :body-style="{ background: '#f7f8f9' }">
    <!-- [!code highlight] -->
    <!-- 4. 向ProTable表格组件传入创建的table对象和search方法 -->
    <ProTable :table="table" :search="search" class="pro-table"> </ProTable>
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
