<script setup lang="ts">
// import VConsole from 'vconsole';
import { useI18n } from 'vue-i18n';
import MainHeader from './components/MainHeader.vue';
import InfoPanel from './components/InfoPanel.vue';
import OutputPanel from './components/OutputPanel.vue';

// const vconsole = new VConsole();

const { t } = useI18n()
</script>

<template>
  <div class="px-2 py-1 text-primary font-sans">
    <p class="text-sm">{{ $t('warnings.connect') }}</p>
  </div>
  <MainHeader />

  <main>
    <div class="flex flex-col lg:grid lg:grid-cols-[400px_1fr] gap-3 flex-grow pb-5">
      <div class="flex flex-col gap-3 items-start">
        <OutputPanel />
      </div>
      <div class="dou-sc-container">
        <InfoPanel />
      </div>
    </div>
  </main>
</template>

<style scoped>
main {
  @apply w-full max-w-[--max-width] mx-auto px-2;
  @apply flex flex-col flex-grow;
}
</style>
