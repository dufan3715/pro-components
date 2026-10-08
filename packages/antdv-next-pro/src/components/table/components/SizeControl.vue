<script lang="ts" setup>
import {
  Dropdown,
  Menu,
  Button,
  type TableProps,
  useHostConfig,
} from '../../../shared/ui';
import ColumnHeightOutlined from './icons/ColumnHeightOutlined.vue';
import { computed } from 'vue';
import { useLocale } from '../../../locale';

type Size = TableProps['size'];

const { t } = useLocale();

const hostConfig = useHostConfig();

const size = defineModel<Size>('size');

const currentSize = computed(
  () => size.value ?? hostConfig.componentSize?.value ?? 'large'
);

const items = computed(() => [
  { label: t('table.sizeDefault'), key: 'large' },
  { label: t('table.sizeMiddle'), key: 'middle' },
  { label: t('table.sizeCompact'), key: 'small' },
]);
</script>

<template>
  <Dropdown arrow placement="bottomRight">
    <Button type="text" class="pro-table_size-control_button">
      <ColumnHeightOutlined />
    </Button>
    <template #popupRender>
      <Menu
        :selected-keys="[currentSize as string]"
        style="min-width: 80px"
        :items="items"
        @click="({ key }) => (size = key as any)"
      >
      </Menu>
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
