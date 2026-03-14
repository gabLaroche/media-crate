<script setup>
import { useRouter } from "vue-router";

const router = useRouter();
</script>

<template>
    <div class="error-page">
        <div class="error-page__content">
            <span class="error-page__icon">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="52"
                    height="52"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                >
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
            </span>
            <div class="error-page__divider" />
            <div class="error-page__body">
                <h1 class="error-page__title">This collection is private</h1>
                <p class="error-page__message">
                    The owner hasn't made their collection public yet.
                </p>
                <button @click="router.back()">Go back</button>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
.error-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: -16px;
    background-color: $primary-lighter;

    &__content {
        display: flex;
        align-items: center;
        gap: 2rem;
    }

    &__icon {
        color: $primary;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    &__divider {
        width: 1px;
        height: 80px;
        background-color: $neutral-light;
    }

    &__body {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    &__title {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 700;
        color: $neutral-dark;
    }

    &__message {
        margin: 0 0 0.75rem;
        color: $neutral-mid;
        font-size: 0.95rem;
    }

    button {
        align-self: flex-start;
    }
}
</style>
