<script lang="ts" setup>
import {
  Button,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  Checkbox,
} from '../../../shared/ui';
import { computed, ref, watch } from 'vue';
import type { Column, Columns, ColumnControlConfig } from '../types';
import { type Table } from '../useTable';
import FilterOutlined from './icons/FilterOutlined.vue';
import { useLocale } from '../../../locale';
import { normalizePathKey } from '../../../shared/core';

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

const checkAll = ref(false);
const indeterminate = ref(false);

const getColumnKey = (column: Column, index: number) => {
  const rawKey = column.key ?? column.prop;
  if (rawKey === undefined || rawKey === null) return `__col_${index}`;
  return normalizePathKey(rawKey);
};

const checkedColumnsOptions = computed<
  Array<{
    label: string;
    value: string;
    checked: boolean;
    disabled: boolean;
    column: Column;
  }>
>(() =>
  props.columns
    .map((item, index) => {
      const key = getColumnKey(item, index);
      const excluded = props.columnControl?.excludedKeys?.some(
        ek => String(ek) === key
      );
      const disabled = props.columnControl?.disabledKeys?.some(
        dk => String(dk) === key
      );
      const rawTitle = item.label ?? (item as any).title;
      const titleLabel = typeof rawTitle === 'string' ? rawTitle : undefined;
      const propLabel =
        item.prop !== undefined && item.prop !== null
          ? String(item.prop)
          : undefined;
      const label =
        (props.columnControl?.labels?.[key] as string) ??
        titleLabel ??
        propLabel ??
        key ??
        t('table.columnFallback', { index: index + 1 });
      return {
        label,
        value: key,
        checked: !item.hidden || !!disabled,
        disabled: !!disabled,
        column: item,
        excluded,
      };
    })
    .filter(item => !item.excluded)
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
  set(val: string[]) {
    checkedColumnsOptions.value.forEach(item => {
      if (item.disabled) return;
      props.table?.setColumn(item.value as any, {
        hidden: !val.includes(item.value),
      });
    });
  },
});

const onCheckAllChange = (value: any) => {
  const checked = !!(value?.target?.checked ?? value);
  checkedColumnKeys.value = checked
    ? controllableOptions.value.map(item => item.value)
    : [];
};

const toggleColumnsItem = (val: string) => {
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
      props.table?.setColumn(String(key), { hidden: false });
    });
  },
  { immediate: true, deep: true }
);
</script>

<template>
  <Dropdown trigger="click" :hide-on-click="false">
    <Button text class="pro-table_column-control_button">
      <FilterOutlined />
    </Button>
    <template #dropdown>
      <DropdownMenu>
        <DropdownItem
          v-if="!props.columnControl?.disableCheckAll"
          :disabled="true"
          :divided="false"
        >
          <Checkbox
            :model-value="checkAll"
            :indeterminate="indeterminate"
            @change="onCheckAllChange"
          >
            {{ t('table.selectAll') }}
          </Checkbox>
        </DropdownItem>
        <DropdownItem
          v-for="item in checkedColumnsOptions"
          :key="item.value"
          :command="item.value"
          @click.stop="toggleColumnsItem(item.value)"
        >
          <Checkbox :model-value="item.checked" :disabled="item.disabled">
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
