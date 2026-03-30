<script lang="ts" setup>
const value = defineModel<string>({ default: '' });
</script>

<template>
  <input
    type="text"
    class="input"
    v-bind="$attrs"
    :value="value"
    @input="e => (value = (e.target as HTMLInputElement)?.value || '')"
  />
</template>

<style scoped>
.input {
  width: 100%;
  height: 40px;
  padding: 8px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  outline: none;
}

.input:focus {
  border-color: #409eff;
}
</style>
