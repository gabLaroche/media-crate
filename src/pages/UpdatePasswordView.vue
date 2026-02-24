<script setup>
import { ref } from "vue";
import { useAuth } from "@/composables/useAuth";
import { useRouter } from "vue-router";

const { resetPassword } = useAuth();

const password = ref("");
const confirmPassword = ref("");
const error = ref(null);
const router = useRouter();

const submit = async () => {
    const { error: err } = await resetPassword(password.value)
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
        <h1>MediaCrate</h1>
        <h2>Update Password</h2>

        <form @submit.prevent="submit">
            <label for="password">Password:</label>
            <input id="password" v-model="password" type="password" />
            <label for="confirmPassword">Confirm Password:</label>
            <input
                id="confirmPassword"
                v-model="confirmPassword"
                type="password"
            />
            <button
                :disabled="password !== confirmPassword && password.length >= 6"
            >
                Update Password
            </button>
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
    min-width: 25vw;
    max-width: 400px;
}
</style>
