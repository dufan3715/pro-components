/* eslint-disable no-unused-vars */
import { ref } from 'vue';
import { toPath } from 'lodash-es';
import type {
  Field,
  Fields,
  GetField,
  SetField,
  DeleteField,
  UseFields,
  GetFieldPath,
  AppendField,
  PrependField,
  GetParentFields,
} from '../types';

type UpdaterParam = {
  field: Field;
  fieldIndex: number;
  parentFields: Fields;
  fieldPath: string;
};
type Updater = (param: UpdaterParam) => void;

const useFields: UseFields = initFields => {
  const fields = ref(initFields);

  const updateField = (
    path: string,
    updater: Updater,
    fieldList: Fields = fields.value as any,
    parentPath = '',
    parentFieldPath = '',
    parsedPath = toPath(path).join('.')
  ): boolean => {
    if (!path) return false;
    for (let i = 0; i < fieldList.length; i += 1) {
      const field = fieldList[i];
      const { name, key = '' } = field;
      const concatPath =
        name ?? `${parentPath}${parentPath && key ? '.' : ''}${key}`;
      const selfPath = toPath(concatPath).join('.');
      if (parsedPath.includes('.') && !parsedPath.startsWith(selfPath))
        // eslint-disable-next-line no-continue
        continue;
      const fieldPath = `${parentFieldPath}[${i}]`;
      if (selfPath && selfPath === parsedPath) {
        updater({ field, fieldIndex: i, parentFields: fieldList, fieldPath });
        return true;
      }
      // prettier-ignore
      if (field.fields && updateField(path, updater, field.fields, selfPath, `${fieldPath}.fields`, parsedPath)) {
        return true;
      }
    }
    return false;
  };

  const getField: GetField = path => {
    if (!path) return undefined;
    let res;
    updateField(path, ({ field }) => {
      res = field;
    });
    return res;
  };

  const setField: SetField = (path, field, updateType = 'merge') => {
    if (!path) return;
    updateField(path, ({ field: preField, fieldIndex, parentFields }) => {
      let value = field;
      if (typeof field === 'function') {
        value = field(preField);
      }
      const newField =
        updateType === 'rewrite' ? value : { ...preField, ...value };
      // eslint-disable-next-line no-param-reassign
      parentFields[fieldIndex] = newField as Field;
    });
  };

  /**
   * @description 删除字段，或许你更应该使用setField(path, { hidden: true })来隐藏字段
   */
  const deleteField: DeleteField = path => {
    if (!path) return;
    updateField(path, ({ fieldIndex, parentFields }) => {
      parentFields.splice(fieldIndex, 1);
    });
  };

  const addField = (
    path: string | undefined,
    field: Field,
    placement: 'before' | 'after'
  ): void => {
    if (path) {
      updateField(path, ({ fieldIndex, parentFields }) => {
        const index = placement === 'after' ? fieldIndex + 1 : fieldIndex;
        parentFields.splice(index, 0, field);
      });
    } else if (placement === 'after') {
      fields.value.push(field as any);
    } else {
      fields.value.unshift(field as any);
    }
  };

  const appendField: AppendField = (path, field) => {
    addField(path, field, 'after');
  };

  const prependField: PrependField = (path, field) => {
    addField(path, field, 'before');
  };

  const getFieldPath: GetFieldPath = path => {
    if (!path) return undefined;
    let res;
    updateField(path, ({ fieldPath }) => {
      res = fieldPath;
    });
    return res;
  };

  const getParentFields: GetParentFields = path => {
    if (!path) return undefined;
    let res;
    updateField(path, ({ parentFields }) => {
      res = parentFields;
    });
    return res;
  };

  return {
    fields,
    getField,
    setField,
    deleteField,
    appendField,
    prependField,
    getFieldPath,
    getParentFields,
  } as any;
};

export default useFields;
