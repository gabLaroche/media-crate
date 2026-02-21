<script setup>
import { ref } from "vue";
import { useAuth } from "@/composables/useAuth";

const { login } = useAuth();

const email = ref("");
const password = ref("");
const error = ref(null);

const submit = async () => {
    const { error: err } = await login(email.value, password.value);
    error.value = err?.message;
};
</script>

<template>
    <div>
        <h1>Login</h1>

        <form @submit.prevent="submit">
            <input v-model="email" placeholder="Email" />
            <input v-model="password" type="password" />
            <button>Login</button>
        </form>

        <p v-if="error">{{ error }}</p>
    </div>
</template>
