<script
  lang="ts"
  setup
  generic="D extends Record<string, any> = Record<string, any>"
>
import { get, toPath } from '../../../shared/core';
import { TableColumn } from '../../../shared/ui';
import type { Column, Columns } from '../types';
import { computed } from 'vue';

defineOptions({ name: 'TableColumnRenderer' });

type Props = {
  columns: Columns<D>;
};
const { columns } = defineProps<Props>();

const getColumnKey = (column: Column<D>, index: number) => {
  const key = column.key ?? column.prop;
  if (key === undefined || key === null) return `__col_${index}`;
  return Array.isArray(key) ? key.join('.') : String(key);
};

const getCellValue = (row: Record<string, any>, column: Column<D>) => {
  const path = column.prop;
  if (!path) return undefined;
  return get(row, toPath(path));
};

const normalizedColumns = computed(() => {
  return columns.filter(column => !column.hidden);
});

const getColumnProps = (column: Column<D>) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { hidden, render, key, children, ...rest } = column;
  const prop = column.prop ? String(column.prop) : undefined;
  return {
    ...rest,
    label: column.label ?? (column as any).title,
    prop,
    columnKey: key ? String(key) : prop,
  };
};
</script>

<template>
  <template
    v-for="(column, index) in normalizedColumns"
    :key="getColumnKey(column, index)"
  >
    <!-- 分组列（递归子列） -->
    <TableColumn
      v-if="column.children && column.children.length > 0"
      v-bind="getColumnProps(column)"
    >
      <TableColumnRenderer :columns="column.children" />
    </TableColumn>

    <!-- 自定义 render 列 -->
    <TableColumn
      v-else-if="typeof column.render === 'function'"
      v-bind="getColumnProps(column)"
    >
      <template #default="scope">
        <component
          :is="
            column.render?.({
              ...scope,
              column,
              cellValue: getCellValue(scope.row, column),
            })
          "
        />
      </template>
    </TableColumn>

    <!-- 普通列（Element Plus 原生渲染） -->
    <TableColumn v-else v-bind="getColumnProps(column)" />
  </template>
</template>
