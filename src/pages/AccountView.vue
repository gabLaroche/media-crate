<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/composables/useAuth";

const { user, logout } = useAuth();
const router = useRouter();

const displayName = ref(user.value?.user_metadata?.display_name || "");
const displayNameSaving = ref(false);
const displayNameSuccess = ref(false);
const displayNameError = ref("");

const deleteConfirmText = ref("");
const deleteLoading = ref(false);
const deleteError = ref("");
const deleteDialogRef = ref(null);

const email = computed(() => user.value?.email || "");
const deleteConfirmMatch = computed(
    () => deleteConfirmText.value.trim() === email.value,
);

const saveDisplayName = async () => {
    displayNameSaving.value = true;
    displayNameError.value = "";
    displayNameSuccess.value = false;

    const { error } = await supabase.auth.updateUser({
        data: { display_name: displayName.value.trim() },
    });

    if (error) {
        displayNameError.value = error.message;
    } else {
        displayNameSuccess.value = true;
        setTimeout(() => (displayNameSuccess.value = false), 3000);
    }

    displayNameSaving.value = false;
};

const deleteAccount = async () => {
    if (!deleteConfirmMatch.value) return;
    deleteLoading.value = true;
    deleteError.value = "";

    const {
        data: { session },
        error: sessionError,
    } = await supabase.auth.refreshSession();
    if (sessionError || !session) {
        deleteError.value =
            "Could not verify your session. Please log in again.";
        deleteLoading.value = false;
        return;
    }

    const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
        {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${session.access_token}`,
            },
        },
    );

    if (!res.ok) {
        const body = await res.json();
        deleteError.value = body.error || "Failed to delete account.";
        deleteLoading.value = false;
        return;
    }

    await logout();
    router.push("/login");
};
</script>

<template>
    <div class="account-page">
        <h1>Account</h1>

        <!-- Profile section -->
        <section class="section">
            <h2>Profile</h2>

            <div class="field">
                <label>Email</label>
                <input type="text" :value="email" disabled />
            </div>

            <div class="field">
                <label for="display_name">Display name</label>
                <input
                    id="display_name"
                    v-model="displayName"
                    type="text"
                    placeholder="Your name"
                    @keydown.enter.prevent="saveDisplayName"
                />
            </div>

            <p v-if="displayNameError" class="error">{{ displayNameError }}</p>
            <p v-if="displayNameSuccess" class="success">
                Display name updated!
            </p>

            <button @click="saveDisplayName" :disabled="displayNameSaving">
                {{ displayNameSaving ? "Saving…" : "Save" }}
            </button>
        </section>

        <!-- Danger zone -->
        <section class="section section--danger">
            <h2>Danger zone</h2>
            <p>
                Deleting your account is permanent and cannot be undone. All
                your collection data will be removed.
            </p>
            <button
                class="button--delete"
                command="show-modal"
                commandfor="delete-account-dialog"
            >
                Delete account
            </button>
        </section>

        <!-- Delete confirmation dialog -->
        <dialog
            id="delete-account-dialog"
            ref="deleteDialogRef"
            @click.self="deleteDialogRef.close()"
        >
            <div class="dialog-content" @click.stop>
                <h3>Delete account</h3>
                <p>
                    This will permanently delete your account and all your data.
                    To confirm, type your email address:
                    <strong>{{ email }}</strong>
                </p>

                <div class="field">
                    <input
                        v-model="deleteConfirmText"
                        type="text"
                        :placeholder="email"
                        autocomplete="off"
                    />
                </div>

                <p v-if="deleteError" class="error">{{ deleteError }}</p>

                <div class="dialog-actions">
                    <button
                        class="button--delete"
                        :disabled="!deleteConfirmMatch || deleteLoading"
                        @click="deleteAccount"
                    >
                        {{
                            deleteLoading
                                ? "Deleting…"
                                : "Yes, delete my account"
                        }}
                    </button>
                    <button command="close" commandfor="delete-account-dialog">
                        Cancel
                    </button>
                </div>
            </div>
        </dialog>
    </div>
</template>

<style lang="scss" scoped>
.account-page {
    max-width: 540px;
    margin: 0 auto;
    padding: 32px 16px;

    h1 {
        margin-bottom: 32px;
    }
}

.section {
    background-color: $primary-muted;
    border-radius: 8px;
    padding: 24px;
    margin-bottom: 24px;

    h2 {
        margin-top: 0;
        margin-bottom: 20px;
    }

    &--danger {
        border: 1px solid rgba(red, 0.3);

        h2 {
            color: red;
        }

        p {
            margin-bottom: 16px;
        }
    }
}

.field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 16px;

    label {
        font-size: 0.875rem;
        font-weight: 500;
    }
}

.error {
    color: red;
    font-size: 0.875rem;
    margin-bottom: 12px;
}

.success {
    color: green;
    font-size: 0.875rem;
    margin-bottom: 12px;
}

dialog {
    border: 0;
    background-color: transparent;

    &::backdrop {
        background-color: rgba($secondary-muted, 0.5);
    }
}

.dialog-content {
    background-color: $secondary-muted;
    border-radius: 8px;
    border: 1px solid $secondary-lighter;
    max-width: 420px;
    padding: 24px;

    h3 {
        margin-top: 0;
    }

    p {
        margin-bottom: 16px;
    }
}

.dialog-actions {
    display: flex;
    gap: 10px;
    margin-top: 20px;
    flex-wrap: wrap;
}
</style>
