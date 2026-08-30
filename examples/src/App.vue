<script lang="ts" setup>
import { ProTable, useTable } from '../../packages/element-plus-pro/src';

const table = useTable();

const handleRowClick = () => {};
</script>

<template>
  <div>
    <ProTable :table="table" @row-dblclick="handleRowClick"></ProTable>
  </div>
</template>

<style scoped lang="css"></style>
