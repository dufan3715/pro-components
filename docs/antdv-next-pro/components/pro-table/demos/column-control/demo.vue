<script lang="ts" setup>
import { Alert, Card, Tag } from 'antdv-next';
import { ProTable, useTable } from '@qin-ui/antdv-next-pro';
import { computed, h, ref, watch } from 'vue';
import { useData } from 'vitepress';
const { isDark } = useData();

type Row = {
  name: string;
  age: number;
  gender: string;
  birthday: string;
  address: string;
};

// 模拟数据库接口：实际项目中替换为真实后端 API（按 userId 存储）
const mockApi = {
  async loadUserColumnState(): Promise<Record<string, { hidden?: boolean }>> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(mockApi.state);
      }, 200);
    });
  },
  async saveUserColumnState(
    state: Record<string, { hidden?: boolean }>
  ): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => {
        mockApi.state = state;
        resolve();
      }, 200);
    });
  },
  state: { gender: { hidden: true } } as Record<string, { hidden?: boolean }>,
};

const table = useTable<Row>({
  searchFields: [{ label: '姓名', path: 'name', component: 'input' }],
  columns: [
    // title 为 vnode，通过 columnControl.labels 提供下拉展示文本
    {
      title: h(Tag, { color: 'blue' }, () => '姓名'),
      dataIndex: 'name',
    },
    { title: '年龄', dataIndex: 'age' },
    { title: '性别', dataIndex: 'gender' },
    { title: '生日', dataIndex: 'birthday' },
    // excludedKeys 固定列：不出现在列控制下拉中
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

// 持久化（外部实现）：监听 table.columns 的 hidden 变化保存到数据库
let restoring = false;
watch(
  () => table.columns.value.map(c => c.hidden),
  () => {
    if (restoring) return; // 恢复期间不重复保存
    const state: Record<string, { hidden?: boolean }> = {};
    table.columns.value.forEach(column => {
      const key = column.key ?? column.dataIndex;
      if (key) state[String(key)] = { hidden: !!column.hidden };
    });
    mockApi.saveUserColumnState(state);
  },
  { deep: true }
);

// 恢复（外部实现）：进入页面从数据库加载后回写列 hidden
const loaded = ref(false);
mockApi.loadUserColumnState().then(state => {
  restoring = true;
  Object.entries(state).forEach(([key, { hidden }]) => {
    table.setColumn(key as any, { hidden: !!hidden });
  });
  restoring = false;
  loaded.value = true;
});

const control = computed(() => ({
  columnControl: {
    labels: { name: '姓名' },
    excludedKeys: ['address'],
    disabledKeys: ['age'],
    disableCheckAll: false,
  },
}));
</script>

<template>
  <Card
    class="pro-table-demo"
    :styles="{ body: { background: isDark ? '#141414' : '#f7f8f9' } }"
  >
    <Alert
      :message="loaded ? '已从数据库恢复列状态' : '正在加载列状态...'"
      type="info"
      show-icon
      style="margin-bottom: 16px"
    />
    <ProTable
      :table="table"
      :search="search"
      :control="control"
      class="pro-table"
    />
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
