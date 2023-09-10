/* eslint-disable no-console, no-await-in-loop, no-new-func, no-unused-vars, no-redeclare, no-restricted-syntax */
import { useMessage, type FormItemRule } from 'naive-ui';
import { MessageApiInjection } from 'naive-ui/es/message/src/MessageProvider';
import { round } from 'lodash-es';
import { FormItemRuleValidatorParams } from 'naive-ui/es/form/src/interface';
import { nextTick } from 'vue';
import {
  Condition,
  Form,
  Logic,
  CommandTrigger,
  UseCommand,
  Expression,
  Refs,
} from '../types';
import { isFunctionString } from '../utils';
import { ruleTypeMap } from '../constants';

const tool = {
  round,
};

const conditionTypeMap: Record<Condition['type'], '&&' | '||'> = {
  AND: '&&',
  OR: '||',
};

const fontCssMap = {
  large: 'font-size: 14px;',
  blue: 'color: #1677ff;',
  gray: 'color: #262626;',
  red: 'color: #f5222d;',
  purple: 'color: #722ed1;',
  indent2: 'text-indent: 2em;',
  indent4: 'text-indent: 4em;',
  mb10: 'margin-bottom: 10px;',
};

type LogParam = [msg: string, styles?: Array<keyof typeof fontCssMap>];

type LogQueue = Array<Array<LogParam>>;

type ProParam = {
  form: Form;
  run: ReturnType<UseCommand>['run'];
  refs: Refs;
  message: MessageApiInjection;
  logQueue: LogQueue;
};

function printLog(msg: string, styles?: Array<keyof typeof fontCssMap>): void;
function printLog(logParam: Array<LogParam>): void;

/** 打印日志 */
function printLog(
  param: string | Array<LogParam>,
  styles?: Array<keyof typeof fontCssMap>
) {
  let msg = '';
  const msgStyle = [];
  if (Array.isArray(param)) {
    param.forEach(([text, textStyles]) => {
      msg += `%c${text}`;
      const style = textStyles?.map(item => fontCssMap[item]).join('');
      msgStyle.push(style);
    });
  } else {
    msg = `%c${param}`;
    const style = styles?.map(item => fontCssMap[item]).join('');
    msgStyle.push(style);
  }
  // eslint-disable-next-line no-console
  console.log(msg, ...msgStyle);
}

/** 约定表达式中以“enum()”包裹的内容需要解析为枚举字段值 */
const enumRegExp = /enum\((.*?)\)/g;

/** 执行表达式 */
async function runExpression(
  expression: Expression,
  form: ProParam['form']
): Promise<any> {
  let result = expression;
  if (typeof expression === 'string') {
    let functionStr = expression.replaceAll(/\n/g, '');
    if (isFunctionString(expression)) {
      const fn = new Function(`return ${functionStr}`)();
      result = await fn({ tool, form });
    } else {
      if (expression.match(enumRegExp)) {
        functionStr = expression.replace(enumRegExp, '$1');
      }
      const fn = new Function('{ tool, form }', `return ${functionStr}`);
      result = await fn({ tool, form });
    }
  }
  return result;
}

/** 验证逻辑条件是否通过 */
async function validateConditions(
  conditions: Logic['conditions'],
  baseParam: ProParam
): Promise<boolean> {
  const { form, logQueue } = baseParam;
  logQueue.push([[`逻辑执行条件： `, ['purple', 'indent2']]]);
  const conditionsResultArr = [];
  for (
    let conditionIndex = 0;
    conditionIndex < conditions.length;
    conditionIndex += 1
  ) {
    const condition = conditions[conditionIndex];
    const {
      type: conditionType,
      expression: conditionExpression,
      disabled,
    } = condition;
    if (disabled) {
      logQueue.push([
        [`条件${conditionIndex + 1}： `, ['blue', 'indent4']],
        [`禁用`, ['red']],
      ]);
    } else {
      const conditionResult = await runExpression(conditionExpression, form);
      logQueue.push([
        [`条件${conditionIndex + 1}： `, ['blue', 'indent4']],
        [`${conditionExpression}`, ['gray']],
      ]);
      logQueue.push([
        [`条件${conditionIndex + 1}是否通过： `, ['blue', 'indent4']],
        [`${conditionResult}`, ['gray']],
      ]);
      if (conditionIndex !== 0) {
        conditionsResultArr.push(
          `${conditionTypeMap[conditionType]}${conditionResult}`
        );
      } else {
        conditionsResultArr.push(conditionResult);
      }
    }
  }
  const result = new Function(`return ${conditionsResultArr.join(',')}`)();
  logQueue.push([
    [`全部条件是否通过： `, ['purple', 'indent4']],
    [`${result}`, ['gray']],
  ]);
  return result;
}

/** 运行逻辑规则 */
async function runRules(rules: Logic['rules'], baseParam: ProParam) {
  const { form, run, refs, message, logQueue } = baseParam;
  logQueue.push([[`逻辑执行规则： `, ['purple', 'indent2']]]);
  for (let ruleIndex = 0; ruleIndex < rules.length; ruleIndex += 1) {
    const rule = rules[ruleIndex];
    const { type, path, expression, disabled } = rule;
    if (disabled) {
      logQueue.push([
        [`逻辑${ruleIndex + 1}： `, ['blue', 'indent4']],
        [`禁用`, ['red']],
      ]);
      return;
    }
    const value = await runExpression(expression, form);
    logQueue.push([
      [`逻辑${ruleIndex + 1}： `, ['blue', 'indent4']],
      [`${JSON.stringify(expression)}`, ['gray']],
    ]);
    logQueue.push([
      [`逻辑${ruleIndex + 1}执行结果： `, ['blue', 'indent4']],
      [`${JSON.stringify(value)}`, ['gray']],
    ]);
    logQueue.push([
      [`逻辑${ruleIndex + 1}操作类型： `, ['blue', 'indent4']],
      [`${ruleTypeMap.get(type)}`, ['gray']],
    ]);
    logQueue.push([
      [`逻辑${ruleIndex + 1}变更字段： `, ['blue', 'indent4', 'mb10']],
      [`${path}`, ['gray']],
    ]);
    switch (type) {
      case 'value': {
        form.setFormData(path, value);
        nextTick(() => run(path, 'onUpdateValue'));
        break;
      }
      case 'hidden':
        form.setField(path, preField => ({ ...preField, hidden: value }));
        break;
      case 'disabled':
        form.setField(path, preField => ({ ...preField, disabled: value }));
        break;
      case 'options':
        form.setField(path, preField => ({ ...preField, options: value }));
        break;
      case 'validateRule': {
        const validateRule: FormItemRule[] = [];
        for (
          let validateRuleIndex = 0;
          validateRuleIndex < value.length;
          validateRuleIndex += 1
        ) {
          const validateRuleItem: FormItemRule = value[validateRuleIndex];
          const { pattern, validator, asyncValidator } =
            validateRuleItem as any;
          const overrides: Record<string, any> = {};
          if (pattern) {
            const fn = new Function(`return ${pattern}`);
            overrides.pattern = fn();
          }
          if (validator) {
            const validatorFn = new Function(`return ${validator}`)();
            overrides.validator = (...args: FormItemRuleValidatorParams) =>
              validatorFn({ tool, form }, ...args);
          }
          if (asyncValidator) {
            const asyncValidatorFn = new Function(`return ${asyncValidator}`)();
            overrides.asyncValidator = (...args: FormItemRuleValidatorParams) =>
              asyncValidatorFn({ tool, form }, args);
          }
          validateRule.push({
            ...validateRuleItem,
            ...overrides,
          });
        }
        form.setField(path, preField => ({ ...preField, rule: validateRule }));
        break;
      }
      case 'fieldMergeOverrides':
        form.setField(path, preField => ({ ...preField, ...value }));
        break;
      case 'validate':
        refs.formItemRefs[path]?.validate();
        break;
      case 'clearValidate':
        refs.formItemRefs[path]?.restoreValidation();
        break;
      case 'message':
        message.info(value);
        break;
      default: {
        const n: never = type;
        // eslint-disable-next-line no-console
        console.log('n: ', n);
      }
    }
  }
}

type RunCommands = (
  param: {
    path: string;
    trigger: CommandTrigger;
  } & ProParam
) => Promise<void>;

const runCommands: RunCommands = async ({ path, trigger, ...baseParam }) => {
  const { form, logQueue } = baseParam;
  const field = form.getField(path);
  if (!field) return;
  const { autoCommand } = field;
  const commands = autoCommand?.[trigger];
  if (!commands || commands.length === 0) return;
  for (const command of commands) {
    const { no, logics, name, description } = command || {};
    if (!logics || logics.length === 0) return;
    logQueue.push({ no, name } as any);
    logQueue.push([
      [`****** 开始执行逻辑指令 (`, ['large', 'blue']],
      [`${no}`, ['large', 'purple']],
      [`) ******`, ['large', 'blue']],
    ]);
    logQueue.push([
      [`指令名称：`, ['blue']],
      [`${name}`, ['gray']],
    ]);
    logQueue.push([
      [`指令描述：`, ['blue']],
      [`${description}`, ['gray']],
    ]);

    for (let logicIndex = 0; logicIndex < logics.length; logicIndex += 1) {
      const logic = logics[logicIndex];
      const { conditions, rules } = logic;
      if (conditions.length === 0 || rules.length === 0) return;
      logQueue.push([
        [`逻辑${logicIndex + 1}：`, ['large', 'purple']],
        [`${path}`, ['large', 'red']],
        [
          `${logic.disabled ? ' 禁用中' : ' 启用中'}`,
          ['large', `${logic.disabled ? 'red' : 'blue'}`],
        ],
      ]);
      if (logic.disabled) return;
      const conditionsValid = await validateConditions(conditions, baseParam);
      if (conditionsValid) {
        await runRules(rules, baseParam);
      }
    }
    logQueue.push([
      ['****** 结束执行逻辑指令 ******', ['large', 'blue', 'mb10']],
    ]);
  }
};

const useCommand: UseCommand = ({ refs, form }) => {
  let message: any;
  try {
    message = useMessage();
  } catch (error) {
    // eslint-disable-next-line no-alert
    message = { info: (s: string) => alert(s) };
    // eslint-disable-next-line no-console
    console.log('error: ', error);
  }
  const run = (path: string, trigger: CommandTrigger) => {
    const logQueue: LogQueue = [];
    runCommands({
      path,
      trigger,
      form,
      refs,
      message,
      run,
      logQueue,
    })
      .catch(err => {
        setTimeout(() => printLog('逻辑运行出错了😂', ['large', 'red']));
        throw err;
      })
      .finally(() => {
        const logGroupInfo = logQueue.splice(0, 1)[0] as unknown as {
          no: number;
          name: string;
        };
        console.groupCollapsed(
          `%c【逻辑指令${logGroupInfo.no}】${logGroupInfo.name}`,
          'font-size: 13px;'
        );
        logQueue.forEach(logParam => printLog(logParam));
        console.groupEnd();
      });
  };

  return { run };
};

export default useCommand;
