<script lang="ts" setup>
import { Button, Dropdown, Checkbox } from '../../../shared/ui';
import { computed, h, ref, watch } from 'vue';
import type { Columns, ColumnControlConfig } from '../types';
import { type Table } from '../useTable';
import FilterOutlined from './icons/FilterOutlined.vue';
import { useLocale } from '../../../locale';

type Props = {
  columns: Columns;
  table?: Table;
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

const checkedColumnsOptions = computed<
  Array<{
    label: string;
    value: string;
    checked: boolean;
    disabled: boolean;
  }>
>(() =>
  props.columns.flatMap(item => {
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
      checked: !item.hidden || disabled,
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

const onCheckAllChange = (e: any) => {
  checkedColumnKeys.value = e.target.checked
    ? controllableOptions.value.map(item => item.value)
    : [];
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

const items = computed<any>(() => {
  const result: any[] = [];
  if (!props.columnControl?.disableCheckAll) {
    result.push(
      {
        key: 'all',
        label: h(
          Checkbox,
          {
            style: { width: '100%' },
            checked: checkAll.value,
            indeterminate: indeterminate.value,
            onChange: onCheckAllChange,
          },
          () => t('table.selectAll')
        ),
      },
      { type: 'divider' }
    );
  }
  result.push(
    ...checkedColumnsOptions.value.map(item => ({
      key: item.value,
      disabled: item.disabled,
      label: h(
        Checkbox,
        {
          style: { width: '100%' },
          checked: item.checked,
          disabled: item.disabled,
          onChange: () => checkColumnsMenuItemClick(item.value),
        },
        () => item.label
      ),
    }))
  );
  return result;
});

function handleOpenChange(
  nextOpen: boolean,
  info: { source: 'trigger' | 'menu' }
) {
  if (info.source === 'trigger' || nextOpen) {
    open.value = nextOpen;
  }
}
</script>

<template>
  <Dropdown
    :open="open"
    arrow
    placement="bottomRight"
    :menu="{ items }"
    @open-change="handleOpenChange"
  >
    <Button type="text" class="pro-table_column-control_button">
      <FilterOutlined />
    </Button>
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
