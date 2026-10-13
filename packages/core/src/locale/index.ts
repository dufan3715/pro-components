/**
 * @module Core/Locale
 * @description 内置文案语言包（zh-CN / zh-TW / en-US）、语言名解析与 `{placeholder}` 替换
 */
import zhCN from './zh-CN';
import zhTW from './zh-TW';
import enUS from './en-US';

export { zhCN, zhTW, enUS };

/** 内置文案 key 集合（以 zh-CN 为基准，各语言包必须 key 对齐） */
export type ProLocaleKey = keyof typeof zhCN;

/** 单个语言包的形状：内置 key 全量覆盖，值为文案字符串 */
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
 * 将宿主 UI 库的语言名解析为内置语言名
 *
 * @description 兼容 `zh-cn` / `zh_TW` / `en-US` 等命名风格（大小写与分隔符不敏感），
 * 繁体（`zh-tw` / `zh-hk` / `zh-hant` 等）归 `zh-TW`，无法识别时回退 `zh-CN`。
 *
 * @param lang - 宿主语言名
 * @returns 内置语言名（`zh-CN` / `zh-TW` / `en-US`）
 */
export const resolveLocaleName = (lang?: string | null): ProLocaleName => {
  if (!lang) return 'zh-CN';
  const name = lang.toLowerCase();
  // 繁体判定须先于 zh 前缀判定（zh-tw / zh-hant 同样以 zh 开头）
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
 * @description 仅取 `params` 的自有属性；缺参时保留原样 `{key}`，无占位符时短路返回原文
 * @param text - 原始文案，如 `'共 {total} 条'`
 * @param params - 占位符参数，如 `{ total: 100 }`
 * @returns 替换后的文案
 */
export const format = (
  text: string,
  params?: Record<string, string | number>
): string => {
  if (!params || !text.includes('{')) return text;
  return text.replace(/\{(\w+)\}/g, (_, key) =>
    Object.prototype.hasOwnProperty.call(params, key)
      ? String(params[key])
      : `{${key}}`
  );
};
