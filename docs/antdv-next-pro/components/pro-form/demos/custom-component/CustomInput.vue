<script lang="ts" setup>
const value = defineModel<string>('value', { default: '' });
</script>

<template>
  <!-- From Uiverse.io by ErzenXz -->
  <input
    type="text"
    class="input"
    v-bind="$attrs"
    :value="value"
    @input="e => (value = (e.target as any)?.value)"
  />
</template>

<style scoped lang="css">
/* From Uiverse.io by ErzenXz */
.input {
  width: 100%;
  height: 45px;
  padding: 12px;
  border: 1.5px solid lightgrey;
  border-radius: 12px;
  outline: none;
  box-shadow: 0px 0px 20px -18px;
  transition: all 0.3s cubic-bezier(0.19, 1, 0.22, 1);
}

.input:hover {
  border: 2px solid lightgrey;
  box-shadow: 0px 0px 20px -17px;
}

.input:active {
  transform: scale(0.95);
}

.input:focus {
  border: 2px solid grey;
}
</style>
