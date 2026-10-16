<script lang="ts" setup>
/**
 * 表格尺寸切换控件，以图标按钮 + 下拉菜单呈现
 *
 * @component SizeControl
 *
 * @param {Size} [size] - 表格尺寸（`v-model:size`），仅用于回写选中结果
 * @param {Size} [effectiveSize] - 表格实际使用的尺寸，用于高亮选中项；未提供时依次回退 `size`、宿主 ConfigProvider 的 componentSize
 */
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

const props = withDefaults(
  defineProps<{
    effectiveSize?: Size;
  }>(),
  { effectiveSize: undefined }
);

const size = defineModel<Size>('size');

// 高亮项：表格有效尺寸 > 本地绑定 > 宿主 ConfigProvider 的 componentSize
const currentSize = computed(
  () =>
    props.effectiveSize ??
    size.value ??
    configContext.componentSize?.value ??
    'large'
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
