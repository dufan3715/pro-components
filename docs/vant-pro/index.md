---
layout: doc
---

<script setup>
import { useRouter } from 'vitepress'
import { onMounted } from 'vue'

const router = useRouter()

onMounted(() => {
  router.go('/vant-pro/guide/introduction')
})
</script>
