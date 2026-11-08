import {
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  watch,
  type Ref,
} from 'vue';

/** 省略单元格标记属性，由列转换写入 body 单元格 */
export const ELLIPSIS_TOOLTIP_CELL_ATTR = 'data-pro-table-ellipsis';

/** ProTable 根节点归属标记 */
export const PRO_TABLE_ROOT_ATTR = 'data-pro-table-root';

/** 当前打开中的省略 Tooltip 浮层 */
const activeOverlays = new Set<HTMLElement>();

/** 登记省略 Tooltip 浮层 */
export const registerEllipsisTooltipOverlay = (overlay: HTMLElement) => {
  activeOverlays.add(overlay);
};

/** 注销省略 Tooltip 浮层 */
export const unregisterEllipsisTooltipOverlay = (overlay: HTMLElement) => {
  activeOverlays.delete(overlay);
};

/** 共享 Tooltip 锚点样式 */
export type EllipsisTooltipAnchorStyle = {
  position: 'fixed';
  pointerEvents: 'none';
  opacity: number;
  left?: string;
  top?: string;
  width?: string;
  height?: string;
};

/** 共享 Tooltip 状态与事件处理器 */
export type EllipsisTooltipState = {
  /** Tooltip 是否展示 */
  open: Ref<boolean>;
  /** Tooltip 文本 */
  content: Ref<string>;
  /** 固定定位锚点样式 */
  anchorStyle: Ref<EllipsisTooltipAnchorStyle>;
  /** 根节点 mouseover 处理器 */
  onMouseOver: (event: MouseEvent) => void;
  /** 根节点 mouseout 处理器 */
  onMouseOut: (event: MouseEvent) => void;
  /** 关闭 Tooltip */
  close: () => void;
};

/** 共享 Tooltip 锚点的基础样式：固定定位，不参与命中测试与绘制 */
const ANCHOR_BASE_STYLE: EllipsisTooltipAnchorStyle = {
  position: 'fixed',
  pointerEvents: 'none',
  opacity: 0,
};

/** 读取单元格可读文本，连续空白折叠为单个空格 */
const getCellText = (cell: HTMLElement) => {
  const text = cell.innerText || cell.textContent || '';
  return text.replace(/\s+/g, ' ').trim();
};

/** 单元格测量结果：文本与是否横向溢出 */
type CellMeasurement = {
  text: string;
  overflow: boolean;
};

/** 单次读取单元格文本并判断横向溢出 */
const measureCell = (cell: HTMLElement): CellMeasurement => {
  const text = getCellText(cell);
  return {
    text,
    overflow: Boolean(text) && cell.scrollWidth > cell.clientWidth,
  };
};

/** 单元格内容盒矩形 */
type ContentRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/** 解析计算样式中的像素长度，非法值按 0 处理 */
const toPixel = (value: string) => Number.parseFloat(value) || 0;

/** 读取单元格内容盒矩形：扣除边框与内边距 */
const measureContentRect = (cell: HTMLElement): ContentRect => {
  const rect = cell.getBoundingClientRect();
  const style = getComputedStyle(cell);
  const insetLeft = toPixel(style.borderLeftWidth) + toPixel(style.paddingLeft);
  const insetTop = toPixel(style.borderTopWidth) + toPixel(style.paddingTop);
  const insetRight =
    toPixel(style.borderRightWidth) + toPixel(style.paddingRight);
  const insetBottom =
    toPixel(style.borderBottomWidth) + toPixel(style.paddingBottom);

  return {
    left: rect.left + insetLeft,
    top: rect.top + insetTop,
    width: Math.max(0, rect.width - insetLeft - insetRight),
    height: Math.max(0, rect.height - insetTop - insetBottom),
  };
};

/** 读取单元格文本行矩形并裁剪到内容盒，文本行不可用时回退内容盒 */
const measureTextRect = (
  cell: HTMLElement,
  content: ContentRect
): ContentRect => {
  if (
    typeof document === 'undefined' ||
    typeof document.createRange !== 'function'
  ) {
    return content;
  }
  const range = document.createRange();
  range.selectNodeContents(cell);
  const rect = range.getBoundingClientRect();
  if (!rect.width || !rect.height) return content;
  const left = Math.max(rect.left, content.left);
  const top = Math.max(rect.top, content.top);
  const right = Math.min(rect.right, content.left + content.width);
  const bottom = Math.min(rect.bottom, content.top + content.height);
  if (right <= left || bottom <= top) return content;
  return {
    left,
    top,
    width: right - left,
    height: bottom - top,
  };
};

/**
 * 表格级共享省略 Tooltip
 *
 * @description
 * 在 ProTable 根节点上以事件委托识别带标记的 body 单元格，维护单个 Tooltip 的显隐、文本与按单元格文本行矩形计算的固定定位锚点，文本行矩形不可用时回退单元格内容盒；
 * 仅在单元格文本横向溢出时触发；鼠标移入浮层时保持展示，移出浮层后按离开延迟关闭；
 * 表格滚动、窗口尺寸变化、KeepAlive 停用时关闭，卸载时移除监听。
 *
 * @param rootRef - ProTable 根节点引用
 * @param enabled - 是否启用共享 Tooltip；为 false 时不注册全局监听
 * @param delay - 悬停延迟（ms），0 表示立即展示
 * @param leaveDelay - 移出延迟（ms），0 表示立即关闭
 * @param overlayElement - 当前 Tooltip 浮层节点引用
 * @returns Tooltip 状态与根节点事件处理器
 */
export function useEllipsisTooltip(
  rootRef: Ref<HTMLElement | null | undefined>,
  enabled: Ref<boolean>,
  delay: Ref<number>,
  leaveDelay: Ref<number>,
  overlayElement: Ref<HTMLElement | null | undefined>
): EllipsisTooltipState {
  const open = ref(false);
  const content = ref('');
  const anchorStyle = ref<EllipsisTooltipAnchorStyle>({
    ...ANCHOR_BASE_STYLE,
  });
  let activeCell: HTMLElement | null = null;
  let pendingCell: HTMLElement | null = null;
  let pendingContent = '';
  let pendingRect: ContentRect | null = null;
  let openTimer: ReturnType<typeof setTimeout> | null = null;
  let closeTimer: ReturnType<typeof setTimeout> | null = null;

  const clearOpenTimer = () => {
    pendingCell = null;
    pendingContent = '';
    pendingRect = null;
    if (openTimer === null) return;
    clearTimeout(openTimer);
    openTimer = null;
  };

  const clearCloseTimer = () => {
    if (closeTimer === null) return;
    clearTimeout(closeTimer);
    closeTimer = null;
  };

  const getEventRoot = (node: Node | null) => {
    const element = node instanceof Element ? node : node?.parentElement;
    return element?.closest?.(`[${PRO_TABLE_ROOT_ATTR}]`) ?? null;
  };

  const close = () => {
    clearOpenTimer();
    clearCloseTimer();
    open.value = false;
    activeCell = null;
    removeOverlayListeners();
  };

  const scheduleClose = () => {
    clearCloseTimer();
    const delayMs = Math.max(0, leaveDelay.value);
    if (delayMs === 0) {
      close();
      return;
    }
    closeTimer = setTimeout(() => {
      closeTimer = null;
      close();
    }, delayMs);
  };

  const isOverlayNode = (node: EventTarget | null) => {
    const overlay = overlayElement.value;
    return Boolean(overlay && node instanceof Node && overlay.contains(node));
  };

  const isForeignOverlayNode = (node: EventTarget | null) => {
    if (!(node instanceof Node)) return false;
    const own = overlayElement.value;
    for (const overlay of activeOverlays) {
      if (overlay !== own && overlay.contains(node)) return true;
    }
    return false;
  };

  const onOverlayMouseOver = (event: MouseEvent) => {
    if (!isOverlayNode(event.target)) return;
    clearCloseTimer();
  };

  const onOverlayMouseOut = (event: MouseEvent) => {
    if (!isOverlayNode(event.target)) return;
    const related = event.relatedTarget;
    if (isOverlayNode(related)) return;
    if (isForeignOverlayNode(related)) {
      close();
      return;
    }
    if (activeCell && related instanceof Node && activeCell.contains(related)) {
      const relatedRoot = getEventRoot(related);
      if (!relatedRoot || relatedRoot === rootRef.value) return;
      close();
      return;
    }
    scheduleClose();
  };

  let overlayListening = false;

  const addOverlayListeners = () => {
    if (overlayListening || typeof document === 'undefined') return;
    overlayListening = true;
    document.addEventListener('mouseover', onOverlayMouseOver);
    document.addEventListener('mouseout', onOverlayMouseOut);
  };

  const removeOverlayListeners = () => {
    if (!overlayListening) return;
    overlayListening = false;
    document.removeEventListener('mouseover', onOverlayMouseOver);
    document.removeEventListener('mouseout', onOverlayMouseOut);
  };

  const getCellFromEvent = (event: MouseEvent) => {
    const target = event.target as Element | null;
    const cell = target?.closest?.(`[${ELLIPSIS_TOOLTIP_CELL_ATTR}]`);
    if (!(cell instanceof HTMLElement)) return null;
    const root = rootRef.value;
    if (!root) return null;
    if (cell.closest(`[${PRO_TABLE_ROOT_ATTR}]`) !== root) return null;
    return cell;
  };

  const onMouseOver = (event: MouseEvent) => {
    const cell = getCellFromEvent(event);
    if (!cell) return;
    clearCloseTimer();
    if (cell === activeCell || cell === pendingCell) return;
    close();
    const measurement = measureCell(cell);
    if (!measurement.overflow) return;
    const contentRect = measureContentRect(cell);
    if (!contentRect.width || !contentRect.height) return;
    const rect = measureTextRect(cell, contentRect);
    pendingContent = measurement.text;
    pendingRect = rect;
    pendingCell = cell;
    openTimer = setTimeout(
      () => {
        openTimer = null;
        pendingCell = null;
        const anchorRect = pendingRect;
        const nextContent = pendingContent;
        pendingContent = '';
        pendingRect = null;
        if (!cell.isConnected || !anchorRect) return;
        content.value = nextContent;
        anchorStyle.value = {
          ...ANCHOR_BASE_STYLE,
          left: `${anchorRect.left}px`,
          top: `${anchorRect.top}px`,
          width: `${anchorRect.width}px`,
          height: `${anchorRect.height}px`,
        };
        activeCell = cell;
        open.value = true;
        addOverlayListeners();
      },
      Math.max(0, delay.value)
    );
  };

  const onMouseOut = (event: MouseEvent) => {
    if (!activeCell && !pendingCell) return;

    const owner = activeCell ?? pendingCell;
    const target = event.target as Node | null;
    if (!owner || !target || !owner.contains(target)) return;

    const related = event.relatedTarget as Node | null;
    if (isOverlayNode(related)) return;
    if (isForeignOverlayNode(related)) {
      close();
      return;
    }
    if (related && owner.contains(related)) {
      const relatedRoot = getEventRoot(related);
      if (!relatedRoot || relatedRoot === rootRef.value) return;
      close();
      return;
    }

    if (pendingCell) {
      close();
      return;
    }

    scheduleClose();
  };

  const onViewportChange = () => close();
  let listening = false;

  const addViewportListeners = () => {
    if (listening || typeof window === 'undefined') return;
    listening = true;
    window.addEventListener('scroll', onViewportChange, true);
    window.addEventListener('resize', onViewportChange);
  };

  const removeViewportListeners = () => {
    if (!listening) return;
    listening = false;
    window.removeEventListener('scroll', onViewportChange, true);
    window.removeEventListener('resize', onViewportChange);
  };

  onDeactivated(close);

  onMounted(() => {
    if (enabled.value) addViewportListeners();
  });

  watch(enabled, value => {
    if (value) {
      addViewportListeners();
    } else {
      removeViewportListeners();
      close();
    }
  });

  onBeforeUnmount(() => {
    removeViewportListeners();
    removeOverlayListeners();
    clearOpenTimer();
    clearCloseTimer();
  });

  return {
    open,
    content,
    anchorStyle,
    onMouseOver,
    onMouseOut,
    close,
  };
}
