# ProForm

基于 antdv-next Form 的高级表单封装。

## 介绍

`ProForm` 在 antdv-next `Form` 的基础上，通过 `fields` 配置数组驱动表单表单字段渲染，内置了常用的输入组件（Input、Select、DatePicker 等），并通过 `useForm` hook 管理表单数据和字段状态。

## API

### ProForm Props

| 属性 | 说明               | 类型                   | 默认值  |
| ---- | ------------------ | ---------------------- | ------- |
| form | useForm 返回的对象 | `Form`                 | -       |
| grid | 是否启用网格布局   | `boolean \| GridProps` | `false` |

### useForm

```ts
import { useForm } from '@qin-ui/antdv-next-pro';

const form = useForm<DataType>(formData, fields);
```
