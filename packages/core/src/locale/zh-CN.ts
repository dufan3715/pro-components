/**
 * 简体中文语言包
 *
 * @description pro-components 内置文案的简体中文翻译，作为默认语言包。
 * key 采用扁平化的点路径结构（如 `'table.query'`），
 * 支持 `{placeholder}` 形式的参数占位符（配合 format 使用）。
 */
export default {
  // 表格
  'table.query': '查询',
  'table.reset': '重置',
  'table.expand': '展开',
  'table.collapse': '收起',
  'table.selectAll': '全选',
  'table.index': '序号',
  'table.sizeDefault': '默认',
  'table.sizeMiddle': '中等',
  'table.sizeCompact': '紧凑',
  'table.columnFallback': '列{index}',
  // 分页
  'pagination.total': '共 {total} 条',
  // 表单字段占位符
  'input.placeholder': '请输入',
  'select.placeholder': '请选择',
} as const;
