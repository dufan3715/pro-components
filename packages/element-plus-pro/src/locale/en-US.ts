/**
 * element-plus-pro language pack (English)
 *
 * @description Extends the core language pack with element-plus specific
 * date/time picker placeholder texts.
 */
import { enUS } from '../shared/core';

export default {
  ...enUS,
  // Date/time picker placeholders (defaults of date-picker.* in INJECT_CONFIG)
  'date-picker.placeholder': 'Please select',
  'date-picker.start': 'Start date',
  'date-picker.end': 'End date',
  'date-picker.startMonth': 'Start month',
  'date-picker.endMonth': 'End month',
  'date-picker.startYear': 'Start year',
  'date-picker.endYear': 'End year',
  'date-picker.startTime': 'Start time',
  'date-picker.endTime': 'End time',
} as const;
