/**
 * element-plus-pro 语言包（繁體中文）
 *
 * @description 在 core 通用語言包基礎上，擴展 element-plus 特有的
 * 日期/時間元件佔位符文案。
 */
import { zhTW } from '../shared/core';

export default {
  ...zhTW,
  // 日期/時間選擇器佔位符（對應 INJECT_CONFIG 中 date-picker.* 的佔位預設值）
  'date-picker.placeholder': '請選擇',
  'date-picker.start': '開始日期',
  'date-picker.end': '結束日期',
  'date-picker.startMonth': '開始月份',
  'date-picker.endMonth': '結束月份',
  'date-picker.startYear': '開始年份',
  'date-picker.endYear': '結束年份',
  'date-picker.startTime': '開始時間',
  'date-picker.endTime': '結束時間',
} as const;
