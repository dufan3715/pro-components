// 统一 re-export @qin-ui/core，包内所有文件通过此文件引入 core 内容，
// 避免直接散列依赖 @qin-ui/core，便于将来统一维护。
export {
  // hooks
  useForm,
  useTable,
  useFields,
  useFormData,
  useFormRef,
  // injection keys
  InjectionFormKey,
  InjectionPathKey,
  // utils
  getObject,
  toPath,
  camelizeProperties,
  cloneDeep,
  omit,
  pick,
  isPlainObject,
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
} from '@qin-ui/core';
