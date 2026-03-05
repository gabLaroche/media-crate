<script setup>
import { ref, computed } from "vue";
import { useAuth } from "@/composables/useAuth";
import { useRouter } from "vue-router";
import PasswordInput from "@/components/PasswordInput.vue";

const { signUp } = useAuth();

const email = ref("");
const password = ref("");
const isPasswordValid = ref(false);
const displayName = ref("");
const error = ref(null);
const router = useRouter();

const submit = async () => {
    try {
        await signUp(email.value, password.value, displayName.value);
        router.push({ path: "/confirm-sign-up" });
    } catch (err) {
        error.value = err?.message;
    }
};

const isFormValid = computed(
    () => displayName.value && email.value && isPasswordValid.value,
);
</script>

<template>
    <div>
        <h1>MediaCrate</h1>
        <h2>Create Account</h2>

        <form @submit.prevent="submit">
            <label for="displayName">Display Name:</label>
            <input id="displayName" v-model="displayName" type="text" />
            <label for="email">Email:</label>
            <input id="email" v-model="email" type="email" />
            <PasswordInput
                v-model:password="password"
                v-model:password-validated="isPasswordValid"
            />

            <button :disabled="!isFormValid">Create Account</button>
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
