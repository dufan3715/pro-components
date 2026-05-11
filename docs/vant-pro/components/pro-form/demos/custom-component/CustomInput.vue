<script lang="ts" setup>
import { computed } from 'vue';
import { Field } from 'vant';

const props = defineProps<{
  modelValue?: string;
}>();

const emit = defineEmits(['update:modelValue']);

const innerValue = computed({
  get: () => props.modelValue,
  set: val => {
    emit('update:modelValue', val);
  },
});
</script>

<template>
  <Field v-model="innerValue" v-bind="$attrs" />
</template>
