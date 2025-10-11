<script lang="ts" setup>
import {
  MenuDivider,
  Dropdown,
  Menu,
  MenuItem,
  Checkbox,
} from '../../../shared/ui';
import { computed, ref, watch } from 'vue';
import type { Columns } from '../types';
import { Table } from '../hooks/useTable';
import FilterOutlined from './icons/FilterOutlined.vue';

type Props = {
  columns: Columns;
  table?: Table;
};
const props = withDefaults(defineProps<Props>(), {
  table: undefined,
});

const open = ref(false);

const checkAll = ref(false);
const indeterminate = ref(false);

const checkedColumnsOptions = computed<
  Array<{ label: string; value: string; checked: boolean }>
>(() =>
  props.columns.flatMap(item =>
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
      props.table?.setColumn?.(item.value, {
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
    checkAll.value = val.length === checkedColumnsOptions.value.length;
  },
  { immediate: true }
);
</script>

<template>
  <Dropdown v-model:open="open" arrow placement="bottomRight">
    <div class="control-icon">
      <FilterOutlined style="font-size: 17px" />
    </div>
    <template #overlay>
      <div>
        <Menu
          style="min-width: 100px; max-height: 500px; overflow-y: scroll"
          :selectable="false"
        >
          <MenuItem :key="0">
            <div>
              <Checkbox
                :checked="checkAll"
                :indeterminate="indeterminate"
                @change="onCheckAllChange"
              >
                全选
              </Checkbox>
            </div>
          </MenuItem>
          <MenuDivider />
          <MenuItem
            v-for="item of checkedColumnsOptions"
            :key="item.value"
            @click="checkColumnsMenuItemClick(item.value)"
          >
            <Checkbox :checked="checkedColumnKeys.includes(item.value)">
              <div @click.stop>{{ item.label }}</div>
            </Checkbox>
          </MenuItem>
        </Menu>
      </div>
    </template>
  </Dropdown>
</template>

<style scoped lang="less">
.control-icon {
  display: flex;
  align-items: center;
  cursor: pointer;

  :hover {
    color: #1677ff;
  }
}
</style>
