<script
  lang="ts"
  setup
  generic="D extends Record<string, any>, K extends Extract<keyof D, string>">
import {
  MenuDivider,
  Dropdown,
  Space,
  Menu,
  MenuItem,
  Checkbox,
  type TableProps,
} from 'ant-design-vue';
import { ColumnHeightOutlined, FilterOutlined } from '@ant-design/icons-vue';
import { computed, ref, watch } from 'vue';
import type { UseTable, Columns } from '../types';

type Props = {
  columns: Columns<D>;
  table?: ReturnType<UseTable<D>>;
};
const props = withDefaults(defineProps<Props>(), {
  table: undefined,
});

const size = defineModel('size', { default: 'large' });

const onSizeChange = (val: any) => {
  size.value = val.key;
};

const checkAll = ref(false);
const indeterminate = ref(false);

const sizeOptions: Array<{ label: string; key: TableProps['size'] }> = [
  { label: '默认', key: 'large' },
  { label: '中等', key: 'middle' },
  { label: '紧凑', key: 'small' },
];

const checkedColumnsOptions = computed<Array<{ label: string; value: string }>>(
  () =>
    props.columns
      ?.filter(item => item.key && item.title)
      .map(item => ({
        label: item.title,
        value: item.key,
      })) as any
);

const checkColumnsVisible = ref(false);

const checkedColumns = computed({
  get() {
    return props.table?.checkedColumns.value || [];
  },
  set(val) {
    props.table?.setCheckedColumns(val || []);
  },
});

const onCheckAllChange = (e: any) => {
  checkedColumns.value = e.target.checked
    ? checkedColumnsOptions.value.map(item => item.value as K)
    : [];
  indeterminate.value = false;
};

const checkColumnsMenuItemClick = (val: K) => {
  if (checkedColumns.value.includes(val)) {
    checkedColumns.value = checkedColumns.value.filter(item => item !== val);
  } else {
    checkedColumns.value = [...checkedColumns.value, val];
  }
};

watch(
  checkedColumns,
  val => {
    indeterminate.value =
      !!val.length && val.length < checkedColumnsOptions.value.length;
    checkAll.value = val.length === checkedColumnsOptions.value.length;
  },
  { immediate: true }
);
</script>

<template>
  <Space size="middle">
    <Dropdown arrow placement="bottomRight">
      <ColumnHeightOutlined
        :style="{ fontSize: '16px' }"
        class="control-icon" />
      <template #overlay>
        <Menu
          style="width: 100px; text-align: center"
          :selected-keys="[size]"
          :items="(sizeOptions as any)"
          @click="onSizeChange">
        </Menu>
      </template>
    </Dropdown>
    <Dropdown v-model:open="checkColumnsVisible" arrow placement="bottomRight">
      <FilterOutlined :style="{ fontSize: '16px' }" class="control-icon" />
      <template #overlay>
        <div>
          <Menu
            style="min-width: 100px; max-height: 500px; overflow-y: scroll"
            :selectable="false">
            <MenuItem :key="0">
              <div>
                <Checkbox
                  :checked="checkAll"
                  :indeterminate="indeterminate"
                  @change="onCheckAllChange">
                  全选
                </Checkbox>
              </div>
            </MenuItem>
            <MenuDivider />
            <MenuItem
              v-for="item of checkedColumnsOptions"
              :key="item.value"
              @click="checkColumnsMenuItemClick(item.value as K)">
              <Checkbox :checked="checkedColumns.includes(item.value as K)">
                <div @click.stop>{{ item.label }}</div>
              </Checkbox>
            </MenuItem>
          </Menu>
        </div>
      </template>
    </Dropdown>
  </Space>
</template>

<style scoped lang="less">
.control-icon {
  cursor: pointer;

  :hover {
    color: #1677ff;
  }
}
</style>
