export type Data = Record<string, any>;

export type IsRecord<T> = T extends object
  ? T extends ((...args: any[]) => any) | any[] | null
    ? false
    : true
  : false;

export type KeyExpandString<T extends string> = T | (string & {});

export type ExtendWithAny<D> = {
  [K in keyof D]: IsRecord<D[K]> extends true ? ExtendWithAny<D[K]> : D[K];
} & Record<string, any>;

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

export type KeyPathString<D extends Data> = KeyExpandString<AllowStringKey<D>>;

export type Path<D extends Data = Data> = KeyPathString<D>;

type JoinPath<Prefix extends any[], Key extends PropertyKey> = [
  ...Prefix,
  KeyExpandString<Extract<Key, string>>,
];

export type Paths<T, Prefix extends any[] = []> = T extends object
  ? {
      [K in keyof T]: IsRecord<T[K]> extends true
        ? JoinPath<Prefix, K> | Paths<T[K], JoinPath<Prefix, K>>
        : JoinPath<Prefix, K>;
    }[keyof T]
  : never;
