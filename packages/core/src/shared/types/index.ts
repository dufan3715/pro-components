/**
 * 表单 / 表格数据对象的基础类型
 * @description 任意字符串键的对象，路径泛型与运行时路径解析的公共约束
 */
export type Data = Record<string, any>;

/**
 * 判断类型是否为对象（排除函数、数组和 null）
 * @template T - 要判断的类型
 */
export type IsRecord<T> = T extends object
  ? T extends ((...args: any[]) => any) | any[] | null
    ? false
    : true
  : false;

/**
 * 字符串字面量联合类型扩展为同时接受任意 `string`（保留字面量提示）
 * @template T - 字符串字面量类型
 */
export type KeyExpandString<T extends string> = T | (string & {});

/**
 * 递归保留原属性结构，同时允许访问任意字符串 key
 *
 * @template D - 原始对象类型
 *
 * @example
 * ```ts
 * type T = ExtendWithAny<{ name: string; age: number }>
 * // { name: string; age: number } & Record<string, any>：obj.anyKey 可访问
 * ```
 */
export type ExtendWithAny<D> = {
  [K in keyof D]: IsRecord<D[K]> extends true ? ExtendWithAny<D[K]> : D[K];
} & Record<string, any>;

/**
 * 递归地将对象的所有属性变为可选
 * @template T - 原始类型
 *
 * @example
 * ```ts
 * type T = DeepPartial<{ name: string; address: { city: string } }>
 * // { name?: string; address?: { city?: string } }
 * ```
 */
export type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

// 递归收集点分路径字面量；数组元素路径以 `[index].` 段展开
type AllowStringKey<T, Prefix extends string = ''> = {
  [K in keyof T as string extends K
    ? never
    : number extends K
      ? never
      : K extends string
        ? K
        : never]: T[K] extends (infer U)[]
    ?
        | `${Prefix}${K & string}`
        | (IsRecord<U> extends true
            ? AllowStringKey<U, `${Prefix}${K & string}[index].`>
            : never)
    : IsRecord<T[K]> extends true
      ?
          | `${Prefix}${K & string}`
          | AllowStringKey<T[K], `${Prefix}${K & string}.`>
      : `${Prefix}${K & string}`;
} extends infer Obj
  ? Obj[keyof Obj]
  : never;

/**
 * 点号分隔的深层路径字面量联合类型（同时兼容任意 `string` 动态路径）
 *
 * @template D - 数据对象类型
 *
 * @example
 * ```ts
 * interface User { name: string; address: { city: string } }
 *
 * type P = KeyPathString<User> // 'name' | 'address' | 'address.city' | string
 * ```
 */
export type KeyPathString<D extends Data> = KeyExpandString<AllowStringKey<D>>;

/**
 * 深层属性路径类型（`useFormData` / `useFields` 等 API 的 `path` 参数）
 *
 * @template D - 数据对象类型
 *
 * @example
 * ```ts
 * interface User { name: string; address: { city: string } }
 *
 * const ok: Path<User> = 'address.city' // ✅
 * const bad: Path<User> = 'invalid.path' // ❌ 类型错误
 * ```
 */
export type Path<D extends Data = Data> = KeyPathString<D>;

// 路径元组前缀拼接
type JoinPath<Prefix extends any[], Key extends PropertyKey> = [
  ...Prefix,
  KeyExpandString<Extract<Key, string>>,
];

/**
 * 路径的数组表示（供需要段数组语义的绑定场景使用）
 *
 * @template T - 数据对象类型
 * @template Prefix - 前缀路径数组（内部递归使用）
 *
 * @example
 * ```ts
 * interface User { name: string; address: { city: string } }
 *
 * type P = Paths<User> // ['name'] | ['address'] | ['address', 'city']
 * ```
 */
export type Paths<T, Prefix extends any[] = []> =
  | (T extends object
      ? {
          [K in keyof T]: IsRecord<T[K]> extends true
            ? JoinPath<Prefix, K> | Paths<T[K], JoinPath<Prefix, K>>
            : JoinPath<Prefix, K>;
        }[keyof T]
      : never)
  | (string & {})[];
