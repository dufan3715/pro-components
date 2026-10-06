/**
 * 统一 re-export @qin-ui/pro-components-core，包内所有文件通过此文件引入 core 内容。
 */
export {
  // types
  type AdditionalMethods,
  // hooks
  useForm,
  createFormProxy,
  useTable,
  useSearchFormExpand,
  useFields,
  resolveFieldIdentity,
  DEFAULT_FIELD_IDENTITY_KEYS,
  useFormData,
  useFormRef,
  // injection keys
  InjectionFormKey,
  InjectionFormSlotsKey,
  // utils
  getObject,
  get,
  set,
  normalizePathKey,
  toPath,
  camelizeProperties,
  cloneDeep,
  pick,
  isPlainObject,
  isObjectItem,
  isPromise,
  // locale
  zhCN,
  zhTW,
  enUS,
  format,
  resolveLocaleName,
  type ProLocale,
  type ProLocaleName,
  type ProLocaleKey,
  // types
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
