# @qin-ui/vant-pro

> 基于 Vant v4 的配置驱动表单组件库。

## 安装

```bash
npm install @qin-ui/vant-pro vant vue
```

## 核心导出

### 组件

- `ProForm` - 配置驱动表单组件
- `ProComponentProvider` - 全局配置提供者

### Hooks

- `useForm<D>()` - 创建表单实例
- `useFields<D>()` - 字段配置管理
- `useFormRef()` - 表单组件引用

## 字段配置（Field）

每个字段支持：`path`, `label`, `component`, `hidden`, `disabled`, `rules`, `valueFormatter`, `fields`, `grid`, `slots`, `componentStyle`, `componentClass`, `componentContainer`, `formItemStyle`, `formItemClass`, `formItemContainer`, `modelProp`

内置组件：input, textarea, input-search, input-password, input-number, select, cascader, date-picker, range-picker, time-picker, checkbox-group, radio-group, switch, slider, tree-select, transfer, custom

## 类型扩展

```typescript
declare module '@qin-ui/vant-pro' {
  interface ComponentMap {
    'my-custom-component': typeof MyComponent;
  }
}
```
