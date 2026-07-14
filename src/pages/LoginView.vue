<script setup>
import { ref } from "vue";
import { useAuth } from "@/composables/useAuth";
import { useRoute, useRouter } from "vue-router";
import { sanitizeError } from "@/lib/sanitizeError";

const { login } = useAuth();

const email = ref("");
const password = ref("");
const error = ref(null);
const router = useRouter();
const route = useRoute();

const sessionExpired = route.query.reason === "session-expired";

const submit = async () => {
    try {
        await login(email.value, password.value);
        router.push({ path: "/" });
    } catch (err) {
        error.value = sanitizeError(err);
    }
};
</script>

<template>
    <div>
        <h1>MediaCrate</h1>
        <h2>Login</h2>

        <p v-if="sessionExpired" class="session-expired">
            Your session timed out, please log in again.
        </p>

        <form @submit.prevent="submit">
            <label for="email">Email:</label>
            <input id="email" v-model="email" type="email" />
            <label for="password">Password:</label>
            <input id="password" v-model="password" type="password" />
            <router-link to="/reset-password"
                >Forgot your password?</router-link
            >
            <button>Login</button>
            <p>
                No account?
                <router-link to="/create-account">Sign up here.</router-link>
            </p>
        </form>

        <p v-if="error">{{ error }}</p>
    </div>
</template>

<style lang="scss" scoped>
h1 {
    text-align: center;
}

form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-width: 25vw;
    max-width: 400px;
}

.session-expired {
    color: $warning-dark;
    font-size: 0.9rem;
}
</style>
