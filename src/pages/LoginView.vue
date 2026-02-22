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
    const { error: err } = await login(email.value, password.value)
        .then(() => {
            router.push({ path: "/" });
        })
        .catch(() => {
            error.value = err?.message;
        });
};
</script>

<template>
    <div>
        <h1>Login</h1>

        <form @submit.prevent="submit">
            <label for="email">Email:</label>
            <input id="email" v-model="email" />
            <label for="password">Password:</label>
            <input id="password" v-model="password" type="password" />
            <button>Login</button>
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
    gap: 10px;
}

button {
}
</style>
