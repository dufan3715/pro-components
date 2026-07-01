# @qin-ui/antdv-next-pro

> 基于 antdv-next 的配置驱动表单和表格组件库。

## 安装

```bash
npm install @qin-ui/antdv-next-pro antdv-next vue
```

## 核心导出

### 组件

- `ProForm` - 配置驱动表单组件
- `ProTable` - 配置驱动表格组件
- `ProComponentProvider` - 全局配置提供者

### Hooks

- `useForm<D>()` - 创建表单实例
- `useFields<D>()` - 字段配置管理
- `useFormRef()` - 表单组件引用
- `useTable<D, T>()` - 创建表格实例

## 字段配置（Field）

每个字段支持：`path`, `label`, `component`, `hidden`, `disabled`, `rules`, `valueFormatter`, `fields`, `grid`, `slots`, `componentStyle`, `componentClass`, `componentContainer`, `formItemStyle`, `formItemClass`, `formItemContainer`, `modelProp`

内置组件：input, textarea, input-search, input-password, input-number, select, cascader, date-picker, range-picker, time-picker, checkbox-group, radio-group, switch, slider, tree-select, transfer, custom

## 表格列配置（Column）

- `dataIndex` - 数据路径（优先使用）
- `key` - 列标识（dataIndex 不满足时使用）
- `hidden` - 是否隐藏
- 所有 antdv-next ColumnType 属性
