import type { Field } from '../../src/components/form/types';

/**
 * 创建标准基础表单字段集合（用于单测）
 */
export const createBasicFields = (): Field[] => [
  {
    path: 'name',
    label: '姓名',
    component: 'field',
    rules: [{ required: true, message: '请输入姓名' }],
  },
  {
    path: 'age',
    label: '年龄',
    component: 'stepper',
  },
  {
    path: 'agree',
    label: '同意条款',
    component: 'switch',
  },
];

/**
 * 嵌套深层路径字段配置
 */
export const createNestedFields = (): Field[] => [
  {
    path: 'user.name',
    label: '用户姓名',
    component: 'field',
  },
  {
    path: 'user.address.city',
    label: '居住城市',
    component: 'field',
  },
];
