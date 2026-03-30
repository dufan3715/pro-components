<script lang="ts" setup>
import {
  Dropdown,
  DropdownMenu,
  DropdownItem,
  Button,
  type TableProps,
} from '../../../shared/ui';
import ColumnHeightOutlined from './icons/ColumnHeightOutlined.vue';

type Size = TableProps['size'];

const size = defineModel<Size>('size');

size.value = size.value ?? 'default';

const items: Array<{ label: string; key: NonNullable<Size> }> = [
  { label: '默认', key: 'default' },
  { label: '中等', key: 'large' },
  { label: '紧凑', key: 'small' },
];
</script>

<template>
  <Dropdown trigger="click" @command="val => (size = val as any)">
    <Button text class="pro-table_size-control_button">
      <ColumnHeightOutlined />
    </Button>
    <template #dropdown>
      <DropdownMenu>
        <DropdownItem
          v-for="item in items"
          :key="item.key"
          :command="item.key"
          :disabled="item.key === size"
        >
          {{ item.label }}
        </DropdownItem>
      </DropdownMenu>
    </template>
  </Dropdown>
</template>

<style scoped lang="less">
.pro-table_size-control_button {
  display: flex;
  align-items: center;
  padding-right: 12px;
  padding-left: 12px;

  :deep(svg) {
    transform: scale(1.3);
  }
}
</style>
