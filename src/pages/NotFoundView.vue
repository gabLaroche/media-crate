<script setup>
import { useRouter } from "vue-router";
import { useAuth } from "@/composables/useAuth";

const router = useRouter();
const { user } = useAuth();

const goHome = () => {
    router.push(user.value ? "/" : "/login");
};
</script>

<template>
    <div class="error-page">
        <div class="error-page__content">
            <span class="error-page__code">404</span>
            <div class="error-page__divider" />
            <div class="error-page__body">
                <h1 class="error-page__title">Page not found</h1>
                <p class="error-page__message">
                    This page doesn't exist or may have been moved.
                </p>
                <button @click="goHome">
                    {{ user ? "Back to my collection" : "Go to login" }}
                </button>
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

    &__code {
        font-size: 6rem;
        font-weight: 300;
        color: $primary;
        line-height: 1;
        letter-spacing: -4px;
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
