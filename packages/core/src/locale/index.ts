/**
 * locale 核心模块
 *
 * @description 提供 pro-components 内置文案的语言包（zh-CN / zh-TW / en-US）
 * 与占位符替换工具。各 UI 包的 useLocale 组合式函数基于此实现语言检测与切换。
 */
import zhCN from './zh-CN';
import zhTW from './zh-TW';
import enUS from './en-US';

export { zhCN, zhTW, enUS };

/** 内置文案 key 集合（以 zh-CN 为基准，各语言包必须 key 对齐） */
export type ProLocaleKey = keyof typeof zhCN;

export type ProLocale = Record<ProLocaleKey, string>;

/** 内置语言名 */
export type ProLocaleName = 'zh-CN' | 'zh-TW' | 'en-US';

/** 语言包集合，key 为语言名 */
export const localePacks: Record<ProLocaleName, ProLocale> = {
  'zh-CN': zhCN,
  'zh-TW': zhTW,
  'en-US': enUS,
};

/**
 * 根据宿主 UI 库的语言名解析为内置语言名
 *
 * @description 兼容各底层库不同的语言命名风格（如 antd 的 `zh-cn`、
 * element-plus 的 `zh-tw`、vant 的 `zh-TW` 等），无法识别时回退到 zh-CN。
 *
 * @param lang - 宿主 UI 库的语言名，如 `'zh-cn'`、`'zh_TW'`、`'en-US'`
 * @returns 内置语言名
 *
 * @example
 * ```ts
 * resolveLocaleName('zh-cn') // 'zh-CN'
 * resolveLocaleName('zh-tw') // 'zh-TW'
 * resolveLocaleName('en')    // 'en-US'
 * resolveLocaleName('fr')    // 'zh-CN'
 * ```
 */
export const resolveLocaleName = (lang?: string | null): ProLocaleName => {
  if (!lang) return 'zh-CN';
  const name = lang.toLowerCase();
  // 繁体判定先于 zh 前缀判定：zh-hant / zh-tw 系同样以 zh 开头，顺序颠倒会误归简体
  const isTraditional =
    name.startsWith('zh-tw') ||
    name.startsWith('zh_tw') ||
    name === 'zhtw' ||
    name.startsWith('zh-hk') ||
    name.startsWith('zh_hk') ||
    name.startsWith('zh-mo') ||
    name.startsWith('zh_mo') ||
    name.startsWith('zh-hant') ||
    name.startsWith('zh_hant');
  if (isTraditional) return 'zh-TW';
  if (name.startsWith('zh')) return 'zh-CN';
  if (name.startsWith('en')) return 'en-US';
  return 'zh-CN';
};

/**
 * 替换文案中的 `{placeholder}` 占位符
 *
 * @param text - 原始文案，如 `'共 {total} 条'`
 * @param params - 占位符参数，如 `{ total: 100 }`
 * @returns 替换后的文案
 *
 * @example
 * ```ts
 * format('共 {total} 条', { total: 100 }) // '共 100 条'
 * ```
 */
export const format = (
  text: string,
  params?: Record<string, string | number>
): string => {
  if (!params || !text.includes('{')) return text;
  return text.replace(/\{(\w+)\}/g, (_, key) =>
    key in params ? String(params[key]) : `{${key}}`
  );
};
