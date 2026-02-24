<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { RiCloseLine } from "@remixicon/vue";
import { useMediaItems } from "@/composables/useMediaItems";
const { mediaItem, showButtons } = defineProps(["mediaItem", "showButtons"]);
const { deleteMediaItem } = useMediaItems();

const acquiredDate = new Date(mediaItem.acquired_date).toLocaleDateString(
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
    router.push(`/edit/${mediaItem.id}`);
};

const deleteItem = () => {
    deleteMediaItem(mediaItem.id).then(() => {
        emit("deleted", mediaItem.id);
        deleteConfirmRef.value.close();
    });
};

const onDialogClick = (e) => {
    console.log("e", e);
    console.log("deleteConfirmRef", deleteConfirmRef.value);
    if (e.currentTarget === deleteConfirmRef.value) {
        deleteConfirmRef.value.close();
    }
};
</script>

<template>
    <div class="card">
        <img
            v-if="mediaItem.artwork_url"
            :src="mediaItem.artwork_url"
            width="80"
            height="80"
        />
        <img v-else src="/No_Image_Available.jpg" width="80" height="80" />

        <div>
            <strong>{{ mediaItem.artist }}</strong>
            <div>{{ mediaItem.album_name }}</div>
            <div>{{ mediaItem.release_date }}</div>
            <div>
                Acquired:
                {{ acquiredDate }}
            </div>
        </div>

        <div v-if="showButtons" class="buttons">
            <button @click="goToEditPage">Edit</button>
            <button
                class="button--delete"
                command="show-modal"
                :commandfor="`delete-confirm-${mediaItem.id}`"
            >
                Delete
            </button>

            <dialog
                :id="`delete-confirm-${mediaItem.id}`"
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
                        <strong>{{ mediaItem.album_name }}</strong> by
                        <strong>{{ mediaItem.artist }}</strong
                        >?
                    </p>
                    <div class="buttons">
                        <button class="button--delete" @click="deleteItem">
                            Yes
                        </button>
                        <button
                            :commandfor="`delete-confirm-${mediaItem.id}`"
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
    gap: 16px;
    padding: 10px;
    background-color: $primary-muted;
    border-radius: 8px;

    @media screen and (min-width: 768px) {
        align-items: center;
        flex-direction: row;
    }
}

.buttons {
    display: flex;
    gap: 10px;
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
    padding: 20px;
    position: relative;

    .close-icon {
        position: absolute;
        top: 10px;
        right: 10px;
        color: $primary-dark;
        cursor: pointer;

        &:hover {
            color: $primary-darker;
        }
    }
}
</style>
