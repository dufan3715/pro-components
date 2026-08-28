/**
 * element-plus-pro 语言包（简体中文）
 *
 * @description 在 core 通用语言包基础上，扩展 element-plus 特有的
 * 日期/时间组件占位符文案。
 */
import { zhCN } from '../shared/core';

export default {
  ...zhCN,
  // 日期/时间选择器占位符（对应 INJECT_CONFIG 中 date-picker.* 的占位默认值）
  'date-picker.placeholder': '请选择',
  'date-picker.start': '开始日期',
  'date-picker.end': '结束日期',
  'date-picker.startMonth': '开始月份',
  'date-picker.endMonth': '结束月份',
  'date-picker.startYear': '开始年份',
  'date-picker.endYear': '结束年份',
  'date-picker.startTime': '开始时间',
  'date-picker.endTime': '结束时间',
} as const;
