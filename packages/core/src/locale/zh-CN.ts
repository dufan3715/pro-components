/**
 * 简体中文语言包（默认语言包）
 * @description key 为扁平点路径（如 `'table.query'`），值可含 `{placeholder}` 占位符（配合 `format`）
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
