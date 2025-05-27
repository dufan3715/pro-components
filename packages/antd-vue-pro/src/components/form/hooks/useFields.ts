import { ref, shallowReadonly } from 'vue';
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
  FindBy,
  UpdateFieldOptions,
} from '../types';

type UpdaterParam = {
  field: Readonly<Field>;
  fieldIndex: number;
  parentFields: Fields;
  fieldPath: string;
};
type Updater = (param: UpdaterParam) => void;

const useFields: UseFields = (initFields = []) => {
  const fields = ref();

  fields.value = initFields;

  const updateField = (
    path: string | FindBy,
    updater: Updater,
    options?: UpdateFieldOptions,
    fieldList: Fields = fields.value as any,
    parentPath = '',
    parentFieldPath = '',
    parsedPath = typeof path === 'function' ? '' : toPath(path).join('.')
  ): boolean => {
    if (!path) return false;
    const { all = false } = options || {};

    for (let i = 0; i < fieldList.length; i += 1) {
      const field = fieldList[i];
      const fieldPath = `${parentFieldPath}[${i}]`;
      let found = false;
      let selfPath = '';
      if (typeof path === 'function') {
        found = path(shallowReadonly(field));
      } else {
        const { name, key = '' } = field;
        const concatPath =
          name ?? `${parentPath}${parentPath && key ? '.' : ''}${key}`;
        selfPath = toPath(concatPath).join('.');
        found = !!selfPath && selfPath === parsedPath;
      }

      if (found) {
        updater({ field, fieldIndex: i, parentFields: fieldList, fieldPath });
        if (!all) return true;
      }

      if (parsedPath.includes('.') && !parsedPath.startsWith(selfPath)) {
        if (!all) continue;
      }

      // prettier-ignore
      if (Array.isArray(field.fields) && updateField(path, updater, options, field.fields, selfPath, `${fieldPath}.fields`, parsedPath)) {
        if (!all) return true;
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

  const setField: SetField = (path, field, options) => {
    if (!path || !field) return;
    const { updateType = 'merge', ...rest } = options || {};
    updateField(
      path,
      ({ field: preField, fieldIndex, parentFields }) => {
        let value = field;
        if (typeof field === 'function') {
          value = field(preField);
        }
        if (!value) return;
        const newField =
          updateType === 'rewrite' ? value : { ...preField, ...value };

        parentFields[fieldIndex] = newField as Field;
      },
      rest
    );
  };

  const deleteField: DeleteField = (path, options) => {
    if (!path) return;
    updateField(
      path,
      ({ fieldIndex, parentFields }) => {
        parentFields.splice(fieldIndex, 1);
      },
      options
    );
  };

  const addField = (
    path: string | undefined,
    field: Field,
    placement: 'before' | 'after'
  ): void => {
    if (!field) return;
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
  };
};

export default useFields;
