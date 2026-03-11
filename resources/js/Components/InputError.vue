<script setup>
defineProps({
    message: {
        type: String,
    },
});
</script>

<template>
    <div v-show="message">
        <p class="text-sm text-rose-600" style="font-family: 'Manrope', sans-serif;">
            {{ message }}
        </p>
    </div>
</template>
