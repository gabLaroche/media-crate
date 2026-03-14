<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { RiCloseLine } from "@remixicon/vue";
import { useReleases } from "@/composables/useReleases";
const { release, showButtons } = defineProps(["release", "showButtons"]);
const { deleteRelease } = useReleases();

const acquiredDate = new Date(release.acquired_date).toLocaleDateString(
    "en-CA",
    {
        year: "numeric",
        month: "short",
        day: "numeric",
    },
);

const emit = defineEmits(["deleted"]);

const deleteConfirmRef = ref(null);
const router = useRouter();

const goToEditPage = () => {
    router.push(`/edit/${release.id}`);
};

const deleteItem = () => {
    deleteRelease(release.id).then(() => {
        emit("deleted", release.id);
        deleteConfirmRef.value.close();
    });
};

const onDialogClick = (e) => {
    if (e.currentTarget === deleteConfirmRef.value) {
        deleteConfirmRef.value.close();
    }
};
</script>

<template>
    <div class="card">
        <img
            v-if="release.artwork_url"
            :src="release.artwork_url"
            width="80"
            height="80"
        />
        <img v-else src="/No_Image_Available.png" width="80" height="80" />

        <div>
            <strong>{{ release.album_name }}</strong>
            <div>By: {{ release.artist }}</div>
            <div>{{ release.release_date }}</div>
            <div v-if="release.acquired_date">
                Acquired:
                {{ acquiredDate }}
            </div>
        </div>

        <div v-if="showButtons" class="buttons">
            <button @click="goToEditPage">Edit</button>
            <button
                class="button--delete"
                command="show-modal"
                :commandfor="`delete-confirm-${release.id}`"
            >
                Delete
            </button>

            <dialog
                :id="`delete-confirm-${release.id}`"
                ref="deleteConfirmRef"
                @click.self="onDialogClick"
            >
                <div class="dialog-content" @click.stop>
                    <RiCloseLine
                        class="close-icon"
                        @click="deleteConfirmRef.close()"
                    />
                    <p>
                        Are you sure you want to delete
                        <strong>{{ release.album_name }}</strong> by
                        <strong>{{ release.artist }}</strong
                        >?
                    </p>
                    <div class="buttons">
                        <button class="button--delete" @click="deleteItem">
                            Yes
                        </button>
                        <button
                            :commandfor="`delete-confirm-${release.id}`"
                            command="close"
                        >
                            No
                        </button>
                    </div>
                </div>
            </dialog>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.card {
    display: flex;
    flex-direction: column;
    gap: 1.6rem;
    padding: 1rem;
    background-color: $primary-muted;
    border-radius: 8px;

    @media screen and (min-width: 768px) {
        align-items: center;
        flex-direction: row;
    }
}

.buttons {
    display: flex;
    gap: 1rem;
    width: 100%;

    @media screen and (min-width: 768px) {
        margin-left: auto;
        width: auto;
    }

    button {
        width: 100%;

        @media screen and (min-width: 768px) {
            width: auto;
        }
    }
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
    max-width: 400px;
    padding: 2rem;
    position: relative;

    .close-icon {
        position: absolute;
        top: 1rem;
        right: 1rem;
        color: $primary-dark;
        cursor: pointer;

        &:hover {
            color: $primary-darker;
        }
    }
}
</style>
