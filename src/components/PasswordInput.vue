<script setup>
import { ref, computed, watch, shallowRef } from "vue";
import { RiEyeLine, RiEyeOffLine } from "@remixicon/vue";
const password = defineModel("password", { default: "" });
const passwordValidated = defineModel("passwordValidated", { default: false });

const confirmPassword = ref("");
const passwordInputRef = ref(null);
const confirmPasswordInputRef = ref(null);
const passwordVisibilityIcon = shallowRef(RiEyeLine);
const confirmPasswordVisibilityIcon = shallowRef(RiEyeLine);
const passwordRules = computed(() => ({
    minLength: password.value.length >= 6,
    hasUppercase: /[A-Z]/.test(password.value),
    hasLowercase: /[a-z]/.test(password.value),
    hasNumber: /[0-9]/.test(password.value),
    hasSpecial: /[^A-Za-z0-9]/.test(password.value),
}));

const passwordsMatch = computed(
    () => password.value === confirmPassword.value && password.value.length > 0,
);

const isPasswordValid = computed(
    () =>
        Object.values(passwordRules.value).every(Boolean) &&
        passwordsMatch.value,
);

const togglePasswordVisibility = () => {
    const passwordInput = passwordInputRef.value;
    if (passwordInput) {
        const isTypePassword = passwordInput.type === "password";
        passwordInput.type = isTypePassword ? "text" : "password";
        passwordVisibilityIcon.value = isTypePassword
            ? RiEyeLine
            : RiEyeOffLine;
    }
};

const toggleConfirmPasswordVisibility = () => {
    const confirmPasswordInput = confirmPasswordInputRef.value;
    if (confirmPasswordInput) {
        const isTypePassword = confirmPasswordInput.type === "password";
        confirmPasswordInput.type = isTypePassword ? "text" : "password";
        confirmPasswordVisibilityIcon.value = isTypePassword
            ? RiEyeLine
            : RiEyeOffLine;
    }
};

watch(isPasswordValid, (val) => {
    passwordValidated.value = val;
});
</script>
<template>
    <div class="password-input">
        <div class="password-input__field-container">
            <label for="password">Password:</label>
            <div class="password-input__field">
                <input
                    id="password"
                    v-model="password"
                    type="password"
                    ref="passwordInputRef"
                />
                <button
                    class="button button--field-icon"
                    type="button"
                    @click="togglePasswordVisibility"
                >
                    <component :is="passwordVisibilityIcon" />
                </button>
            </div>
        </div>
        <div class="password-input__field-container">
            <label for="confirmPassword">Confirm Password:</label>
            <div class="password-input__field">
                <input
                    id="confirmPassword"
                    v-model="confirmPassword"
                    type="password"
                    ref="confirmPasswordInputRef"
                />
                <button
                    class="button button--field-icon"
                    type="button"
                    @click="toggleConfirmPasswordVisibility"
                >
                    <component :is="confirmPasswordVisibilityIcon" />
                </button>
            </div>
        </div>
        <ul class="password-input__rules">
            <li :class="{ valid: passwordRules.minLength }">
                At least 6 characters
            </li>
            <li :class="{ valid: passwordRules.hasUppercase }">
                One uppercase letter
            </li>
            <li :class="{ valid: passwordRules.hasLowercase }">
                One lowercase letter
            </li>
            <li :class="{ valid: passwordRules.hasNumber }">One digit</li>
            <li :class="{ valid: passwordRules.hasSpecial }">One symbol</li>
            <li :class="{ valid: passwordsMatch }">Passwords match</li>
        </ul>
    </div>
</template>
<style scoped lang="scss">
.password-input {
    display: flex;
    flex-direction: column;
    gap: 8px;

    &__field-container {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    &__field {
        position: relative;

        input {
            width: 100%;
        }
    }

    &__rules {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .button--field-icon {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        height: 100%;
    }

    .valid {
        color: $success;
    }
}
</style>
