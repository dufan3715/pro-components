import { inject } from 'vue';
import type { UseForm } from '../types';
import useFields from './useFields';
import useFormData from './useFormData';
import useFormRef from './useFormRef';
import { FORM } from '../constants';

const useForm: UseForm = (...args) => {
  let initFormData = {};
  let initFields = [];
  let root = true;
  if (args.length >= 3) {
    initFormData = args[0] as object;
    initFields = args[1] as any;
    root = args[2] as boolean;
  } else if (args.length === 1) {
    root = args[0] as boolean;
  }
  if (!root) {
    const injectForm = inject(FORM);
    if (injectForm) {
      return injectForm;
    }
  }
  const form = {
    ...useFormData(initFormData as any),
    ...useFields(initFields as any),
    ...useFormRef(),
  };
  return form;
};
export default useForm;
