# ProTable

基于 antdv-next Table 的高级表格封装。

## 介绍

`ProTable` 在 antdv-next `Table` 的基础上，集成了搜索区域、分页、列控制等常用功能。通过 `useTable` hook 管理表格数据、列配置和分页状态。

## API

### ProTable Props

| 属性            | 说明                   | 类型                 | 默认值  |
| --------------- | ---------------------- | -------------------- | ------- |
| table           | useTable 返回的对象    | `Table`              | -       |
| search          | 数据查询方法           | `() => Promise<any>` | -       |
| addIndexColumn  | 是否在首列插入序号列   | `boolean`            | `false` |
| immediateSearch | 挂载时是否立即触发查询 | `boolean`            | `false` |

### useTable

```ts
import { useTable } from '@qin-ui/antdv-next-pro';

const table = useTable<DataType>({
  columns: [...],
  searchFields: [...],
});
```
