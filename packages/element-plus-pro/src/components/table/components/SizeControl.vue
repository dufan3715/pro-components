<script lang="ts" setup>
/**
 * 表格尺寸切换控件，以图标按钮 + 下拉菜单呈现
 *
 * @component SizeControl
 *
 * @param {Size} [size] - 表格尺寸（`v-model:size`），仅用于回写选中结果
 * @param {Size} [effectiveSize] - 表格实际使用的尺寸，用于高亮选中项；未提供时依次回退 `size`、宿主 ConfigProvider 的尺寸
 */
import {
  Dropdown,
  DropdownMenu,
  DropdownItem,
  Button,
  useSize,
  type TableProps,
} from '../../../shared/ui';
import ColumnHeightOutlined from './icons/ColumnHeightOutlined.vue';
import { computed } from 'vue';
import { useLocale } from '../../../locale';

type Size = TableProps['size'];

const { t } = useLocale();

const props = withDefaults(
  defineProps<{
    effectiveSize?: Size;
  }>(),
  { effectiveSize: undefined }
);

const size = defineModel<Size>('size');

// 宿主 ConfigProvider / 表单上下文的尺寸兜底
const hostSize = useSize();

// 高亮项：表格有效尺寸 > 本地绑定 > 宿主 ConfigProvider 尺寸 > 默认
const currentSize = computed(
  () => (props.effectiveSize ?? size.value ?? hostSize.value) || 'default'
);

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
