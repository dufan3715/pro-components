/* eslint-disable no-unused-vars, no-param-reassign, no-redeclare */
import type { UseForm } from '../types';
import useFields from './useFields';
import useFormData from './useFormData';
import useFormRef from './useFormRef';

const useForm: UseForm = ((initFormData = {}, initFields = []) => {
  return {
    ...useFormData(initFormData),
    ...useFields(initFields),
    ...useFormRef(),
  };
}) as any;
export default useForm;
