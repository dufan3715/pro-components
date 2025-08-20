<script lang="ts" setup>
import { Dropdown, Menu, type TableProps } from '../../../shared/ui';
import ColumnHeightOutlined from './icons/ColumnHeightOutlined.vue';
import { useModel } from '../../../shared/hooks';
import { useAttrs } from 'vue';

type Size = TableProps['size'];

type Props = {} & /* @vue-ignore */ {
  size?: Size;
};
defineProps<Props>();

const attrs = useAttrs();

// eslint-disable-next-line vue/no-dupe-keys
const size = useModel<Size>(attrs, 'size', { default: 'large' });

const onSizeChange = (val: any) => {
  size.value = val.key;
};

const sizeOptions: Array<{ label: string; key: Size }> = [
  { label: '默认', key: 'large' },
  { label: '中等', key: 'middle' },
  { label: '紧凑', key: 'small' },
];
</script>

<template>
  <Dropdown arrow placement="bottomRight">
    <div class="control-icon">
      <ColumnHeightOutlined style="font-size: 16px" />
    </div>
    <template #overlay>
      <Menu
        style="width: 100px; text-align: center"
        :selected-keys="size ? [size] : []"
        :items="sizeOptions as any"
        @click="onSizeChange"
      >
      </Menu>
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
