<script lang="ts" setup>
import { Card, Space, Switch } from 'ant-design-vue';
import { ProTable, useTable } from '@qin-ui/antd-vue-pro';
import { ref } from 'vue';
import { useData } from 'vitepress';

const { isDark } = useData();
const enabled = ref(true);

type Row = {
  name: string;
  company: string;
  address: string;
  remark: string;
  action: string;
};

const table = useTable<Row>({
  columns: [
    { title: '姓名', dataIndex: 'name', width: 100 },
    { title: '公司', dataIndex: 'company', width: 180 },
    { title: '地址', dataIndex: 'address', width: 220 },
    { title: '备注', dataIndex: 'remark', width: 180 },
    { title: '操作', dataIndex: 'action', width: 90, ellipsis: false },
  ],
  dataSource: [
    {
      name: '张三',
      company: '上海某某某某某某某某某某某某科技有限公司',
      address: '上海市浦东新区某某某某某某某某某某某某某某某某路 100 号',
      remark:
        '这是一段很长很长的备注文本，用于展示单元格横向溢出时的 Tooltip。',
      action: '查看',
    },
    {
      name: '李四',
      company: '北京某某某某某某某某某某某某信息技术有限公司',
      address: '北京市海淀区某某某某某某某某某某某某某某某某路 200 号',
      remark: '另一段很长很长的备注文本，用于展示表格级共享 Tooltip。',
      action: '查看',
    },
  ],
});
</script>

<template>
  <Card
    class="pro-table-demo"
    :body-style="{ background: isDark ? '#141414' : '#f7f8f9' }"
  >
    <Space style="margin-bottom: 16px">
      <span>全局 ellipsisTooltip</span>
      <Switch v-model:checked="enabled" />
    </Space>
    <ProTable
      :table="table"
      :ellipsis-tooltip="enabled"
      :add-index-column="false"
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
    }
  }
}
</style>
