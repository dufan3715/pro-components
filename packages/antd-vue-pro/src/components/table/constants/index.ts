/* 初始化组件配置inject keys */
// prettier-ignore
export const INJECT_COMPONENT_PROPS_KEYS = {
  'table': Symbol(''),
  'searchForm': Symbol(''),
  'control': Symbol(''),
};

const PROPS_KEYS = INJECT_COMPONENT_PROPS_KEYS;

// prettier-ignore
export const INIT_COMPONENT_PROPS_MAP = new Map([
  [PROPS_KEYS.table, {}],
  [PROPS_KEYS.searchForm, {}],
  [PROPS_KEYS.control, {}],
]);
