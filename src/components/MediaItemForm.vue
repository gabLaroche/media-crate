<script setup>
import { reactive, computed, ref, watch } from "vue";
import { vMaska } from "maska/vue";
import { useMediaItems } from "@/composables/useMediaItems";
import DiscogsSearch from "@/components/DiscogsSearch.vue";

const { addMediaItem, updateMediaItem } = useMediaItems();

const { mediaItem } = defineProps(["mediaItem"]);
const emit = defineEmits(["submitted"]);

const form = reactive({
    album_name: "",
    artist: "",
    release_date: "",
    acquired_date: "",
    source: "",
    media_type: "cd",
    condition: "used",
    notes: "",
});

const isFormSubmitting = ref(false);

const isFormDisabled = computed(() => {
    return !form.album_name || !form.artist || !form.release_date;
});

watch(
    () => mediaItem,
    (val) => {
        if (val) Object.assign(form, val);
    },
    { immediate: true },
);

const submit = async () => {
    isFormSubmitting.value = true;
    if (mediaItem) {
        await updateMediaItem(mediaItem.id, form)
            .then(() => {
                resetForm();
                emit("submitted");
            })
            .catch((error) => {
                console.error(error);
            })
            .finally(() => {
                isFormSubmitting.value = false;
            });
    } else {
        await addMediaItem(form)
            .then(() => {
                resetForm();
            })
            .catch((error) => {
                console.error(error);
            })
            .finally(() => {
                isFormSubmitting.value = false;
            });
    }
};

const resetForm = () => {
    form.album_name = "";
    form.artist = "";
    form.release_date = "";
    form.acquired_date = "";
    form.source = "";
    form.condition = "used";
    form.media_type = "cd";
    form.notes = "";
    form.artwork_url = "";
};

const autofill = (release) => {
    const [artist, album] = release.title.split(" - ");

    form.artist = artist || "";
    form.album_name = album || "";
    form.release_date = release.year || "";
    form.artwork_url = release.cover_image || "";
};
</script>

<template>
    <DiscogsSearch v-if="!mediaItem" @selected="autofill" />
    <form @submit.prevent="submit">
        <div v-if="form.artwork_url">
            <img :src="form.artwork_url" width="150" />
        </div>

        <label for="album_name">Album:</label>
        <input
            id="album_name"
            v-model="form.album_name"
            placeholder="Album"
            required
        />
        <label for="artist">Artist:</label>
        <input
            id="artist"
            v-model="form.artist"
            placeholder="Artist"
            required
        />
        <label for="release_date">Release Date:</label>
        <input
            id="release_date"
            type="text"
            v-maska="'####'"
            v-model="form.release_date"
        />
        <label for="acquired_date">Acquired Date:</label>
        <input id="acquired_date" type="date" v-model="form.acquired_date" />
        <label for="source">Source:</label>
        <input id="source" v-model="form.source" placeholder="Source" />

        <label for="condition">Type:</label>
        <select id="type" v-model="form.media_type">
            <option value="cd">CD</option>
            <option value="vinyl">Vinyl</option>
            <option value="cassette">Cassette</option>
        </select>

        <label for="condition">Condition:</label>
        <select id="condition" v-model="form.condition">
            <option value="new">New</option>
            <option value="used">Used</option>
        </select>

        <label for="notes">Notes:</label>
        <textarea id="notes" v-model="form.notes" />
        <button :disabled="isFormDisabled">
            {{ !mediaItem ? "Add Media item" : "Update Media item" }}
        </button>
    </form>
</template>

<style scoped></style>
