<script lang="ts" setup>
import {
  Button,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  Checkbox,
} from '../../../shared/ui';
import { computed, ref, watch } from 'vue';
import type { Column, Columns } from '../types';
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

const getColumnKey = (column: Column, index: number) => {
  const key = column.key ?? column.prop;
  if (key === undefined || key === null) return `__idx_${index}`;
  return Array.isArray(key) ? key.join('.') : String(key);
};

const checkedColumnsOptions = computed<
  Array<{ label: string; value: string; checked: boolean; column: Column }>
>(() =>
  columns.map((item, index) => ({
    label: String(item.label ?? item.prop ?? `列${index + 1}`),
    value: getColumnKey(item, index),
    checked: !item.hidden,
    column: item,
  }))
);

const checkedColumnKeys = computed({
  get() {
    return checkedColumnsOptions.value.flatMap(item =>
      item.checked ? item.value : []
    );
  },
  set(val: string[]) {
    checkedColumnsOptions.value.forEach(item => {
      table?.setColumn(item.value as any, {
        hidden: !val.includes(item.value),
      });
    });
  },
});

const onCheckAllChange = (value: any) => {
  const checked = !!(value?.target?.checked ?? value);
  checkedColumnKeys.value = checked
    ? checkedColumnsOptions.value.map(item => item.value)
    : [];
  indeterminate.value = false;
};

const toggleColumnsItem = (val: string) => {
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
</script>

<template>
  <Dropdown
    trigger="click"
    :hide-on-click="false"
    :visible="open"
    @visible-change="val => (open = val)"
  >
    <Button text class="pro-table_column-control_button">
      <FilterOutlined />
    </Button>
    <template #dropdown>
      <DropdownMenu>
        <DropdownItem :disabled="true" :divided="false">
          <Checkbox
            :model-value="checkAll"
            :indeterminate="indeterminate"
            @change="onCheckAllChange"
          >
            全选
          </Checkbox>
        </DropdownItem>
        <DropdownItem
          v-for="item in checkedColumnsOptions"
          :key="item.value"
          :command="item.value"
          @click.stop="toggleColumnsItem(item.value)"
        >
          <Checkbox
            :model-value="item.checked"
            @change="() => toggleColumnsItem(item.value)"
          >
            {{ item.label }}
          </Checkbox>
        </DropdownItem>
      </DropdownMenu>
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
