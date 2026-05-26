/**
 * 基础数据类型，表示任意对象
 * @description 所有表单数据对象和表格数据对象的基础类型
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
 * 展开字符串联合类型，保留字符串字面量，同时兼容 string
 * @template T - 字符串字面量类型
 */
export type KeyExpandString<T extends string> = T | (string & {});

/**
 * 用 Record<string, any> 扩展对象类型，保留所有原始属性结构，
 * 同时允许访问任意字符串 key。
 * @template D - 原始对象类型
 *
 * @example
 * ```ts
 * type T = ExtendWithAny<{ name: string; age: number }>
 * // { name: string; age: number } & Record<string, any>
 * // 可访问任意额外属性: obj.anyKey
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
 * 点号分隔的路径字符串类型
 * @template D - 数据对象类型
 *
 * @description 用于类型安全地表示深层对象属性的路径。
 * 例如给定 `{ user: { name: string; address: { city: string } } }`，
 * 路径值可以是 `'user'`、`'user.name'`、`'user.address.city'`。
 *
 * 同时兼容 string 类型，用于运行时动态路径。
 *
 * @example
 * ```ts
 * interface User {
 *   name: string
 *   age: number
 *   address: { city: string; street: string }
 * }
 *
 * type P = KeyPathString<User>
 * // 'name' | 'age' | 'address' | 'address.city' | 'address.street' | string
 * ```
 */
export type KeyPathString<D extends Data> = KeyExpandString<AllowStringKey<D>>;

/**
 * 路径类型，用于类型安全的深层属性访问
 * @template D - 数据对象类型
 *
 * @description 提供对数据对象的深层路径的类型推导。
 * 在 useFormData、useFields 等 API 中作为 path 参数的类型。
 *
 * @example
 * ```ts
 * interface User { name: string; address: { city: string } }
 *
 * // 类型安全的路径
 * const path: Path<User> = 'address.city' // ✅
 * const path: Path<User> = 'invalid.path' // ❌ 类型错误
 * ```
 */
export type Path<D extends Data = Data> = KeyPathString<D>;

type JoinPath<Prefix extends any[], Key extends PropertyKey> = [
  ...Prefix,
  KeyExpandString<Extract<Key, string>>,
];

/**
 * 路径数组类型（Path 的数组表示）
 * @template T - 数据对象类型
 * @template Prefix - 前缀路径数组（内部递归使用）
 *
 * @description 与 Path 类似，但以元组数组形式表示路径。
 *
 * @example
 * ```ts
 * interface User { name: string; address: { city: string } }
 *
 * type P = Paths<User>
 * // ['name'] | ['address'] | ['address', 'city']
 * ```
 */
export type Paths<T, Prefix extends any[] = []> = T extends object
  ? {
      [K in keyof T]: IsRecord<T[K]> extends true
        ? JoinPath<Prefix, K> | Paths<T[K], JoinPath<Prefix, K>>
        : JoinPath<Prefix, K>;
    }[keyof T]
  : never;
