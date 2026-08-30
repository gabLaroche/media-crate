<script setup>
import { ref } from "vue";

const { focusable = true } = defineProps({
    text: { type: String, required: true },
    focusable: { type: Boolean, default: true },
});

const triggerRef = ref(null);
const isVisible = ref(false);
const position = ref({});

const showTooltip = () => {
    const rect = triggerRef.value.getBoundingClientRect();
    position.value = {
        left: `${rect.left + rect.width / 2}px`,
        top: `${rect.top}px`,
    };
    isVisible.value = true;
};

const hideTooltip = () => {
    isVisible.value = false;
};
</script>

<template>
    <span
        ref="triggerRef"
        class="tooltip"
        :tabindex="focusable ? 0 : undefined"
        @mouseenter="showTooltip"
        @mouseleave="hideTooltip"
        @focus="showTooltip"
        @blur="hideTooltip"
    >
        <slot />
        <Teleport to="body">
            <span
                class="tooltip__bubble"
                :class="{ 'tooltip__bubble--visible': isVisible }"
                role="tooltip"
                :style="position"
                >{{ text }}</span
            >
        </Teleport>
    </span>
</template>

<style scoped lang="scss">
.tooltip {
    position: relative;
    display: inline-flex;
    align-items: center;
    cursor: help;
}

.tooltip__bubble {
    position: fixed;
    transform: translate(-50%, calc(-100% - 8px)) translateY(4px);
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
    z-index: 1000;

    &--visible {
        opacity: 1;
        visibility: visible;
        transform: translate(-50%, calc(-100% - 8px)) translateY(0);
    }
}
</style>
