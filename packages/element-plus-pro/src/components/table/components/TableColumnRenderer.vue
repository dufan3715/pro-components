<script lang="ts">
/**
 * 列配置渲染器
 *
 * @component TableColumnRenderer
 * @description 把列数组渲染为 el-table-column 树，支持分组列（children）、自定义 render 列与深层路径取值
 *
 * @param {Columns} [columns] - 列配置数组
 *
 * @internal
 */
import { defineComponent, h, toRaw, toValue, type PropType } from 'vue';
import { get, isObjectItem, normalizePathKey } from '../../../shared/core';
import { TableColumn } from '../../../shared/ui';
import SlotComponent from '../../form/components/SlotComponent/index.vue';
import type { Column, Columns } from '../types';

/*
 * 无 key/prop 列的渲染 key 与列对象身份绑定：
 * 列增删、重排与过滤后 key 不随数组位置漂移
 */
let columnKeySeed = 0;
const columnKeyMap = new WeakMap<object, number>();
const getStableColumnKey = (column: unknown): string | number => {
  if (column === null || typeof column !== 'object')
    return `raw_${String(column)}`;
  const raw = toRaw(column);
  let key = columnKeyMap.get(raw);
  if (key === undefined) {
    key = ++columnKeySeed;
    columnKeyMap.set(raw, key);
  }
  return key;
};

const getColumnKey = (column: Column) => {
  // 空字符串 key 视为未提供，与 getColumnProps 的 columnKey 取值一致
  const rawKey = column.key || column.prop;
  if (!rawKey) return getStableColumnKey(column);
  return normalizePathKey(rawKey);
};

const getCellValue = (row: Record<string, any>, column: Column) => {
  const path = column.prop;
  if (!path) return undefined;
  return get(row, path);
};

const getColumnProps = (column: Column) => {
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

/*
 * 递归渲染列树：子列以同层 vnode 数组展开，深层分组同样成立
 */
const renderColumn = (column: Column): any => {
  const hasChildren =
    Array.isArray(column.children) && column.children.length > 0;
  const vnodeProps = { key: getColumnKey(column), ...getColumnProps(column) };
  if (hasChildren) {
    return h(TableColumn, vnodeProps, {
      default: () =>
        column
          .children!.filter(
            child => isObjectItem(child) && !toValue(child.hidden)
          )
          .map(child => renderColumn(child)),
    });
  }
  if (typeof column.render === 'function') {
    return h(TableColumn, vnodeProps, {
      default: (scope: any) =>
        h(SlotComponent, {
          component: column.render!({
            ...scope,
            column,
            cellValue: getCellValue(scope.row, column),
          }),
        }),
    });
  }
  return h(TableColumn, vnodeProps);
};

export default defineComponent({
  name: 'TableColumnRenderer',
  inheritAttrs: false,
  props: {
    columns: {
      type: Array as PropType<Columns>,
      default: () => [],
    },
  },
  setup(props) {
    return () =>
      props.columns
        .filter(column => isObjectItem(column) && !toValue(column.hidden))
        .map(column => renderColumn(column));
  },
});
</script>
