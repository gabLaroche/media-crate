<script setup>
import { ref } from "vue";
import { useAuth } from "@/composables/useAuth";
import { useRouter } from "vue-router";

const { login } = useAuth();

const email = ref("");
const password = ref("");
const error = ref(null);
const router = useRouter();

const submit = async () => {
    try {
        await login(email.value, password.value);
        router.push({ path: "/" });
    } catch (err) {
        error.value = err?.message;
    }
};
</script>

<template>
    <div>
        <h1>MediaCrate</h1>
        <h2>Login</h2>

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

<style scoped>
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
</style>
