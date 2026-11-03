import { computed, toRaw, toValue, type ComputedRef } from 'vue';
import { isObjectItem, isPlainObject } from '../../../shared/core';
import { ELLIPSIS_TOOLTIP_CELL_ATTR } from './useEllipsisTooltip';

type ColumnTransformResult = {
  columns: any[];
  changed: boolean;
  hasTooltip: boolean;
  // 本层是否有列因环状引用被剔除
  cycleSkipped: boolean;
};

/**
 * 省略 Tooltip 列转换
 *
 * @description 一次遍历完成 hidden 过滤、分组子列递归与 showTooltip 列标记；
 * 仅对发生变化的列生成克隆并登记原始列，供宿主回传列对象时还原。
 * 列还原最多回溯两跳（宿主克隆 → 转换克隆 → 原始列），依赖单遍转换每列最多产生一层克隆。
 *
 * @param getColumns - 读取原始列配置
 * @param globalEnabled - 是否全局启用列 Tooltip
 * @returns 可见列、是否含 Tooltip 列与列还原函数
 */
export function useEllipsisTooltipColumns(
  getColumns: () => any[],
  globalEnabled: () => boolean = () => false
): {
  columns: ComputedRef<any[]>;
  hasTooltip: ComputedRef<boolean>;
  resolveOriginalColumn: (column: any) => any;
  resolveSorterColumn: (sorter: any) => any;
} {
  const originalColumns = new WeakMap<object, any>();

  const registerColumnClone = (next: any, source: any) => {
    if (next !== source && isObjectItem(next) && !originalColumns.has(next)) {
      originalColumns.set(next, source);
    }
    return next;
  };

  // 宿主内部列克隆通过 __originColumn__ 回指原始列（@private）
  const resolveOriginalColumn = (column: any) => {
    const raw = toRaw(column);
    const source = originalColumns.get(raw) ?? raw.__originColumn__;
    if (!isObjectItem(source)) return column;
    return originalColumns.get(toRaw(source)) ?? source;
  };

  const resolveSorterColumn = (sorter: any) =>
    sorter && typeof sorter === 'object' && sorter.column
      ? { ...sorter, column: resolveOriginalColumn(sorter.column) }
      : sorter;

  const transformColumns = (
    columns: any[],
    global: boolean,
    ancestors: Set<object> = new Set()
  ): ColumnTransformResult => {
    const list: any[] = [];
    let changed = false;
    let hasTooltip = false;
    let cycleSkipped = false;

    for (const column of columns) {
      if (!isObjectItem(column) || toValue(column.hidden)) {
        changed = true;
        continue;
      }

      let childChanged = false;
      let childColumns = column.children;
      let childHasTooltip = false;

      if (Array.isArray(column.children) && column.children.length > 0) {
        if (ancestors.has(column)) {
          changed = true;
          cycleSkipped = true;
          continue;
        }
        ancestors.add(column);
        const child = transformColumns(column.children, global, ancestors);
        ancestors.delete(column);
        childChanged = child.changed;
        childColumns = child.columns;
        childHasTooltip = child.hasTooltip;
        cycleSkipped = cycleSkipped || child.cycleSkipped;
        // 子列全部被过滤后分组列整体移除；环状引用剔除时保留为叶子列
        if (childColumns.length === 0 && !child.cycleSkipped) {
          changed = true;
          continue;
        }
      }

      const ellipsis = column.ellipsis;
      const explicit =
        ellipsis === false
          ? false
          : isPlainObject(ellipsis)
            ? ellipsis.showTooltip
            : undefined;
      const tooltipEnabled =
        explicit === false ? false : global || explicit === true;
      let next = column;

      if (childChanged || tooltipEnabled) {
        const { showTooltip: _showTooltip, ...restEllipsis } = isPlainObject(
          ellipsis
        )
          ? ellipsis
          : {};
        const customCell = column.customCell;
        next = {
          ...column,
          ...(childChanged ? { children: childColumns } : {}),
          ...(tooltipEnabled
            ? {
                ellipsis: { ...restEllipsis, showTitle: false },
                customCell: (
                  record: any,
                  rowIndex: number,
                  cellColumn: any
                ) => ({
                  ...(customCell?.(record, rowIndex, cellColumn) ?? {}),
                  [ELLIPSIS_TOOLTIP_CELL_ATTR]: '',
                }),
              }
            : {}),
        };
        registerColumnClone(next, column);
        changed = true;
      }

      if (tooltipEnabled || childHasTooltip) hasTooltip = true;
      list.push(next);
    }

    return {
      columns: changed ? list : columns,
      changed,
      hasTooltip,
      cycleSkipped,
    };
  };

  const state = computed(() => transformColumns(getColumns(), globalEnabled()));

  return {
    columns: computed(() => state.value.columns),
    hasTooltip: computed(() => state.value.hasTooltip),
    resolveOriginalColumn,
    resolveSorterColumn,
  };
}
