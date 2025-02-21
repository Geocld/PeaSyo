<script setup lang="ts">
import { useElementBounding } from '@vueuse/core';
import { computed, ref } from 'vue';

const modelValue = defineModel<number>({ required: true })

const props = defineProps<{
    min: number,
    max: number
}>()

const TrackRef = ref<HTMLDivElement | null>()

const { width } = useElementBounding(TrackRef, {
    windowScroll: false
})

const factor = computed(() => {
    return width.value / (props.max - props.min)
})

const isIndicatorShown = ref(false)

let startX = 0
let currentValue = 0

const onPointerDown = (e: PointerEvent) => {
    isIndicatorShown.value = true;
    (e.target as HTMLDivElement).setPointerCapture(e.pointerId)
    startX = e.clientX || e.touches?.[0].clientX
    currentValue = modelValue.value
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
}

const onPointerMove = (e: PointerEvent) => {
    const currentX = e.clientX || e.touches?.[0].clientX
    const deltaX = (currentX - startX) / factor.value
    const newValue = currentValue + deltaX
    if (newValue < props.min) {
        modelValue.value = props.min
    } else if (newValue > props.max) {
        modelValue.value = props.max
    } else {
        modelValue.value = newValue
    }

    console.log('modelValue.value:', modelValue.value)
}

const onPointerUp = (e: PointerEvent) => {
    isIndicatorShown.value = false;
    (e.target as HTMLDivElement).releasePointerCapture(e.pointerId)
    window.removeEventListener('pointermove', onPointerMove)
    window.removeEventListener('pointerup', onPointerUp)
    window.removeEventListener('pointercancel', onPointerUp)
    // autoResetMsodelValue()
}

const autoResetModelValue = () => {
    let initialSpeed = 1
    const interval = setInterval(() => {
        if (modelValue.value <= 2) {
            modelValue.value = 0
            clearInterval(interval)
        } else {
            modelValue.value = Math.max(0, modelValue.value - initialSpeed)
        }
        initialSpeed = initialSpeed + 1
    }, 10)
}

</script>

<template>
    <div ref="TrackRef" class="w-auto h-2px rounded-full relative dou-sc-autobg" :style="{
        '--current-x': ((modelValue - props.min) / (props.max - props.min)) * width + 'px'
    }">
        <div class="track"></div>
        <div class="thumb" @pointerdown="onPointerDown"></div>
        <Transition name="fade">
            <div v-if="isIndicatorShown" class="indicator">
                {{ modelValue.toFixed(0) }}
            </div>
        </Transition>
    </div>
</template>

<style scoped lang="scss">
.thumb {
    @apply cursor-grab touch-none;
    @apply w-4 h-4 rounded-full bg-primary absolute top-1/2 -left-2 translate-x-[var(--current-x)] -translate-y-1/2;
}

.track {
    @apply bg-primary/60 absolute top-0 left-0 bottom-0 w-[var(--current-x)];
}

.indicator {
    @apply pointer-events-none text-xs;
    @apply absolute -top-8 left-0 px-2 rounded-full bg-white dark-bg-black dou-sc-capsule;
    @apply transform-gpu translate-x-[calc(var(--current-x)-50%)];
}
</style>
