<script setup lang="ts">
import { useDualSenseStore } from '@/store/dualsense';
import DualSenseModel from './DualSenseModel.vue';
import AccelValueBar from './AccelValueBar.vue';
import { storeToRefs } from 'pinia';
import Cube3D from './common/Cube3D.vue';
import SwitchBox from './common/SwitchBox.vue';
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import SelectBox from './common/SelectBox.vue';
const dualsenseStore = useDualSenseStore();
const { state } = storeToRefs(dualsenseStore)
const { t } = useI18n()
const ACCEL_RES_PER_G = 8192;
const STANDARD_GRAVITY = 9.80665;

const formatAccel = (num: number) => {
    return ((num / ACCEL_RES_PER_G) * STANDARD_GRAVITY).toFixed(5) + 'm/s²'
}
const showValue = ref(0)
const showValueSets = computed(() => {
    return [
        {
            value: 0,
            label: t('info_panel.model_value.off')
        },
        {
            value: 1,
            label: t('info_panel.model_value.on')
        },
    ]
})
</script>

<template>
    <div class="flex flex-col items-center max-w-500px mx-auto">
        <h1 class="dou-sc-subtitle flex flex-col gap-2 items-center">{{ $t('info_panel.title_buttons') }}
            <SelectBox v-model="showValue" :options="showValueSets" />
        </h1>
        <DualSenseModel :showValue="Boolean(showValue)" />
        <h1 class="dou-sc-subtitle">{{ $t('info_panel.title_gyroscope') }}</h1>
        <AccelValueBar :title="$t('info_panel.pitch')" :value="state.axes.gyroX" />
        <AccelValueBar :title="$t('info_panel.yaw')" :value="state.axes.gyroY" />
        <AccelValueBar :title="$t('info_panel.roll')" :value="state.axes.gyroZ" />
        <h1 class="dou-sc-subtitle">{{ $t('info_panel.title_accelerometer') }}</h1>

        <div class="flex justify-between w-full text-primary font-sans">
            <p class="font-bold">X</p>
            <p class="w-1/2 text-right">{{ formatAccel(state.axes.accelX) }}</p>
        </div>
        <div class="flex justify-between w-full text-primary font-sans">
            <p class="font-bold">Y</p>
            <p class="w-1/2 text-right">{{ formatAccel(state.axes.accelY) }}</p>
        </div>
        <div class="flex justify-between w-full text-primary font-sans">
            <p class="font-bold">Z</p>
            <p class="w-1/2 text-right">{{ formatAccel(state.axes.accelZ) }}</p>
        </div>
    </div>
</template>

<style scoped></style>
