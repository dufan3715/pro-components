import { describe, it, expect } from 'vitest';
import { defineComponent, h, markRaw, onBeforeUnmount } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import ProForm from '../src/components/form/components/ProForm/index.vue';
import { useForm } from '../src/components/form/hooks/useForm';
import {
  getFieldDataKey,
  getFieldKey,
} from '../src/components/form/utils/fieldKey';

describe('数据行渲染 key', () => {
  // ----------------------------------------------------
  // FK-B1: 同一数据行对象在数组索引变化后保持同一 key
  // ----------------------------------------------------
  it('FK-B1: 行对象身份跨索引稳定，不同行对象得到不同 key', () => {
    const rowA = { id: 'a' };
    const rowB = { id: 'b' };
    const before = { rows: [rowA, rowB] };
    const afterDelete = { rows: [rowB] };

    const keyA = getFieldDataKey({ path: 'rows.0.name' }, before);
    const keyBBefore = getFieldDataKey({ path: 'rows.1.name' }, before);
    const keyBAfter = getFieldDataKey({ path: 'rows.0.name' }, afterDelete);

    expect(typeof keyA).toBe('string');
    expect(keyBBefore).toBe(keyBAfter);
    expect(keyA).not.toBe(keyBBefore);
  });

  // ----------------------------------------------------
  // FK-B2: 嵌套数组拼接多级行身份与剩余路径
  // ----------------------------------------------------
  it('FK-B2: 嵌套对象数组合并多级行身份与行内剩余路径', () => {
    const item = { id: 'i' };
    const group = { id: 'g', items: [item] };
    const raw = { groups: [group] };

    const key = getFieldDataKey({ path: 'groups.0.items.0.label' }, raw);
    expect(typeof key).toBe('string');
    expect(key).toContain('label');
    // 同一行对象、不同索引仍稳定
    expect(getFieldDataKey({ path: 'groups.0.items.0.label' }, raw)).toBe(key);
  });

  // ----------------------------------------------------
  // FK-B3: 无法定位对象行时回退字段对象身份
  // ----------------------------------------------------
  it('FK-B3: 原始值数组 / 无路径 / 数据缺失回退字段对象身份', () => {
    const primitiveField = { path: 'tags.0' };
    expect(getFieldDataKey(primitiveField, { tags: ['a', 'b'] })).toBe(
      getFieldKey(primitiveField)
    );

    const noPathField = { label: '无路径字段' };
    expect(getFieldDataKey(noPathField, { rows: [{}] })).toBe(
      getFieldKey(noPathField)
    );

    const missingField = { path: 'rows.0.name' };
    expect(getFieldDataKey(missingField, { rows: [] })).toBe(
      getFieldKey(missingField)
    );
  });

  // ----------------------------------------------------
  // FK-B4: 重复行引用得到相同基础 key，由列表层收敛
  // ----------------------------------------------------
  it('FK-B4: 同一行对象重复引用时基础 key 相同', () => {
    const row = { id: 'dup' };
    const raw = { rows: [row, row] };
    expect(getFieldDataKey({ path: 'rows.0.name' }, raw)).toBe(
      getFieldDataKey({ path: 'rows.1.name' }, raw)
    );
  });

  // ----------------------------------------------------
  // FK-B5: 动态数组增删 / 重排不重挂已有行
  // ----------------------------------------------------
  it('FK-B5 [判别]: 追加、删除、重排行时已有行实例不重挂，旧字段访问器被清理', async () => {
    const stats = new Map<string, { mounts: number; unmounts: number }>();
    const probes = new Map<string, any>();

    const probeFor = (id: string) => {
      const cached = probes.get(id);
      if (cached) return cached;
      const entry = { mounts: 0, unmounts: 0 };
      stats.set(id, entry);
      const probe = markRaw(
        defineComponent({
          name: `RowProbe_${id}`,
          props: { modelValue: { type: [String, Number], default: '' } },
          emits: ['update:modelValue'],
          setup(_, { emit }) {
            entry.mounts++;
            onBeforeUnmount(() => {
              entry.unmounts++;
            });
            return () =>
              h('input', {
                value: '',
                onInput: (event: Event) =>
                  emit(
                    'update:modelValue',
                    (event.target as HTMLInputElement).value
                  ),
              });
          },
        })
      );
      probes.set(id, probe);
      return probe;
    };

    const form = useForm(
      {
        rows: [
          { id: 'a', name: '' },
          { id: 'b', name: '' },
          { id: 'c', name: '' },
        ],
      },
      [{ path: 'rows', fields: [] }]
    );

    const buildFields = () =>
      (form.getFormData('rows') as Array<{ id: string }>).flatMap(
        (row, index) => [
          {
            path: `rows.${index}.name`,
            component: probeFor(row.id),
            label: row.id,
          },
        ]
      );
    const syncFields = () =>
      form.setField('rows', { fields: buildFields() } as any);

    syncFields();
    const wrapper = mount(ProForm as any, { props: { form } });
    await flushPromises();

    const group = form.fields.value.find(
      (field: any) => field.path === 'rows'
    ) as any;
    const oldField = group.fields[0];
    expect(typeof oldField.getComponentRef).toBe('function');
    expect(stats.get('a')?.mounts).toBe(1);
    expect(stats.get('b')?.mounts).toBe(1);
    expect(stats.get('c')?.mounts).toBe(1);

    // 追加一行：已有行不重挂
    form.setFormData('rows', (prev: any[]) => [...prev, { id: 'd', name: '' }]);
    syncFields();
    await flushPromises();

    expect(stats.get('a')?.mounts).toBe(1);
    expect(stats.get('b')?.mounts).toBe(1);
    expect(stats.get('c')?.mounts).toBe(1);
    expect(stats.get('d')?.mounts).toBe(1);
    expect(wrapper.findAll('input')).toHaveLength(4);

    // 删除中间行：仅被删行卸载，其余行不重挂
    form.setFormData('rows', (prev: any[]) =>
      prev.filter((row: any) => row.id !== 'b')
    );
    syncFields();
    await flushPromises();

    expect(stats.get('b')?.unmounts).toBe(1);
    expect(stats.get('a')?.mounts).toBe(1);
    expect(stats.get('c')?.mounts).toBe(1);
    expect(stats.get('d')?.mounts).toBe(1);

    // 重排：实例跟随数据行
    form.setFormData('rows', (prev: any[]) => [prev[2], prev[0], prev[1]]);
    syncFields();
    await flushPromises();

    for (const id of ['a', 'c', 'd']) {
      expect(stats.get(id)?.mounts).toBe(1);
      expect(stats.get(id)?.unmounts).toBe(0);
    }

    // 行实例复用时按新 path 重新绑定：输入落在重排后的新下标
    await wrapper.findAll('input')[1].setValue('a-typed');
    await flushPromises();
    expect(form.getFormData('rows.1.name')).toBe('a-typed');
    expect(form.getFormData('rows.0.name')).toBe('');
    expect(form.getFormData('rows.2.name')).toBe('');

    // 旧字段对象访问器被清理，新字段对象获得访问器
    const newField = group.fields[0];
    expect(newField).not.toBe(oldField);
    expect(typeof newField.getComponentRef).toBe('function');
    expect(oldField.getComponentRef).toBeUndefined();

    wrapper.unmount();
  });

  // ----------------------------------------------------
  // FK-B6: 重复行引用不产生重复 key 告警
  // ----------------------------------------------------
  it('FK-B6 [判别]: 同一行对象重复引用时 key 唯一收敛，不触发重复 key 告警', async () => {
    const row = { id: 'dup', name: '' };
    const form = useForm({ rows: [row, row] }, [{ path: 'rows', fields: [] }]);
    const probe = markRaw(
      defineComponent({
        name: 'DupProbe',
        props: { modelValue: { type: [String, Number], default: '' } },
        setup() {
          return () => h('input');
        },
      })
    );
    form.setField('rows', {
      fields: [
        { path: 'rows.0.name', component: probe },
        { path: 'rows.1.name', component: probe },
      ],
    } as any);

    const wrapper = mount(ProForm as any, { props: { form } });
    await flushPromises();

    expect(wrapper.findAll('input')).toHaveLength(2);
    wrapper.unmount();
  });
});
