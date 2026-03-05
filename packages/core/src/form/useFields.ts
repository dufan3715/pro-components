import { Ref, ref } from 'vue';
import { Data, Path } from '../shared/types';
import { get, toPath } from '../shared/utils';
import { BaseField, FieldFindBy, FieldUpdater } from './types';

type UpdateFieldOptions = {
  all?: boolean;
};

type MapPathValue = Array<number | 'fields'>;

const useFields = <
  D extends Data = Data,
  F extends BaseField<D> = BaseField<D>,
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

  function getField(path: Path<D> | FieldFindBy<D, F>): Readonly<F> | undefined;
  function getField(
    path: Path<D> | FieldFindBy<D, F>,
    options?: { all?: false }
  ): Readonly<F> | undefined;
  function getField(
    path: Path<D> | FieldFindBy<D, F>,
    options: { all: true }
  ): Readonly<F>[] | undefined;
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

  function appendField(
    path: Path<D> | FieldFindBy<D, F> | undefined,
    field: F | F[],
    options?: UpdateFieldOptions
  ) {
    const newFields = Array.isArray(field) ? field : [field];
    addFields(path, newFields, options, 'after');
  }

  function prependField(
    path: Path<D> | FieldFindBy<D, F> | undefined,
    field: F | F[],
    options?: UpdateFieldOptions
  ) {
    const newFields = Array.isArray(field) ? field : [field];
    addFields(path, newFields, options, 'before');
  }

  function getParentField(path: Path<D> | FieldFindBy<D, F>): F | undefined;
  function getParentField(
    path: Path<D> | FieldFindBy<D, F>,
    options: { all?: false }
  ): F | undefined;
  function getParentField(
    path: Path<D> | FieldFindBy<D, F>,
    options: { all: true }
  ): F[] | undefined;
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
