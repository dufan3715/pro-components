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

/**
 * 表格级共享省略 Tooltip
 *
 * @description
 * 在 ProTable 根节点上以事件委托识别带标记的 body 单元格，维护单个 Tooltip 的显隐、文本与固定定位锚点；
 * 仅在单元格文本横向溢出时触发；表格滚动、窗口尺寸变化、KeepAlive 停用时关闭，卸载时移除监听。
 *
 * @param rootRef - ProTable 根节点引用
 * @param enabled - 是否启用共享 Tooltip；为 false 时不注册全局监听
 * @param delay - 悬停延迟（ms），0 表示立即展示
 * @param leaveDelay - 移出延迟（ms），0 表示立即关闭
 * @returns Tooltip 状态与根节点事件处理器
 */
export function useEllipsisTooltip(
  rootRef: Ref<HTMLElement | null | undefined>,
  enabled: Ref<boolean>,
  delay: Ref<number>,
  leaveDelay: Ref<number>
): EllipsisTooltipState {
  const open = ref(false);
  const content = ref('');
  const anchorStyle = ref<EllipsisTooltipAnchorStyle>({
    ...ANCHOR_BASE_STYLE,
  });
  let activeCell: HTMLElement | null = null;
  let pendingCell: HTMLElement | null = null;
  let openTimer: ReturnType<typeof setTimeout> | null = null;
  let closeTimer: ReturnType<typeof setTimeout> | null = null;

  const clearOpenTimer = () => {
    if (openTimer === null) return;
    clearTimeout(openTimer);
    openTimer = null;
    pendingCell = null;
  };

  const clearCloseTimer = () => {
    if (closeTimer === null) return;
    clearTimeout(closeTimer);
    closeTimer = null;
  };

  const close = () => {
    clearOpenTimer();
    clearCloseTimer();
    open.value = false;
    activeCell = null;
  };

  const getEventRoot = (node: Node | null) => {
    const element = node instanceof Element ? node : node?.parentElement;
    return element?.closest?.(`[${PRO_TABLE_ROOT_ATTR}]`) ?? null;
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
    const rect = cell.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    content.value = measurement.text;
    anchorStyle.value = {
      ...ANCHOR_BASE_STYLE,
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    };
    pendingCell = cell;
    openTimer = setTimeout(
      () => {
        openTimer = null;
        pendingCell = null;
        if (!cell.isConnected) return;
        activeCell = cell;
        open.value = true;
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
