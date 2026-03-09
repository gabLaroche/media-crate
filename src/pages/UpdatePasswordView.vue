<script setup>
import { ref } from "vue";
import { useAuth } from "@/composables/useAuth";
import { useRouter } from "vue-router";
import PasswordInput from "@/components/PasswordInput.vue";

const { updatePassword } = useAuth();

const password = ref("");
const isPasswordValid = ref(false);
const error = ref(null);
const router = useRouter();

const submit = async () => {
    const { error: err } = await updatePassword(password.value)
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
            <PasswordInput
                v-model:password="password"
                v-model:password-validated="isPasswordValid"
            />
            <button :disabled="!isPasswordValid">Update Password</button>
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
