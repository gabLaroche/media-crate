<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
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
                command="show-modal"
                :commandfor="`delete-confirm-${mediaItem.id}`"
            >
                Delete
            </button>

            <dialog
                :id="`delete-confirm-${mediaItem.id}`"
                ref="deleteConfirmRef"
            >
                <p>
                    Are you sure you want to delete
                    <strong>{{ mediaItem.album_name }}</strong> by
                    <strong>{{ mediaItem.artist }}</strong
                    >?
                </p>
                <div class="buttons">
                    <button @click="deleteItem">Yes</button>
                    <button
                        :commandfor="`delete-confirm-${mediaItem.id}`"
                        command="close"
                    >
                        No
                    </button>
                </div>
            </dialog>
        </div>
    </div>
</template>

<style scoped>
.card {
    align-items: center;
    display: flex;
    gap: 16px;
    padding: 10px;
    border-bottom: 1px solid #eee;
}

.buttons {
    display: flex;
    gap: 10px;
    margin-left: auto;
}

dialog {
    max-width: 400px;
}
</style>
