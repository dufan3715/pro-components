import type { UseForm } from '../types';
import useFields from './useFields';
import useFormData from './useFormData';

const useForm: UseForm = (initFormData, initFields) => {
  return {
    ...useFormData(initFormData || {}),
    ...useFields(initFields || []),
  };
};
export default useForm;
