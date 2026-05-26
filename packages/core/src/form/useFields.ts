import { Ref, ref } from 'vue';
import { Data, Path } from '../shared/types';
import { get, toPath } from '../shared/utils';
import {
  AdditionalMethods as AM,
  BaseField,
  FieldFindBy,
  FieldUpdater,
} from './types';

type UpdateFieldOptions = {
  all?: boolean;
};

type MapPathValue = Array<number | 'fields'>;

/**
 * 字段配置管理 Hook
 *
 * @description 提供对字段配置数组的增删改查操作，支持：
 * - 通过路径字符串或查找函数定位字段
 * - 深层嵌套字段的遍历和匹配
 * - 字段配置的合并/覆盖更新
 * - 字段的添加、插入、删除
 * - 父级字段查找
 *
 * @template D - 表单数据类型，用于路径类型推导
 * @template F - 字段配置类型，继承自 BaseField<D>
 * @template FormInstance - 底层 FormItem 组件实例类型
 *
 * @param {F[]} [initFields] - 初始字段配置数组
 *
 * @returns {object} 字段操作对象
 * @returns {Ref<F[]>} .fields - 字段配置数组（响应式）
 * @returns {Function} .getField(path) - 获取字段配置
 * @returns {Function} .setField(path, field) - 更新字段配置
 * @returns {Function} .deleteField(path) - 删除字段
 * @returns {Function} .appendField(path, field) - 在指定字段后追加
 * @returns {Function} .prependField(path, field) - 在指定字段前插入
 * @returns {Function} .getParentField(path) - 获取父级字段
 *
 * @example
 * ```ts
 * interface User { name: string; age: number; address: { city: string } }
 *
 * const { fields, getField, setField, deleteField } = useFields<User>([
 *   { path: 'name', label: '姓名', component: 'input' },
 *   { path: 'age', label: '年龄', component: 'input-number' },
 *   {
 *     path: 'address',
 *     label: '地址',
 *     fields: [
 *       { path: 'city', label: '城市' },
 *     ],
 *   },
 * ])
 *
 * // 通过路径获取字段
 * getField('name') // { path: 'name', label: '姓名', ... }
 * getField('address.city') // { path: 'city', label: '城市', ... }
 *
 * // 通过查找函数获取字段
 * getField(f => f.label === '姓名')
 *
 * // 更新字段（合并模式）
 * setField('name', { label: '用户名' })
 *
 * // 删除字段
 * deleteField('age')
 *
 * // 追加/插入字段
 * appendField('name', { path: 'email', label: '邮箱', component: 'input' })
 * prependField('name', { path: 'id', label: 'ID', component: 'input' })
 * ```
 */
const useFields = <
  D extends Data = Data,
  F extends BaseField<D> = BaseField<D>,
  FormInstance = any,
>(
  initFields?: F[]
) => {
  const fields = ref<F[]>([]) as Ref<F[]>;

  fields.value = initFields || [];

  const _map = new Map<string, MapPathValue>();

  const cacheMatch = (
    pathStr: string,
    updater: FieldUpdater<D, F>
  ): boolean => {
    const fieldPath = _map.get(pathStr) || [];
    if (fieldPath.length === 0) return false;
    const fieldIndex = fieldPath[fieldPath.length - 1] as number;
    const parentField =
      fieldPath.length === 1
        ? (fields.value as any)
        : get(fields.value, fieldPath.slice(0, -2));
    const field = parentField?.fields?.[fieldIndex] as F;
    const _path = toPath(field?.name ?? (field?.path as string)).join('.');
    if (_path === pathStr) {
      updater({ field, fieldIndex, parentField: parentField as F });
      return true;
    }
    return false;
  };

  const updaterMatch = (
    path: Path<D> | FieldFindBy<D, F>,
    updater: FieldUpdater<D, F>,
    options: UpdateFieldOptions = {}
  ) => {
    if (!path) return;
    const pathStr = typeof path === 'function' ? '' : toPath(path).join('.');
    const { all = typeof path === 'function' } = options;
    if (pathStr && _map.has(pathStr) && !all) {
      const bool = cacheMatch(pathStr, updater);
      if (bool) return;
    }
    const queue = fields.value.map((field, i) => ({
      field,
      fieldPath: [i] as MapPathValue,
      parentField: { fields: fields.value } as any as F,
    }));
    while (queue.length) {
      const { field, fieldPath, parentField } = queue.shift()!;
      let matched = false;
      const _path = toPath(field.name ?? (field.path as string)).join('.');
      if (_path) _map.set(_path, fieldPath);
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
      if (Array.isArray(field.fields)) {
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

  type FR = Readonly<F & AM<FormInstance>>;

  /**
   * 根据路径或查找函数获取字段配置
   *
   * @param {Path<D> | FieldFindBy<D, F>} path - 字段路径字符串或查找函数
   * @returns {FR | undefined} 匹配到的字段配置（只读），未找到返回 undefined
   *
   * @example
   * ```ts
   * // 通过路径
   * getField('name')
   * getField('address.city')
   *
   * // 通过查找函数
   * getField(f => f.label === '姓名')
   * ```
   */
  function getField(path: Path<D> | FieldFindBy<D, F>): FR | undefined;

  /**
   * 根据路径或查找函数获取字段配置（指定不匹配所有）
   *
   * @param path - 字段路径或查找函数
   * @param options - 选项，{ all: false } 表示只返回第一个匹配
   * @returns 匹配到的字段配置
   */
  function getField(
    path: Path<D> | FieldFindBy<D, F>,
    options?: { all?: false }
  ): FR | undefined;

  /**
   * 根据路径或查找函数获取所有匹配的字段配置
   *
   * @param path - 字段路径或查找函数
   * @param options - 选项，{ all: true } 表示返回所有匹配
   * @returns {FR[] | undefined} 所有匹配的字段配置数组
   *
   * @example
   * ```ts
   * // 查找所有 label 包含 '地址' 的字段
   * getField(f => f.label?.includes('地址'), { all: true })
   * ```
   */
  function getField(
    path: Path<D> | FieldFindBy<D, F>,
    options: { all: true }
  ): FR[] | undefined;

  function getField(
    path: Path<D> | FieldFindBy<D, F>,
    options?: { all?: boolean }
  ) {
    if (!path) return undefined;
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

  /**
   * 更新字段配置
   *
   * @param {Path<D> | FieldFindBy<D, F>} path - 要更新的字段路径或查找函数
   * @param {F | ((preField: Readonly<F>) => F)} field - 新的字段配置或更新函数
   * @param {object} [options] - 更新选项
   * @param {'rewrite' | 'merge'} [options.updateType='merge'] - 更新方式：merge 合并、rewrite 覆盖
   * @param {boolean} [options.all] - 是否更新所有匹配，默认只更新第一个
   *
   * @example
   * ```ts
   * // 合并更新
   * setField('name', { label: '用户名', disabled: true })
   *
   * // 覆盖更新
   * setField('name', { path: 'name', label: '用户名' }, { updateType: 'rewrite' })
   *
   * // 函数式更新
   * setField('name', prev => ({ ...prev, label: '新标签' }))
   *
   * // 批量更新所有匹配的字段
   * setField(f => f.disabled, { disabled: false }, { all: true })
   * ```
   */
  function setField(
    path: Path<D> | FieldFindBy<D, F>,
    field: F | ((preField: Readonly<F>) => F),
    options?: {
      updateType?: 'rewrite' | 'merge';
    } & UpdateFieldOptions
  ) {
    if (!path) return;
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
          Object.assign(preField, value);
        }
      },
      rest
    );
  }

  /**
   * 删除字段配置
   *
   * @param {Path<D> | FieldFindBy<D, F>} path - 要删除的字段路径或查找函数
   * @param {object} [options] - 删除选项
   * @param {boolean} [options.all] - 是否删除所有匹配，默认只删除第一个
   *
   * @example
   * ```ts
   * // 删除单个字段
   * deleteField('age')
   *
   * // 删除所有隐藏字段
   * deleteField(f => f.hidden, { all: true })
   * ```
   */
  function deleteField(
    path: Path<D> | FieldFindBy<D, F>,
    options?: UpdateFieldOptions
  ) {
    if (!path) return;
    updaterMatch(
      path,
      ({ fieldIndex, parentField }) => {
        parentField.fields!.splice(fieldIndex, 1);
      },
      options
    );
  }

  /**
   * 在指定字段后追加字段
   *
   * @param {Path<D> | FieldFindBy<D, F> | undefined} path - 目标字段路径，传 undefined 则在末尾追加
   * @param {F | F[]} field - 要追加的字段配置或字段数组
   * @param {object} [options] - 追加选项
   * @param {boolean} [options.all] - 是否在所有匹配字段后追加，默认只在第一个后追加
   *
   * @example
   * ```ts
   * // 在 name 字段后追加 email 字段
   * appendField('name', { path: 'email', label: '邮箱', component: 'input' })
   *
   * // 在末尾追加
   * appendField(undefined, { path: 'remark', label: '备注' })
   *
   * // 批量追加
   * appendField('name', [
   *   { path: 'email', label: '邮箱' },
   *   { path: 'phone', label: '电话' },
   * ])
   * ```
   */
  function appendField(
    path: Path<D> | FieldFindBy<D, F> | undefined,
    field: F | F[],
    options?: UpdateFieldOptions
  ) {
    const newFields = Array.isArray(field) ? field : [field];
    addFields(path, newFields, options, 'after');
  }

  /**
   * 在指定字段前插入字段
   *
   * @param {Path<D> | FieldFindBy<D, F> | undefined} path - 目标字段路径，传 undefined 则在开头插入
   * @param {F | F[]} field - 要插入的字段配置或字段数组
   * @param {object} [options] - 插入选项
   * @param {boolean} [options.all] - 是否在所有匹配字段前插入，默认只在第一个前插入
   *
   * @example
   * ```ts
   * // 在 name 字段前插入 id 字段
   * prependField('name', { path: 'id', label: 'ID', component: 'input' })
   *
   * // 在开头插入
   * prependField(undefined, { path: 'id', label: 'ID' })
   * ```
   */
  function prependField(
    path: Path<D> | FieldFindBy<D, F> | undefined,
    field: F | F[],
    options?: UpdateFieldOptions
  ) {
    const newFields = Array.isArray(field) ? field : [field];
    addFields(path, newFields, options, 'before');
  }

  /**
   * 获取指定字段的父级字段
   *
   * @param {Path<D> | FieldFindBy<D, F>} path - 子字段路径或查找函数
   * @returns {FR | undefined} 父级字段配置（只读），如果是一级字段则返回虚拟根容器
   *
   * @example
   * ```ts
   * // 假设字段结构：address -> { city, street }
   * getParentField('address.city')
   * // 返回 { path: 'address', label: '地址', fields: [...] }
   *
   * // 一级字段的 parent
   * getParentField('name')
   * // 返回虚拟根容器 { fields: [所有一级字段] }
   * ```
   */
  function getParentField(path: Path<D> | FieldFindBy<D, F>): FR | undefined;

  /**
   * 获取父级字段（只返回第一个匹配）
   */
  function getParentField(
    path: Path<D> | FieldFindBy<D, F>,
    options: { all?: false }
  ): FR | undefined;

  /**
   * 获取所有匹配字段的父级字段
   */
  function getParentField(
    path: Path<D> | FieldFindBy<D, F>,
    options: { all: true }
  ): FR[] | undefined;

  function getParentField(
    path: Path<D> | FieldFindBy<D, F>,
    options?: { all?: boolean }
  ) {
    if (!path) return undefined;
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
    if (path) {
      updaterMatch(
        path,
        ({ fieldIndex, parentField }) => {
          const index = placement === 'after' ? fieldIndex + 1 : fieldIndex;
          parentField.fields!.splice(index, 0, ...newFields);
        },
        options
      );
    } else if (placement === 'after') {
      fields.value.push(...newFields);
    } else {
      fields.value.unshift(...newFields);
    }
  }

  return {
    fields,
    getField,
    setField,
    deleteField,
    appendField,
    prependField,
    getParentField,
  };
};

export default useFields;
