<script setup lang="ts">
/**
 * 表格级共享省略 Tooltip
 *
 * @component TableEllipsisTooltip
 * @description 以固定定位锚点承载单个宿主 Tooltip，锚点位置由 ProTable 按悬停单元格更新；
 * 整个表格只渲染一个 Tooltip 实例，实例数量不随单元格数量增长。
 */
import {
  nextTick,
  onBeforeUnmount,
  ref,
  useAttrs,
  watch,
  type Component,
} from 'vue';
import { Tooltip as ATooltip } from '../../../shared/ui';
import {
  registerEllipsisTooltipOverlay,
  unregisterEllipsisTooltipOverlay,
  type EllipsisTooltipAnchorStyle,
} from '../hooks/useEllipsisTooltip';
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
  setOverlayElement?: (element: HTMLElement | null) => void;
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
  setOverlayElement: () => undefined,
});
const attrs = useAttrs() as HostTooltipProps;
const HostTooltip = ATooltip as unknown as Component;

type TooltipInstance = {
  forceAlign?: () => void;
  forcePopupAlign?: () => void;
  getPopupDomNode?: () => HTMLElement | undefined;
};

const tooltipRef = ref<TooltipInstance | null>(null);
let currentOverlay: HTMLElement | null = null;
let overlaySyncToken = 0;

const getContainerNode = (): HTMLElement | undefined => {
  const container = props.container?.();
  if (container) return container;
  return typeof document !== 'undefined' ? document.body : undefined;
};

/** 读取宿主 Tooltip 浮层节点 */
const getPopupElement = (): HTMLElement | null =>
  tooltipRef.value?.getPopupDomNode?.() ?? null;

/** 同步浮层节点引用与全局登记 */
const syncOverlayElement = (next: HTMLElement | null) => {
  if (currentOverlay === next) return;
  if (currentOverlay) unregisterEllipsisTooltipOverlay(currentOverlay);
  currentOverlay = next;
  props.setOverlayElement(next);
  if (next) registerEllipsisTooltipOverlay(next);
};

/** 浮层渲染后同步节点引用，宿主延迟挂载时重试 */
const syncOverlayFromDom = async () => {
  if (!props.open) return;
  const token = ++overlaySyncToken;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const popup = getPopupElement();
    if (popup) {
      if (token === overlaySyncToken) syncOverlayElement(popup);
      return;
    }
    if (!props.open) return;
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  if (token === overlaySyncToken) syncOverlayElement(null);
};

const clearOverlay = () => {
  overlaySyncToken += 1;
  syncOverlayElement(null);
};

/** 锚点或内容变化后重算宿主浮层位置 */
const forceAlign = async () => {
  if (!props.open) return;
  await nextTick();
  syncOverlayFromDom();
  const instance = tooltipRef.value;
  (instance?.forceAlign ?? instance?.forcePopupAlign)?.();
};

watch(() => props.anchorStyle, forceAlign, { deep: true });
watch(
  () => props.open,
  value => {
    if (value) {
      forceAlign();
    } else {
      clearOverlay();
    }
  }
);

onBeforeUnmount(clearOverlay);

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
