<script setup>
import { ref } from "vue";
import { useAuth } from "@/composables/useAuth";
import { useRouter } from "vue-router";

const { resetPassword } = useAuth();

const email = ref("");
const error = ref(null);
const router = useRouter();

const submit = async () => {
    const { error: err } = await resetPassword(email.value)
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
        <h2>Reset Password</h2>

        <form @submit.prevent="submit">
            <label for="email">email:</label>
            <input id="email" v-model="email" type="email" />

            <button :disabled="email.length === 0">Reset Password</button>
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
