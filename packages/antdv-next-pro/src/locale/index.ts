/**
 * antdv-next-pro locale 模块
 *
 * @description 提供 useLocale 组合式函数与语言包。
 * 语言自动跟随宿主应用的 antdv-next `ConfigProvider` locale 切换，
 * 也可通过 ProComponentProvider 的 `locale` prop 覆盖任意文案。
 */
import {
  computed,
  inject,
  toValue,
  type InjectionKey,
  type MaybeRef,
} from 'vue';
import {
  zhCN,
  zhTW,
  enUS,
  format,
  resolveLocaleName,
  type ProLocale,
  type ProLocaleName,
} from '../shared/core';
import { useConfig as useConfigContext } from 'antdv-next/dist/config-provider/context';

export { zhCN, zhTW, enUS };

export type { ProLocale };

/** ProComponentProvider 通过该 key 注入局部覆盖文案 */
export const LOCALE_INJECT_KEY: InjectionKey<
  MaybeRef<Partial<ProLocale> | undefined>
> = Symbol('pro-locale');

/**
 * 获取响应式 locale 文案
 *
 * @description 返回 `t` 翻译函数与当前语言名。
 * `t` 在 computed / 模板中调用时会随宿主语言切换自动更新。
 *
 * @returns
 * - `t(key, params?)` - 翻译函数，支持 `{placeholder}` 参数
 * - `lang` - 当前解析出的语言名（'zh-CN' | 'zh-TW' | 'en-US'）
 *
 * @example
 * ```ts
 * const { t } = useLocale();
 * t('table.query') // '查询' / '查詢' / 'Search'
 * t('pagination.total', { total: 100 }) // '共 100 条'
 * ```
 */
export const useLocale = () => {
  const config = useConfigContext();
  const override = inject(LOCALE_INJECT_KEY, undefined);

  const lang = computed<ProLocaleName>(() =>
    resolveLocaleName(config.value?.locale?.locale)
  );
  const pack = computed<Record<string, string>>(() =>
    lang.value === 'zh-TW' ? zhTW : lang.value === 'en-US' ? enUS : zhCN
  );

  const t = (key: string, params?: Record<string, string | number>): string => {
    const overrides = toValue(override) as Record<string, string> | undefined;
    const text =
      overrides?.[key] ?? (pack.value as Record<string, string>)[key] ?? key;
    return format(text, params);
  };

  return { t, lang };
};
