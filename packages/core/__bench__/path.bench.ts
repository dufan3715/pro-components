import { bench, describe } from 'vitest';
import lodashGet from 'lodash-es/get';
import lodashSet from 'lodash-es/set';
import lodashToPath from 'lodash-es/toPath';
import { getByPath, setByPath, normalizePathKey } from '../src/shared/path';

describe('Path performance benchmarks', () => {
  const data = {
    user: {
      profile: {
        address: {
          city: 'Beijing',
        },
      },
    },
    title: 'Hello',
  };

  bench('深路径 get (lodash.get)', () => {
    lodashGet(data, 'user.profile.address.city');
  });

  bench('深路径 get (getByPath)', () => {
    getByPath(data, 'user.profile.address.city');
  });

  bench('单段 get (lodash.get)', () => {
    lodashGet(data, 'title');
  });

  bench('单段 get (getByPath)', () => {
    getByPath(data, 'title');
  });

  bench('深路径 set (lodash.set)', () => {
    const target = { user: { profile: { address: { city: 'Beijing' } } } };
    lodashSet(target, 'user.profile.address.city', 'Shanghai');
  });

  bench('深路径 set (setByPath)', () => {
    const target = { user: { profile: { address: { city: 'Beijing' } } } };
    setByPath(target, 'user.profile.address.city', 'Shanghai');
  });

  bench('字段路径归一化 (lodash.toPath.join)', () => {
    lodashToPath('user.profile.address.city').join('.');
  });

  bench('字段路径归一化 (normalizePathKey)', () => {
    normalizePathKey('user.profile.address.city');
  });
});
