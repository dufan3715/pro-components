import { Ref, ref } from 'vue';
import type { Field, Fields, WithAdditionalMethodsGetter } from '../types';
import { Data, Path } from '../../../shared/types';
import { get, toPath } from '../../../shared/utils';

type UpdateFieldOptions = {
  /**
   * 是否更新\获取所有符合条件的字段，查找条件为函数时默认true, 否则默认false，为false时仅更新第一个匹配到的字段
   */
  all?: boolean;
};

type UpdaterParam<D extends Data> = {
  field: Readonly<Field<D>>;
  fieldIndex: number;
  parentField: Field<D>;
};
type Updater<D extends Data> = (param: UpdaterParam<D>) => void;

type FindBy<D extends Data> = (field: Readonly<Field<D>>) => boolean;

type MapPathValue = Array<number | 'fields'>;

/**
 * 表单字段配置处理hook
 * @param {Fields} initFields - 初始字段配置
 * @returns {Object}
 * @property {Ref<Fields>} fields - 字段配置Ref
 * @property {Function} setField - 设置字段配置
 * @property {Function} getField - 获取字段配置
 * @property {Function} deleteField - 删除字段配置
 * @property {Function} appendField - 追加字段配置
 * @property {Function} prependField - 插入字段配置
 * @property {Function} getParentField - 获取字段所属父级字段
 */
const useFields = <D extends Data = Data>(initFields?: Fields<D>) => {
  const fields: Ref<Fields<D>> = ref([]);

  fields.value = initFields || [];

  const _map = new Map<string, MapPathValue>();

  const cacheMatch = (pathStr: string, updater: Updater<D>): boolean => {
    const fieldPath = _map.get(pathStr) || [];
    if (fieldPath.length === 0) return false;
    const fieldIndex = fieldPath[fieldPath.length - 1] as number;
    const parentField: Field<D> =
      fieldPath.length === 1
        ? fields.value
        : get(fields.value, fieldPath.slice(0, -2));
    const field = parentField?.fields?.[fieldIndex] as Field<D>;
    const _path = toPath(field?.name ?? field?.path).join('.');
    if (_path === pathStr) {
      updater({ field, fieldIndex, parentField });
      return true;
    }
    return false;
  };

  const updaterMatch = (
    path: Path<D> | FindBy<D>,
    updater: Updater<D>,
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
      parentField: { fields: fields.value } as Field<D>,
    }));
    while (queue.length) {
      const { field, fieldPath, parentField } = queue.shift()!;
      let matched = false;
      const _path = toPath(field.name ?? field.path).join('.');
      if (_path) _map.set(_path, fieldPath);
      if (typeof path === 'function') {
        matched = (path as FindBy<D>)(field);
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
            field: f,
            fieldPath: [...fieldPath, 'fields', i],
            parentField: field,
          });
        });
      }
    }
  };

  /**
   * 获取字段配置
   * @param {Path<D> | FindBy<D>} path - 字段值路径或字段查找条件
   */
  function getField(
    path: Path<D> | FindBy<D>
  ): Readonly<WithAdditionalMethodsGetter<Field<D>>> | undefined;

  /**
   * 获取字段配置
   * @param {Path<D> | FindBy<D>} path - 字段值路径或字段查找条件
   * @param [options] - 配置项
   */
  function getField(
    path: Path<D> | FindBy<D>,
    options?: { all?: false }
  ): Readonly<WithAdditionalMethodsGetter<Field<D>>> | undefined;

  function getField(
    path: Path<D> | FindBy<D>,
    options: { all: true }
  ): Readonly<WithAdditionalMethodsGetter<Field<D>>>[] | undefined;

  function getField(path: Path<D> | FindBy<D>, options?: { all?: boolean }) {
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
   * 设置字段配置
   * @param {Path<D> | FindBy<D>} path - 字段值路径或字段查找条件
   * @param {Field<D>} field - 字段配置
   * @param [options] - 配置项
   */
  function setField(
    path: Path<D> | FindBy<D>,
    field: Field<D> | ((preField: Readonly<Field<D>>) => Field<D>),
    options?: {
      /**
       * 字段更新方式 rewrite替换重写，merge合并(默认)
       * @default 'merge'
       */
      updateType?: 'rewrite' | 'merge';
    } & UpdateFieldOptions
  ) {
    if (!path || !field) return;
    const { updateType = 'merge', ...rest } = options || {};
    updaterMatch(
      path,
      ({ field: preField, fieldIndex, parentField }) => {
        let value = field;
        if (typeof field === 'function') {
          value = field(preField);
        }
        if (!value) return;
        if (updateType === 'rewrite') {
          parentField.fields![fieldIndex] = value as Field<D>;
        } else {
          Object.assign(preField, value);
        }
      },
      rest
    );
  }

  /**
   * 删除字段配置
   * @param {Path<D> | FindBy<D>} path - 字段值路径或字段查找条件
   * @param {Options} [options] - 配置项
   */
  function deleteField(
    path: Path<D> | FindBy<D>,
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

  function addFields(
    path: Path<D> | FindBy<D> | undefined,
    newFields: Fields<D>,
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

  /**
   * 追加字段配置
   * @param {Path<D> | FindBy<D>} path - 字段值路径或字段查找条件
   * @param {Field<D>} field - 字段配置
   * @param [options] - 配置项
   */
  function appendField(
    path: Path<D> | FindBy<D> | undefined,
    field: Field<D> | Fields<D>,
    options?: UpdateFieldOptions
  ) {
    const newFields = Array.isArray(field) ? field : [field];
    addFields(path, newFields, options, 'after');
  }

  /**
   * 插入字段配置
   * @param {Path<D> | FindBy<D>} path - 字段值路径或字段查找条件
   * @param {Field<D>} field - 字段配置
   * @param [options] - 配置项
   */
  function prependField(
    path: Path<D> | FindBy<D> | undefined,
    field: Field<D> | Fields<D>,
    options?: UpdateFieldOptions
  ) {
    const newFields = Array.isArray(field) ? field : [field];
    addFields(path, newFields, options, 'before');
  }

  /**
   * 获取字段所属父级字段
   * @param {Path<D> | FindBy<D>} path - 字段路径或字段查找条件
   * @returns {Field<D> | undefined} 字段所属父级字段
   */
  function getParentField(path: Path<D> | FindBy<D>): Field<D> | undefined;

  /**
   * 获取字段所属父级字段
   * @param {Path<D> | FindBy<D>} path - 字段路径或字段查找条件
   * @param [options] - 配置项
   * @returns {Field<D> | undefined} 字段所属父级字段
   */
  function getParentField(
    path: Path<D> | FindBy<D>,
    options: { all?: false }
  ): Field<D> | undefined;

  function getParentField(
    path: Path<D> | FindBy<D>,
    options: { all: true }
  ): Field<D>[] | undefined;

  function getParentField(
    path: Path<D> | FindBy<D>,
    options?: { all?: boolean }
  ) {
    if (!path) return undefined;
    const res: Field<D>[] = [];
    updaterMatch(
      path,
      ({ parentField }) => {
        res.push(parentField);
      },
      options
    );
    return options?.all ? res : res[0];
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
