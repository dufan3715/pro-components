<script
  lang="ts"
  setup
  generic="D extends Record<string, any> = Record<string, any>"
>
import { get, normalizePathKey } from '../../../shared/core';
import { TableColumn } from '../../../shared/ui';
import { SlotComponent } from '../../form';
import type { Column, Columns } from '../types';
import { computed } from 'vue';

defineOptions({ name: 'TableColumnRenderer' });

type Props = {
  columns: Columns<D>;
};
const props = withDefaults(defineProps<Props>(), {
  columns: () => [],
});

const getColumnKey = (column: Column<D>, index: number) => {
  const rawKey = column.key ?? column.prop;
  if (rawKey === undefined || rawKey === null) return `__col_${index}`;
  return normalizePathKey(rawKey);
};

const getCellValue = (row: Record<string, any>, column: Column<D>) => {
  const path = column.prop;
  if (!path) return undefined;
  return get(row, path);
};

const normalizedColumns = computed(() => {
  return props.columns.filter(column => !column.hidden);
});

const getColumnProps = (column: Column<D>) => {
  const { hidden, render, key, children, ...rest } = column;
  const prop = column.prop ? normalizePathKey(column.prop) : undefined;
  const columnKey = key ? normalizePathKey(key) : prop;
  return {
    ...rest,
    label: column.label ?? (column as any).title,
    prop,
    columnKey,
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
        <!-- 经 SlotComponent 渲染：支持组件、VNode 与文本等多种形态 -->
        <SlotComponent
          :component="
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
