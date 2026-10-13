import type { Ref } from 'vue';
import { isRef, ref, toRaw, toValue } from 'vue';
import type { Data, Path } from '../shared/types';
import { get, normalizePathKey } from '../shared/path';
import { isObjectItem } from '../shared/utils';
import type { GroupMatch } from '../shared/internals';
import { applyByGroupDesc } from '../shared/internals';
import type {
  AdditionalMethods as AM,
  BaseField,
  FieldFindBy,
  FieldUpdater,
} from './types';

type UpdateFieldOptions = {
  all?: boolean;
};

type MapPathValue = Array<number | 'fields'>;

/** 字段活引用的只读视图：字段配置 + 宿主导出的额外方法（`Readonly` 仅为类型约定） */
export type FR<F, FormInstance> = Readonly<F & AM<FormInstance>>;

/** 字段标识键序：按顺序取第一个非 null / undefined 的值 */
export type FieldIdentityKeys = readonly string[];

/** 默认标识键序：宿主表单域标识键（name）优先，path 兜底 */
export const DEFAULT_FIELD_IDENTITY_KEYS: FieldIdentityKeys = ['name', 'path'];

/**
 * 解析字段标识
 *
 * @description 按 `keys` 顺序取字段配置上第一个非 null / undefined 的值，并归一化为路径键；
 * 字段配置的读写绑定、表单域标识与字段查找 API 共用本解析结果。
 *
 * @param field - 字段配置对象
 * @param keys - 标识键序，默认 `['name', 'path']`
 * @returns 归一化后的字段标识，无可用键时返回空串
 */
export const resolveFieldIdentity = (
  field: any,
  keys: FieldIdentityKeys = DEFAULT_FIELD_IDENTITY_KEYS
): string => {
  for (const key of keys) {
    const value = toValue(field?.[key]);
    if (value !== undefined && value !== null) return normalizePathKey(value);
  }
  return '';
};

/** useFields 选项 */
export interface UseFieldsOptions {
  /** 字段标识键序，默认 `['name', 'path']` */
  fieldIdentityKeys?: FieldIdentityKeys;
}

/**
 * useFields 返回值：字段配置数组与增删改查方法
 */
export interface UseFieldsReturn<
  D extends Data = Data,
  F extends BaseField<D> = BaseField<D>,
  FormInstance = any,
> {
  /** 字段配置数组（Vue ref） */
  fields: Ref<F[]>;

  /**
   * 获取字段配置（返回活引用，`Readonly` 仅为类型约定）
   *
   * @param path - 字段路径或查找函数
   * @param [options.all=false] - `true` 返回全部匹配的数组（无匹配为 `[]`）；默认返回第一个（无匹配为 `undefined`）
   * @returns 匹配到的字段配置
   */
  getField(path: Path<D> | FieldFindBy<D, F>): FR<F, FormInstance> | undefined;
  getField(
    path: Path<D> | FieldFindBy<D, F>,
    options?: { all?: false }
  ): FR<F, FormInstance> | undefined;
  getField(
    path: Path<D> | FieldFindBy<D, F>,
    options: { all: true }
  ): FR<F, FormInstance>[] | undefined;

  /**
   * 更新字段配置
   *
   * @param path - 字段路径或查找函数
   * @param field - 新配置或基于旧配置的更新函数（返回假值时跳过该次更新）
   * @param [options.updateType='merge'] - `merge` 合并 / `rewrite` 覆盖
   * @param [options.all] - 是否更新全部匹配（函数匹配默认 `true`，路径匹配默认 `false`）
   */
  setField(
    path: Path<D> | FieldFindBy<D, F>,
    field: F | ((preField: Readonly<F>) => F),
    options?: {
      updateType?: 'rewrite' | 'merge';
    } & UpdateFieldOptions
  ): void;

  /**
   * 删除字段配置
   *
   * @param path - 字段路径或查找函数
   * @param [options.all] - 是否删除全部匹配（函数匹配默认 `true`，路径匹配默认 `false`）
   */
  deleteField(
    path: Path<D> | FieldFindBy<D, F>,
    options?: UpdateFieldOptions
  ): void;

  /**
   * 在指定字段后追加字段
   *
   * @param path - 目标字段路径：`undefined` 追加到末尾，`''` 零命中不插入，数字路径按字符串归一比对（`0` 命中标识 `'0'` 的字段）
   * @param field - 字段配置或字段数组
   * @param [options.all] - 是否在所有匹配字段后追加（默认仅第一个）
   */
  appendField(
    path: Path<D> | FieldFindBy<D, F> | undefined,
    field: F | F[],
    options?: UpdateFieldOptions
  ): void;

  /**
   * 在指定字段前插入字段
   *
   * @param path - 目标字段路径：`undefined` 插入到开头，`''` 零命中不插入，数字路径按字符串归一比对
   * @param field - 字段配置或字段数组
   * @param [options.all] - 是否在所有匹配字段前插入（默认仅第一个）
   */
  prependField(
    path: Path<D> | FieldFindBy<D, F> | undefined,
    field: F | F[],
    options?: UpdateFieldOptions
  ): void;

  /**
   * 获取指定字段的父级字段（活引用）
   *
   * @param path - 子字段路径或查找函数
   * @param [options.all] - `true` 返回全部匹配的父级数组，默认返回第一个
   * @returns 父级字段；一级字段返回虚拟根容器 `{ fields }`，未匹配为 `undefined`
   */
  getParentField(
    path: Path<D> | FieldFindBy<D, F>
  ): FR<F, FormInstance> | undefined;
  /**
   * 获取父级字段（只返回第一个匹配）
   */
  getParentField(
    path: Path<D> | FieldFindBy<D, F>,
    options: { all?: false }
  ): FR<F, FormInstance> | undefined;
  /**
   * 获取所有匹配字段的父级字段
   */
  getParentField(
    path: Path<D> | FieldFindBy<D, F>,
    options: { all: true }
  ): FR<F, FormInstance>[] | undefined;
}

/**
 * 字段配置管理 Hook：按路径或查找函数定位字段，支持深层嵌套（`fields`）与增删改查
 *
 * @template D - 表单数据类型，用于路径类型推导
 * @template F - 字段配置类型，继承自 BaseField<D>
 * @template FormInstance - 底层 FormItem 组件实例类型
 *
 * @param {F[]} [initFields] - 初始字段配置；内部持浅拷贝（增删不改写传入数组），
 * 非数组入参回退空数组，数组内的非对象项在构造期剔除
 * @returns {UseFieldsReturn<D, F, FormInstance>} 字段配置数组与增删改查方法
 *
 * @example
 * ```ts
 * const { getField, setField, appendField } = useFields<User>([
 *   { path: 'name', label: '姓名' },
 *   { path: 'address', label: '地址', fields: [{ path: 'address.city', label: '城市' }] },
 * ])
 *
 * getField('address.city')              // 深层字段以完整点分路径检索
 * setField('name', { label: '用户名' }) // 合并更新
 * appendField('name', { path: 'email', label: '邮箱' })
 * ```
 */
const useFields = <
  D extends Data = Data,
  F extends BaseField<D> = BaseField<D>,
  FormInstance = any,
>(
  initFields?: F[],
  options?: UseFieldsOptions
): UseFieldsReturn<D, F, FormInstance> => {
  const fields = ref<F[]>([]) as Ref<F[]>;

  // 内部持浅拷贝：增删只作用于内部数组；非数组入参回退空数组，非对象项在构造期剔除
  fields.value = (Array.isArray(initFields) ? initFields : []).filter(
    isObjectItem
  ) as F[];

  const identityKeys =
    options?.fieldIdentityKeys ?? DEFAULT_FIELD_IDENTITY_KEYS;

  const _map = new Map<string, MapPathValue>();

  // 缓存快查：坐标直达后回验标识是否仍一致，失配即删条目并回退全量遍历
  const cacheMatch = (
    pathStr: string,
    updater: FieldUpdater<D, F>
  ): boolean => {
    const fieldPath = _map.get(pathStr) || [];
    if (fieldPath.length === 0) return false;
    const fieldIndex = fieldPath[fieldPath.length - 1] as number;
    const isRoot = fieldPath.length === 1;
    const parentField = isRoot
      ? ({ fields: fields.value } as any as F)
      : (get(fields.value, fieldPath.slice(0, -2)) as F);
    const field = parentField?.fields?.[fieldIndex] as F;
    const _path = field ? resolveFieldIdentity(field, identityKeys) : '';
    if (_path && _path === pathStr) {
      updater({ field, fieldIndex, parentField: parentField as F });
      return true;
    }
    _map.delete(pathStr);
    return false;
  };

  const updaterMatch = (
    path: Path<D> | FieldFindBy<D, F>,
    updater: FieldUpdater<D, F>,
    options: UpdateFieldOptions = {}
  ) => {
    if (path === undefined || path === null) return;
    const pathStr = typeof path === 'function' ? '' : normalizePathKey(path);
    const { all = typeof path === 'function' } = options;
    if (pathStr && _map.has(pathStr) && !all) {
      const bool = cacheMatch(pathStr, updater);
      if (bool) return;
    }
    // BFS 遍历顺带登记未缓存坐标；非 all 模式命中即返回（层序意义上的第一个匹配）
    const queue = fields.value.map((field, i) => ({
      field,
      fieldPath: [i] as MapPathValue,
      parentField: { fields: fields.value } as any as F,
    }));
    let cursor = 0;
    while (cursor < queue.length) {
      const { field, fieldPath, parentField } = queue[cursor++];
      let matched = false;
      const _path = resolveFieldIdentity(field, identityKeys);
      if (_path && !_map.has(_path)) {
        _map.set(_path, fieldPath);
      }
      if (typeof path === 'function') {
        matched = (path as FieldFindBy<D, F>)(field);
      } else if (_path) {
        matched = pathStr === _path;
      }
      if (matched) {
        const fieldIndex = fieldPath[fieldPath.length - 1] as number;
        updater({ field, fieldIndex, parentField });
        if (!all) return;
      }
      if (Array.isArray(field?.fields)) {
        field.fields.forEach((f, i) => {
          queue.push({
            field: f as F,
            fieldPath: [...fieldPath, 'fields', i],
            parentField: field,
          });
        });
      }
    }
  };

  /** 获取字段配置：`all` 未命中返回 `[]`，单数未命中返回 `undefined` */
  function getField(
    path: Path<D> | FieldFindBy<D, F>,
    options?: { all?: boolean }
  ) {
    if (path === undefined || path === null) return undefined;
    const res: any[] = [];
    updaterMatch(
      path,
      ({ field }) => {
        res.push(field);
      },
      options
    );
    return options?.all ? res : res[0];
  }

  /** 更新字段配置：`merge` 合并（返回假值跳过）/ `rewrite` 覆盖 */
  function setField(
    path: Path<D> | FieldFindBy<D, F>,
    field: F | ((preField: Readonly<F>) => F),
    options?: {
      updateType?: 'rewrite' | 'merge';
    } & UpdateFieldOptions
  ) {
    if (path === undefined || path === null) return;
    const { updateType = 'merge', ...rest } = options || {};
    updaterMatch(
      path,
      ({ field: preField, fieldIndex, parentField }) => {
        let value: any = field;
        if (typeof field === 'function') {
          value = field(preField);
        }
        if (!value) return;
        if (updateType === 'rewrite') {
          parentField.fields![fieldIndex] = value as F;
        } else {
          /*
           * 旧值为只读 ref 而新值不是 ref 时先 delete 再赋值，否则 reactive 会拦截该次赋值；
           * 旧值需经 toRaw 读取，避免 proxy 的 get 自动解包 ref
           */
          const rawTarget = toRaw(preField);
          for (const key of Object.keys(value)) {
            if (isRef((rawTarget as any)[key]) && !isRef((value as any)[key])) {
              delete (preField as any)[key];
            }
            (preField as any)[key] = (value as any)[key];
          }
        }
      },
      rest
    );
  }

  /** 删除字段配置：先收集匹配快照，再按组降序 splice */
  function deleteField(
    path: Path<D> | FieldFindBy<D, F>,
    options?: UpdateFieldOptions
  ) {
    if (path === undefined || path === null) return;
    // 两段式：先收集全部匹配快照，再按组降序 splice，多位点删除不错位
    const matches: GroupMatch<F>[] = [];
    updaterMatch(
      path,
      ({ fieldIndex, parentField }) => {
        matches.push({ group: parentField.fields!, index: fieldIndex });
      },
      options
    );
    applyByGroupDesc(matches, ({ group, index }) => {
      group.splice(index, 1);
    });
  }

  /** 在指定字段后追加字段（`path` 为 nullish 时追加到末尾） */
  function appendField(
    path: Path<D> | FieldFindBy<D, F> | undefined,
    field: F | F[],
    options?: UpdateFieldOptions
  ) {
    const newFields = Array.isArray(field) ? field : [field];
    addFields(path, newFields, options, 'after');
  }

  /** 在指定字段前插入字段（`path` 为 nullish 时插入到开头） */
  function prependField(
    path: Path<D> | FieldFindBy<D, F> | undefined,
    field: F | F[],
    options?: UpdateFieldOptions
  ) {
    const newFields = Array.isArray(field) ? field : [field];
    addFields(path, newFields, options, 'before');
  }

  /** 获取父级字段：嵌套字段返回真实父字段，一级字段返回虚拟根容器 */
  function getParentField(
    path: Path<D> | FieldFindBy<D, F>,
    options?: { all?: boolean }
  ) {
    if (path === undefined || path === null) return undefined;
    const res: F[] = [];
    updaterMatch(
      path,
      ({ parentField }) => {
        res.push(parentField);
      },
      options
    );
    return options?.all ? res : res[0];
  }

  function addFields(
    path: Path<D> | FieldFindBy<D, F> | undefined,
    newFields: F[],
    options?: UpdateFieldOptions,
    placement?: 'before' | 'after'
  ) {
    if (newFields.length === 0) return;
    if (path !== undefined && path !== null) {
      const matches: GroupMatch<F>[] = [];
      updaterMatch(
        path,
        ({ fieldIndex, parentField }) => {
          matches.push({ group: parentField.fields!, index: fieldIndex });
        },
        options
      );
      applyByGroupDesc(matches, ({ group, index }) => {
        const insertIndex = placement === 'after' ? index + 1 : index;
        // 多位点匹配时浅拷贝字段对象，单位点保持原引用
        group.splice(
          insertIndex,
          0,
          ...(matches.length > 1 ? newFields.map(f => ({ ...f })) : newFields)
        );
      });
    } else if (placement === 'after') {
      fields.value.push(...newFields);
    } else {
      fields.value.unshift(...newFields);
    }
  }

  type R = UseFieldsReturn<D, F, FormInstance>;

  return {
    fields,
    getField,
    setField,
    deleteField,
    appendField,
    prependField,
    getParentField: getParentField as R['getParentField'],
  };
};

export default useFields;
