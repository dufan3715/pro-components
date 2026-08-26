import type { Field } from '../../src/components/form/types';
import type { Column } from '../../src/components/table/types';

/**
 * 基础测试表单字段
 */
export const createBasicFields = (): Field[] => [
  {
    path: 'name',
    label: '姓名',
    component: 'input',
    rules: [{ required: true, message: '请输入姓名' }],
  },
  {
    path: 'age',
    label: '年龄',
    component: 'input-number',
  },
  {
    path: 'status',
    label: '状态',
    component: 'select',
    options: [
      { label: '正常', value: 'normal' },
      { label: '停用', value: 'stopped' },
    ],
  },
];

/**
 * 嵌套路径表单字段 (用于 H1 校验与深层数据绑定测试)
 */
export const createNestedFields = (): Field[] => [
  {
    path: 'user.name',
    label: '用户名',
    component: 'input',
    rules: [{ required: true, message: '请输入用户名' }],
  },
  {
    path: 'user.address.city',
    label: '城市',
    component: 'input',
    rules: [{ required: true, message: '请输入城市' }],
  },
];

/**
 * 基础测试表格列
 */
export const createBasicColumns = (): Column[] => [
  {
    prop: 'id',
    label: 'ID',
  },
  {
    prop: 'name',
    label: '姓名',
  },
  {
    prop: 'status',
    label: '状态',
  },
];
