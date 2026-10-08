/** 监听器形态：单个函数，或同名监听器合并后的函数数组 */
export type Listener =
  | ((...args: any[]) => void)
  | ((...args: any[]) => void)[];

/**
 * 派发监听器
 *
 * @description 兼容「函数或函数数组」两种形态：单个函数直接调用；数组按声明顺序逐个调用；
 * 未提供或非以上形态时不执行任何调用。
 *
 * @param listener - 监听器函数、监听器函数数组或未提供
 * @param args - 原样透传给监听器的参数
 */
export const dispatchListeners = (
  listener: Listener | undefined,
  ...args: any[]
): void => {
  if (typeof listener === 'function') {
    listener(...args);
    return;
  }
  if (Array.isArray(listener)) {
    listener.forEach(item => {
      if (typeof item === 'function') item(...args);
    });
  }
};
