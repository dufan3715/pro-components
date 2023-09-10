/* eslint-disable import/prefer-default-export */
import type { App, Plugin } from 'vue';

type SFCWithInstall<T> = T & Plugin;

export const withInstall = <T>(comp: T) => {
  // eslint-disable-next-line no-param-reassign
  (comp as SFCWithInstall<T>).install = (app: App) => {
    app.component((comp as any).name, comp as any);
  };
  return comp as SFCWithInstall<T>;
};
