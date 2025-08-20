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
  [K in keyof T]: K extends string
    ? T[K] extends (infer U)[]
      ?
          | `${Prefix}${K}`
          | (IsRecord<U> extends true
              ? AllowStringKey<U, `${Prefix}${K}[index].`>
              : never)
      : IsRecord<T[K]> extends true
        ? `${Prefix}${K}` | AllowStringKey<T[K], `${Prefix}${K}.`>
        : `${Prefix}${K}`
    : never;
}[keyof T];

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
