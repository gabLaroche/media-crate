<script setup>
defineProps({ text: { type: String, required: true } });
</script>

<template>
    <span class="tooltip" tabindex="0">
        <slot />
        <span class="tooltip__bubble" role="tooltip">{{ text }}</span>
    </span>
</template>

<style scoped lang="scss">
.tooltip {
    position: relative;
    display: inline-flex;
    align-items: center;
    cursor: help;

    &__bubble {
        position: absolute;
        bottom: calc(100% + 8px);
        left: 50%;
        transform: translateX(-50%) translateY(4px);
        background-color: $surface;
        color: $text;
        border: 1px solid $border;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        padding: 0.5rem 0.75rem;
        width: max-content;
        max-width: 220px;
        font-size: 0.75rem;
        font-weight: 400;
        text-transform: none;
        letter-spacing: normal;
        white-space: normal;
        text-align: left;
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transition:
            opacity 0.15s ease,
            transform 0.15s ease;
        z-index: 20;
    }

    &:hover .tooltip__bubble,
    &:focus-visible .tooltip__bubble {
        opacity: 1;
        visibility: visible;
        transform: translateX(-50%) translateY(0);
    }
}
</style>
