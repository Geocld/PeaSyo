<script setup lang="ts">
import { storeToRefs } from 'pinia';
import VConsole from 'vconsole';
import MainFooter from './components/MainFooter.vue';
import MainHeader from './components/MainHeader.vue';
import { usePageStore } from './store/page';
import InfoPanel from './components/InfoPanel.vue';
import { useDualSenseStore } from './store/dualsense.ts';
import OutputPanel from './components/OutputPanel.vue';
import { useOverlayHeader } from './composibles/useOverlayHeader';
import OverlayHeader from './components/OverlayHeader.vue';

const dualsenseStore = useDualSenseStore()
const pageStore = usePageStore()

// const vconsole = new VConsole();
</script>

<template>
  <MainHeader />

  <main>
    <div class="flex flex-col lg:grid lg:grid-cols-[400px_1fr] gap-3 flex-grow py-5">
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
