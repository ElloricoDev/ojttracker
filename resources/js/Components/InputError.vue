<script setup>
defineProps({
    message: {
        type: String,
    },
});
</script>

<template>
    <div v-show="message" class="mt-1 flex items-center gap-1.5">
        <i class="fa-solid fa-circle-exclamation text-xs text-rose-500"></i>
        <p class="text-xs text-rose-600" style="font-family: 'Manrope', sans-serif;">{{ message }}</p>
    </div>
</template>
