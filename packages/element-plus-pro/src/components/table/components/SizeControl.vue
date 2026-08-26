<script lang="ts" setup>
import {
  Dropdown,
  DropdownMenu,
  DropdownItem,
  Button,
  type TableProps,
} from '../../../shared/ui';
import ColumnHeightOutlined from './icons/ColumnHeightOutlined.vue';
import { computed } from 'vue';
import { useLocale } from '../../../locale';

type Size = TableProps['size'];

const { t } = useLocale();

const size = defineModel<Size>('size');

const currentSize = computed(() => size.value ?? 'default');

const items = computed<Array<{ label: string; key: NonNullable<Size> }>>(() => [
  { label: t('table.sizeDefault'), key: 'default' },
  { label: t('table.sizeMiddle'), key: 'large' },
  { label: t('table.sizeCompact'), key: 'small' },
]);
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
          :disabled="item.key === currentSize"
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
