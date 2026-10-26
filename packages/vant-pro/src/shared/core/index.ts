/**
 * 统一 re-export @qin-ui/pro-components-core，包内所有文件通过此文件引入 core 内容。
 */
export {
  // hooks
  useForm,
  createFormProxy,
  useTable,
  useFields,
  useFormData,
  useFormRef,
  useReactiveAttrs,
  // 字段标识
  resolveFieldIdentity,
  DEFAULT_FIELD_IDENTITY_KEYS,
  // 表格列归一
  normalizeColumn,
  normalizeColumns,
  // injection keys
  InjectionFormKey,
  InjectionFormSlotsKey,
  // utils
  getObject,
  omitBy,
  get,
  set,
  normalizePathKey,
  toPath,
  camelizeProperties,
  cloneDeep,
  pick,
  omit,
  isPlainObject,
  isObjectItem,
  isPromise,
  // locale
  localePacks,
  zhCN,
  zhTW,
  enUS,
  format,
  resolveLocaleName,
  type ProLocale,
  type ProLocaleName,
  type ProLocaleKey,
  // types
  type AdditionalMethods,
  type Data,
  type Path,
  type Paths,
  type KeyExpandString,
  type ExtendWithAny,
  type DeepPartial,
  type PageParam,
  type Fields,
  type Form,
  type Table,
  type UseFieldsReturn,
  type UseFormDataReturn,
  type UseFormRefReturn,
} from '@qin-ui/pro-components-core';
