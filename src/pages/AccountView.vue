<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/composables/useAuth";

const { user, logout } = useAuth();
const router = useRouter();

const displayName = ref(user.value?.user_metadata?.display_name || "");
const displayNameSaving = ref(false);
const displayNameSuccess = ref(false);
const displayNameError = ref("");

const quotaUsedBytes = ref(0);
const quotaMb = ref(50);
const quotaLoading = ref(true);

const fetchQuota = async () => {
    const { data } = await supabase
        .from("profiles")
        .select("used_bytes, upload_quota_mb")
        .eq("id", user.value.id)
        .single();
    if (data) {
        quotaUsedBytes.value = data.used_bytes ?? 0;
        quotaMb.value = data.upload_quota_mb ?? 50;
    }
    quotaLoading.value = false;
};

const quotaUsedMb = computed(() =>
    (quotaUsedBytes.value / 1024 / 1024).toFixed(1),
);
const quotaPercent = computed(() =>
    Math.min(
        100,
        Math.round(
            (quotaUsedBytes.value / (quotaMb.value * 1024 * 1024)) * 100,
        ),
    ),
);

const deleteConfirmText = ref("");
const deleteLoading = ref(false);
const deleteError = ref("");
const deleteDialogRef = ref(null);

const email = computed(() => user.value?.email || "");
const hasDevicesBeta = computed(
    () => user.value?.app_metadata?.devices_beta === true,
);
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

// --- Devices ---
const devices = ref([]);
const newDeviceName = ref("");
const deviceLoading = ref(false);
const deviceError = ref("");
const newToken = ref(null);
const newTokenCopied = ref(false);

const fetchDevices = async () => {
    const { data } = await supabase
        .from("devices")
        .select("id, name, last_seen, created_at")
        .order("created_at", { ascending: false });
    devices.value = data || [];
};

const generateToken = async () => {
    if (!newDeviceName.value.trim()) return;
    deviceLoading.value = true;
    deviceError.value = "";
    newToken.value = null;

    const token = crypto.randomUUID();

    const { error } = await supabase.rpc("register_device", {
        p_user_id: user.value.id,
        p_name: newDeviceName.value.trim(),
        p_token: token,
    });

    if (error) {
        deviceError.value = error.message;
    } else {
        newToken.value = token;
        newDeviceName.value = "";
        await fetchDevices();
    }

    deviceLoading.value = false;
};

const copyToken = async () => {
    await navigator.clipboard.writeText(newToken.value);
    newTokenCopied.value = true;
    setTimeout(() => (newTokenCopied.value = false), 2000);
};

const deleteDevice = async (id) => {
    await supabase.from("devices").delete().eq("id", id);
    devices.value = devices.value.filter((d) => d.id !== id);
};

const formatDate = (ts) =>
    ts
        ? new Date(ts).toLocaleDateString("en-CA", {
              year: "numeric",
              month: "short",
              day: "numeric",
          })
        : "Never";

onMounted(() => {
    fetchDevices();
    fetchQuota();
});
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

            <div class="quota" v-if="!quotaLoading">
                <div class="quota__label">
                    <span>Artwork storage</span>
                    <span>{{ quotaUsedMb }} MB / {{ quotaMb }} MB</span>
                </div>
                <div class="quota__bar">
                    <div
                        class="quota__fill"
                        :style="{ width: quotaPercent + '%' }"
                        :class="{
                            'quota__fill--warning': quotaPercent >= 80,
                            'quota__fill--full': quotaPercent >= 100,
                        }"
                    ></div>
                </div>
            </div>
        </section>

        <!-- Devices section -->
        <section v-if="hasDevicesBeta" class="section">
            <h2>Devices</h2>
            <p class="section__description">
                Generate a token to authenticate a MediaCrate randomizer. Each
                token is shown once — save it somewhere safe.
            </p>

            <div class="field">
                <label for="device_name">Device name</label>
                <input
                    id="device_name"
                    v-model="newDeviceName"
                    type="text"
                    placeholder="e.g. Living room randomizer"
                    @keydown.enter.prevent="generateToken"
                />
            </div>

            <p v-if="deviceError" class="error">{{ deviceError }}</p>

            <button
                @click="generateToken"
                :disabled="deviceLoading || !newDeviceName.trim()"
            >
                {{ deviceLoading ? "Generating…" : "Generate token" }}
            </button>

            <!-- New token display -->
            <div v-if="newToken" class="token-reveal">
                <p class="token-reveal__warning">
                    ⚠ Copy this token now — it won't be shown again.
                </p>
                <div class="token-reveal__value">
                    <code>{{ newToken }}</code>
                    <button class="token-reveal__copy" @click="copyToken">
                        {{ newTokenCopied ? "Copied!" : "Copy" }}
                    </button>
                </div>
            </div>

            <!-- Existing devices -->
            <div v-if="devices.length > 0" class="devices-list">
                <div
                    v-for="device in devices"
                    :key="device.id"
                    class="device-row"
                >
                    <div class="device-row__info">
                        <span class="device-row__name">{{ device.name }}</span>
                        <span class="device-row__meta"
                            >Last seen: {{ formatDate(device.last_seen) }}</span
                        >
                    </div>
                    <button
                        class="button--delete button--small"
                        @click="deleteDevice(device.id)"
                    >
                        Revoke
                    </button>
                </div>
            </div>
            <p v-else class="empty">No devices registered yet.</p>
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
    padding: 3.2rem 1.6rem;

    h1 {
        margin-bottom: 3.2rem;
    }
}

.section {
    background-color: $primary-muted;
    border-radius: 8px;
    padding: 2.4rem;
    margin-bottom: 2.4rem;

    h2 {
        margin-top: 0;
        margin-bottom: 2rem;
    }

    &--danger {
        border: 1px solid rgba(red, 0.3);

        h2 {
            color: red;
        }

        p {
            margin-bottom: 1.6rem;
        }
    }
}

.field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1.6rem;

    label {
        font-size: 0.875rem;
        font-weight: 500;
    }
}

.error {
    color: red;
    font-size: 0.875rem;
    margin-bottom: 1.2rem;
}

.success {
    color: green;
    font-size: 0.875rem;
    margin-bottom: 1.2rem;
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
    padding: 2.4rem;

    h3 {
        margin-top: 0;
    }

    p {
        margin-bottom: 1.6rem;
    }
}

.dialog-actions {
    display: flex;
    gap: 1rem;
    margin-top: 2.4rem;
    flex-wrap: wrap;
}

.section__description {
    font-size: 0.875rem;
    margin-bottom: 1.6rem;
    opacity: 0.8;
}

.token-reveal {
    margin-top: 1.6rem;
    padding: 1.2rem;
    background-color: rgba(orange, 0.08);
    border: 1px solid rgba(orange, 0.3);
    border-radius: 6px;

    &__warning {
        font-size: 0.875rem;
        font-weight: 600;
        margin-bottom: 0.8rem;
        color: orange;
    }

    &__value {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
    }

    code {
        font-family: monospace;
        font-size: 0.85rem;
        word-break: break-all;
        flex: 1;
    }

    &__copy {
        flex-shrink: 0;
        padding: 0.5rem 1rem;
        font-size: 0.8rem;
    }
}

.devices-list {
    margin-top: 2rem;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
}

.device-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.2rem;
    padding: 1rem 1.2rem;
    background-color: $secondary-muted;
    border-radius: 6px;

    &__info {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    &__name {
        font-weight: 500;
    }

    &__meta {
        font-size: 0.78rem;
        opacity: 0.6;
    }
}

.button--small {
    padding: 0.5rem 1rem;
    font-size: 0.8rem;
}

.quota {
    margin-top: 2.4rem;
    padding-top: 2.4rem;
    border-top: 1px solid rgba($secondary-lighter, 0.3);

    &__label {
        display: flex;
        justify-content: space-between;
        font-size: 0.875rem;
        margin-bottom: 0.6rem;
        opacity: 0.8;
    }

    &__bar {
        height: 6px;
        background-color: rgba($secondary-lighter, 0.2);
        border-radius: 99px;
        overflow: hidden;
    }

    &__fill {
        height: 100%;
        background-color: $secondary-lighter;
        border-radius: 99px;
        transition: width 0.3s ease;

        &--warning {
            background-color: orange;
        }

        &--full {
            background-color: red;
        }
    }
}

.empty {
    margin-top: 1.6rem;
    font-size: 0.875rem;
    opacity: 0.6;
}
</style>
