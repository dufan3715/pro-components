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
import { useModel } from '../../../shared/hooks';
import { useAttrs } from 'vue';

type Size = TableProps['size'];

type Props = {} & /* @vue-ignore */ {
  size?: Size;
};
defineProps<Props>();

const attrs = useAttrs();

const configContext = useConfigContextInject();

// eslint-disable-next-line vue/no-dupe-keys
const size = useModel<Size>(attrs, 'size', {
  default: configContext.componentSize?.value ?? 'large',
});

const onSizeChange = (val: any) => {
  size.value = val.key;
};

const sizeOptions: Array<MenuItemType> = [
  { label: '默认', key: 'large' },
  { label: '中等', key: 'middle' },
  { label: '紧凑', key: 'small' },
];
</script>

<template>
  <Dropdown arrow placement="bottomRight">
    <Button type="text" class="pro-table_size-control_button">
      <ColumnHeightOutlined />
    </Button>
    <template #overlay>
      <Menu
        style="width: 100px; text-align: center"
        :selected-keys="size ? [size] : []"
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
