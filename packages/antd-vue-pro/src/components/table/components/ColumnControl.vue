<script lang="ts" setup>
import {
  Button,
  MenuDivider,
  Dropdown,
  Menu,
  MenuItem,
  Checkbox,
} from '../../../shared/ui';
import { computed, onMounted, ref, watch } from 'vue';
import type { Columns, ColumnControlConfig } from '../types';
import { type Table } from '../hooks/useTable';
import FilterOutlined from './icons/FilterOutlined.vue';
import { useLocale } from '../../../locale';

type Props = {
  columns: Columns;
  table?: Table;
  columnControl?: ColumnControlConfig;
};
const {
  columns,
  table = undefined,
  columnControl = undefined,
} = defineProps<Props>();

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
  columns.flatMap(item => {
    if (!item.key || !item.title) return [];
    const key = item.key as string;
    if (columnControl?.excludedKeys?.some(ek => String(ek) === key)) return [];
    const disabled =
      columnControl?.disabledKeys?.some(dk => String(dk) === key) ?? false;
    // labels 优先；title 为字符串时直接使用；vnode 等其他类型降级为 key，避免渲染异常
    const label =
      (columnControl?.labels?.[key] as string) ??
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
    checkedColumnsOptions.value.forEach(item => {
      if (item.disabled) return;
      table?.setColumn?.(item.value, {
        hidden: !val.includes(item.value),
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

// 强制 disabledKeys 列始终展示
onMounted(() => {
  columnControl?.disabledKeys?.forEach(key => {
    table?.setColumn?.(String(key), { hidden: false });
  });
});

watch(
  () => columnControl?.disabledKeys,
  keys => {
    keys?.forEach(key => {
      table?.setColumn?.(String(key), { hidden: false });
    });
  },
  { deep: true }
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
          v-if="!columnControl?.disableCheckAll"
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
