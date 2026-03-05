<script lang="ts" setup>
import { Button, Dropdown, Checkbox } from '../../../shared/ui';
import { computed, h, ref, watch } from 'vue';
import type { Columns } from '../types';
import { type Table } from '../useTable';
import FilterOutlined from './icons/FilterOutlined.vue';

type Props = {
  columns: Columns;
  table?: Table;
};
const { columns, table = undefined } = defineProps<Props>();

const open = ref(false);

const checkAll = ref(false);
const indeterminate = ref(false);

const checkedColumnsOptions = computed<
  Array<{ label: string; value: string; checked: boolean }>
>(() =>
  columns.flatMap(item =>
    item.key && item.title
      ? {
          label: item.title as string,
          value: item.key,
          checked: !item.hidden,
        }
      : []
  )
);

const checkedColumnKeys = computed({
  get() {
    return (
      checkedColumnsOptions.value.flatMap(item =>
        item.checked ? item.value : []
      ) || []
    );
  },
  set(val) {
    checkedColumnsOptions.value?.forEach(item => {
      table?.setColumn?.(item.value, {
        hidden: !val.includes(item.value),
      });
    });
  },
});

const onCheckAllChange = (e: any) => {
  checkedColumnKeys.value = e.target.checked
    ? checkedColumnsOptions.value.map(item => item.value)
    : [];
  indeterminate.value = false;
};

const checkColumnsMenuItemClick = (val: string) => {
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
  val => {
    indeterminate.value =
      !!val.length && val.length < checkedColumnsOptions.value.length;
    checkAll.value =
      val.length > 0 && val.length === checkedColumnsOptions.value.length;
  },
  { immediate: true }
);

const items = computed<any>(() => [
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
      () => '全选'
    ),
  },
  { type: 'divider' },
  ...checkedColumnsOptions.value.map(item => ({
    key: item.value,
    label: h(
      Checkbox,
      {
        style: { width: '100%' },
        checked: item.checked,
        onChange: () => checkColumnsMenuItemClick(item.value),
      },
      () => item.label
    ),
  })),
]);

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
