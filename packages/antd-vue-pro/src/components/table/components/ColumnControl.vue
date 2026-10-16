<script lang="ts" setup>
/**
 * 列显隐控制控件，以下拉菜单列出可控列并支持全选/取消全选
 *
 * @component ColumnControl
 *
 * @param {Columns} columns - 参与控制的列配置（由 ProTable 下发）
 * @param {Table} [table] - 表格实例，勾选结果经其 `setColumn` 写回列 `hidden`
 * @param {ColumnControlConfig} [columnControl] - 控制项配置：labels / excludedKeys / disabledKeys / disableCheckAll
 */
import {
  Button,
  MenuDivider,
  Dropdown,
  Menu,
  MenuItem,
  Checkbox,
} from '../../../shared/ui';
import { computed, ref, toValue, watch } from 'vue';
import { isObjectItem } from '../../../shared/core';
import type { Columns, ColumnControlConfig } from '../types';
import { type Table } from '../hooks/useTable';
import FilterOutlined from './icons/FilterOutlined.vue';
import { useLocale } from '../../../locale';

type Props = {
  /** 参与控制的列配置（由 ProTable 下发） */
  columns: Columns;
  /** 表格实例，勾选结果经其 `setColumn` 写回列 `hidden` */
  table?: Table;
  /** 控制项配置：labels / excludedKeys / disabledKeys / disableCheckAll */
  columnControl?: ColumnControlConfig;
};
const props = withDefaults(defineProps<Props>(), {
  table: undefined,
  columnControl: undefined,
});

const { t } = useLocale();

const open = ref(false);

const checkAll = ref(false);
const indeterminate = ref(false);

/** 下拉项：逐列解析出 key、显示名、勾选态与是否禁用 */
const checkedColumnsOptions = computed<
  Array<{
    label: string;
    value: string;
    checked: boolean;
    disabled: boolean;
  }>
>(() =>
  props.columns.filter(isObjectItem).flatMap(item => {
    const rawKey =
      item.key ??
      (Array.isArray(item.dataIndex)
        ? item.dataIndex.join('.')
        : item.dataIndex);
    if (!rawKey || !item.title) return [];
    const key = String(rawKey);
    // 默认排除内部序号列 __INDEX__ 及显式指定的 excludedKeys
    if (
      key === '__INDEX__' ||
      props.columnControl?.excludedKeys?.some(ek => String(ek) === key)
    )
      return [];
    const disabled =
      props.columnControl?.disabledKeys?.some(dk => String(dk) === key) ??
      false;
    // labels 优先；title 为字符串时直接使用；vnode 等其他类型降级为 key
    const label =
      (props.columnControl?.labels?.[key] as string) ??
      (typeof item.title === 'string' ? item.title : key);
    return {
      label,
      value: key,
      checked: !toValue(item.hidden) || disabled,
      disabled,
    };
  })
);

/** 可被用户勾选/取消的列（非 disabled） */
const controllableOptions = computed(() =>
  checkedColumnsOptions.value.filter(item => !item.disabled)
);

const checkedColumnKeys = computed({
  get() {
    return checkedColumnsOptions.value.flatMap(item =>
      item.checked ? item.value : []
    );
  },
  set(val) {
    // 仅写 hidden 发生翻转的列
    const checkedSet = new Set(val);
    checkedColumnsOptions.value.forEach(item => {
      if (item.disabled || item.checked === checkedSet.has(item.value)) return;
      props.table?.setColumn?.(item.value, {
        hidden: !checkedSet.has(item.value),
      });
    });
  },
});

const onCheckAllChange = () => {
  // 整行点击触发：当前全选则取消全选，否则全选可控列
  checkedColumnKeys.value = checkAll.value
    ? []
    : controllableOptions.value.map(item => item.value);
  indeterminate.value = false;
};

const checkColumnsMenuItemClick = (val: string) => {
  const item = checkedColumnsOptions.value.find(o => o.value === val);
  if (item?.disabled) return;
  if (checkedColumnKeys.value.includes(val)) {
    checkedColumnKeys.value = checkedColumnKeys.value.filter(
      item => item !== val
    );
  } else {
    checkedColumnKeys.value = [...checkedColumnKeys.value, val];
  }
};

watch(
  checkedColumnKeys,
  () => {
    const controllableChecked = controllableOptions.value.filter(
      item => item.checked
    );
    indeterminate.value =
      !!controllableChecked.length &&
      controllableChecked.length < controllableOptions.value.length;
    checkAll.value =
      controllableChecked.length === controllableOptions.value.length &&
      controllableOptions.value.length > 0;
  },
  { immediate: true }
);

// disabledKeys 指定的列始终强制展示
watch(
  () => props.columnControl?.disabledKeys,
  keys => {
    keys?.forEach(key => {
      props.table?.setColumn?.(String(key), { hidden: false });
    });
  },
  { immediate: true, deep: true }
);
</script>

<template>
  <Dropdown v-model:open="open" arrow placement="bottomRight">
    <Button type="text" class="pro-table_column-control_button">
      <FilterOutlined />
    </Button>
    <template #overlay>
      <Menu
        style="min-width: 100px; max-height: 500px; overflow-y: scroll"
        :selectable="false"
      >
        <MenuItem
          v-if="!props.columnControl?.disableCheckAll"
          :key="0"
          @click="onCheckAllChange"
        >
          <Checkbox
            style="pointer-events: none"
            :checked="checkAll"
            :indeterminate="indeterminate"
          >
            {{ t('table.selectAll') }}
          </Checkbox>
        </MenuItem>
        <MenuDivider v-if="!columnControl?.disableCheckAll" />
        <MenuItem
          v-for="item of checkedColumnsOptions"
          :key="item.value"
          @click="checkColumnsMenuItemClick(item.value)"
        >
          <Checkbox
            :checked="item.checked"
            :disabled="item.disabled"
            style="pointer-events: none"
          >
            {{ item.label }}
          </Checkbox>
        </MenuItem>
      </Menu>
    </template>
  </Dropdown>
</template>

<style scoped lang="less">
.pro-table_column-control_button {
  display: flex;
  align-items: center;
  padding-right: 12px;
  padding-left: 12px;

  :deep(svg) {
    transform: scale(1.2, 1.4);
  }
}
</style>
