/* eslint-disable no-unused-vars, no-param-reassign */
import { computed, ref } from 'vue';
import { set } from 'lodash-es';
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
  GetParentField,
} from '../types';

type FieldMap = Record<string, { field: Field; fieldPath: string }>;

const generateFieldMap = (
  fields: Fields,
  prePath = '',
  preFieldPath = '',
  fieldMap: FieldMap = {}
) => {
  fields.forEach((field, index) => {
    let path;
    if (prePath) {
      path = field.key ? `${prePath}.${field.key}` : prePath;
    } else {
      path = field.key || '';
    }
    const fieldPath = `${preFieldPath || ''}[${index}]`;
    if (path && !fieldMap[path]) {
      fieldMap[path] = { field, fieldPath };
    }
    if (field.fields) {
      generateFieldMap(
        field.fields,
        path as string,
        `${fieldPath}.fields`,
        fieldMap
      );
    }
  });
  return fieldMap;
};

const useFields: UseFields = initFields => {
  const fields = ref(initFields);

  const fieldMap = computed<FieldMap>(() => {
    return generateFieldMap(fields.value as Fields);
  });

  const getField: GetField = path => {
    if (!path) return undefined;
    return fieldMap.value[path]?.field;
  };

  const getFieldPath: GetFieldPath = path => {
    if (!path) return undefined;
    return fieldMap.value[path]?.fieldPath;
  };

  const setField: SetField = (path, field, updateType = 'merge') => {
    const fieldPath = getFieldPath(path);
    if (!fieldPath) return;
    let value = field;
    const preField = getField(path);
    if (typeof field === 'function') {
      value = field(preField);
    }
    const newField =
      updateType === 'rewrite' ? value : { ...preField, ...value };
    set(fields.value, fieldPath, newField);
  };

  function findFieldIndex(path: string): number {
    const fieldPath = getFieldPath(path);
    if (!fieldPath) return -1;
    return +(
      fieldPath
        .split('.')
        .at(-1)
        ?.replaceAll(/.*\[(\d+)\]/g, '$1') || -1
    );
  }

  const getParentField: GetParentField = path => {
    if (!path) return undefined;
    const groupFieldPath = path.split('.').slice(0, -1).join('.');
    return getField(groupFieldPath);
  };

  const deleteField: DeleteField = path => {
    if (!path) return;
    const fieldIndex = findFieldIndex(path);
    const group = getParentField(path);
    const groupFields = group ? (group.fields as any) : fields.value;
    groupFields?.splice(fieldIndex, 1);
  };

  const addField = (
    path: string | undefined,
    field: Field,
    placement: 'before' | 'after'
  ): void => {
    if (path) {
      const fieldIndex = findFieldIndex(path);
      const group = getParentField(path);
      const groupFields = group ? (group.fields as any) : fields.value;
      const index = placement === 'after' ? fieldIndex + 1 : fieldIndex;
      groupFields.splice(index, 0, field);
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

  return {
    fields,
    getField,
    getParentField,
    setField,
    deleteField,
    getFieldPath,
    appendField,
    prependField,
  } as any;
};

export default useFields;
