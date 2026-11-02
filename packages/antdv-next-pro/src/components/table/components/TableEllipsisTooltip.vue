<script setup lang="ts">
/**
 * 表格级共享省略 Tooltip
 *
 * @component TableEllipsisTooltip
 * @description 以固定定位锚点承载单个宿主 Tooltip，锚点位置由 ProTable 按悬停单元格更新；
 * 整个表格只渲染一个 Tooltip 实例，实例数量不随单元格数量增长。
 */
import { nextTick, ref, useAttrs, watch, type Component } from 'vue';
import { Tooltip as ATooltip } from '../../../shared/ui';
import type { EllipsisTooltipAnchorStyle } from '../hooks/useEllipsisTooltip';
import type { EllipsisTooltipConfig } from '../types';

defineOptions({ name: 'TableEllipsisTooltip', inheritAttrs: false });

type HostTooltipProps = Omit<
  EllipsisTooltipConfig,
  'getPopupContainer' | 'mouseEnterDelay' | 'mouseLeaveDelay'
>;

type Props = {
  open?: boolean;
  content?: string;
  anchorStyle?: EllipsisTooltipAnchorStyle;
  container?: () => HTMLElement | null | undefined;
} & /* @vue-ignore */ HostTooltipProps;

const props = withDefaults(defineProps<Props>(), {
  open: false,
  content: '',
  anchorStyle: () => ({
    position: 'fixed',
    pointerEvents: 'none',
    opacity: 0,
  }),
  container: () => undefined,
});
const attrs = useAttrs() as HostTooltipProps;
const HostTooltip = ATooltip as unknown as Component;

type TooltipInstance = {
  forceAlign?: () => void;
  forcePopupAlign?: () => void;
};

const tooltipRef = ref<TooltipInstance | null>(null);

/** 锚点或内容变化后重算宿主浮层位置 */
const forceAlign = async () => {
  if (!props.open) return;
  await nextTick();
  const instance = tooltipRef.value;
  (instance?.forceAlign ?? instance?.forcePopupAlign)?.();
};

watch(() => props.anchorStyle, forceAlign, { deep: true });
watch(
  () => props.open,
  value => {
    if (value) forceAlign();
  }
);

const getContainerNode = (): HTMLElement | undefined => {
  const container = props.container?.();
  if (container) return container;
  return typeof document !== 'undefined' ? document.body : undefined;
};

const getPopupContainer = () => getContainerNode() ?? document.body;
</script>

<template>
  <Teleport :to="getContainerNode() ?? 'body'">
    <HostTooltip
      v-bind="attrs"
      ref="tooltipRef"
      :open="open"
      :title="content"
      :trigger="[]"
      :get-popup-container="getPopupContainer"
    >
      <span
        class="pro-table_ellipsis-tooltip-anchor"
        :style="anchorStyle"
        aria-hidden="true"
      />
    </HostTooltip>
  </Teleport>
</template>
