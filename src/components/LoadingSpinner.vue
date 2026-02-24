<template>
    <div class="loading-spinner">
        <RiLoader4Line size="120px" />
    </div>
</template>

<script setup>
import { RiLoader4Line } from "@remixicon/vue";
</script>

<style lang="scss" scoped>
.loading-spinner {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;

    svg {
        animation: spin 1s linear infinite;
        color: $primary;
    }
}

@keyframes spin {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(360deg);
    }
}
</style>
