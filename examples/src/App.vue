<script setup lang="ts">
import PerformanceProfiler from './components/PerformanceProfiler.vue';
</script>

<template>
  <div class="app-root">
    <PerformanceProfiler />
  </div>
</template>

<style>
body {
  margin: 0;
  padding: 0;
  color: #f1f5f9;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial,
    sans-serif;
  background-color: #0b0f19;
  -webkit-font-smoothing: antialiased;
}

* {
  box-sizing: border-box;
}
</style>

<style scoped>
.app-root {
  min-height: 100vh;
  padding-bottom: 60px;
}
</style>
