<script lang="ts" setup>
import {
  Dropdown,
  Menu,
  Button,
  type TableProps,
  type MenuItemType,
  useConfigContextInject,
} from '../../../shared/ui';
import ColumnHeightOutlined from './icons/ColumnHeightOutlined.vue';
import { computed } from 'vue';
import { useLocale } from '../../../locale';

type Size = TableProps['size'];

const { t } = useLocale();

const configContext = useConfigContextInject();

const size = defineModel<Size>('size');

const currentSize = computed(
  () => size.value ?? configContext.componentSize?.value ?? 'large'
);

const onSizeChange = (val: any) => {
  size.value = val.key;
};

const sizeOptions = computed<Array<MenuItemType>>(() => [
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
    <template #overlay>
      <Menu
        style="width: 100px; text-align: center"
        :selected-keys="[currentSize]"
        :items="sizeOptions"
        @click="onSizeChange"
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
