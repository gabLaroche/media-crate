<script setup>
import { ref } from "vue";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/composables/useAuth";
import { sanitizeError } from "@/lib/sanitizeError";

const { user } = useAuth();

const type = ref("bug");
const message = ref("");
const saving = ref(false);
const success = ref(false);
const error = ref("");

const submit = async () => {
    saving.value = true;
    success.value = false;
    error.value = "";

    const { error: err } = await supabase.from("feedback").insert({
        user_id: user.value.id,
        type: type.value,
        message: message.value.trim(),
    });

    if (err) {
        error.value = sanitizeError(err);
    } else {
        message.value = "";
        success.value = true;
    }

    saving.value = false;
};
</script>

<template>
    <div class="feedback-page">
        <h1>Feedback</h1>

        <section class="section">
            <p class="section__description">
                Found a bug, or have an idea for something MediaCrate should
                do? Let us know below.
            </p>

            <form @submit.prevent="submit">
                <div class="field">
                    <label for="type">Type</label>
                    <select id="type" v-model="type">
                        <option value="bug">Bug report</option>
                        <option value="feature">Feature request</option>
                    </select>
                </div>

                <div class="field">
                    <label for="message">Message</label>
                    <textarea
                        id="message"
                        v-model="message"
                        rows="6"
                        maxlength="2000"
                        placeholder="What happened, or what would you like to see?"
                        required
                    ></textarea>
                </div>

                <p v-if="error" class="error">{{ error }}</p>
                <p v-if="success" class="success">
                    Thanks! Your feedback has been sent.
                </p>

                <button :disabled="saving || !message.trim()">
                    {{ saving ? "Sending…" : "Send feedback" }}
                </button>
            </form>
        </section>
    </div>
</template>

<style lang="scss" scoped>
.feedback-page {
    max-width: 540px;
    margin: 0 auto;
    padding: 0.8rem;

    h1 {
        margin-bottom: 0.75rem;
    }
}

.section {
    background-color: $primary-muted;
    color: $neutral-dark;
    border-radius: 8px;
    padding: 0.875rem;
}

.section__description {
    font-size: 0.875rem;
    margin-bottom: 0.625rem;
    opacity: 0.8;
}

form {
    gap: 0.625rem;
}

.field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    label {
        font-size: 0.875rem;
        font-weight: 500;
    }

    textarea {
        resize: vertical;
        font-family: inherit;
    }
}

.error {
    color: $danger;
    font-size: 0.875rem;
    margin-bottom: 1.2rem;
}

.success {
    color: green;
    font-size: 0.875rem;
    margin-bottom: 1.2rem;
}

button {
    width: 100%;
    @media (min-width: 768px) {
        width: fit-content;
    }
}
</style>
