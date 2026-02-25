<script setup>
import { reactive, computed, ref, watch } from "vue";
import { vMaska } from "maska/vue";
import { useAuth } from "@/composables/useAuth";
import { useMediaItems } from "@/composables/useMediaItems";
import { useSources } from "@/composables/useSources";
import DiscogsSearch from "@/components/DiscogsSearch.vue";
import SourceSelect from "@/components/SourceSelect.vue";

const { addMediaItem, updateMediaItem } = useMediaItems();
const { getOrCreateSource } = useSources();
const { user } = useAuth();

const { mediaItem } = defineProps(["mediaItem"]);
const emit = defineEmits(["submitted"]);

const today = new Date();
const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];

const form = reactive({
    album_name: "",
    artist: "",
    release_date: "",
    acquired_date: localDate,
    source_id: "",
    source_name: "",
    media_type: "cd",
    condition: "used",
    exclude_from_randomizer: false,
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
    let sourceId = form.source_id;

    // If user typed a new source
    if (!sourceId && form.source_name?.trim()) {
        sourceId = await getOrCreateSource(form.source_name);
    }

    form.source_id = sourceId;

    const payload = { ...form };
    delete payload.source_name;

    if (mediaItem) {
        await updateMediaItem(mediaItem.id, payload)
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
        await addMediaItem(payload)
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
    form.source_id = "";
    form.source_name = "";
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

        <div class="field-wrapper">
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
        </div>
        <div class="field-wrapper">
            <label for="release_date">Release Date:</label>
            <input
                id="release_date"
                type="text"
                v-maska="'####'"
                v-model="form.release_date"
            />
            <label for="acquired_date">Acquired Date:</label>
            <input
                id="acquired_date"
                type="date"
                v-model="form.acquired_date"
            />
        </div>
        <SourceSelect
            v-model="form.source_id"
            v-model:typed="form.source_name"
        />

        <div class="field-wrapper">
            <label for="condition">Type:</label>
            <select id="type" v-model="form.media_type">
                <option value="cd">CD</option>
                <option value="vinyl">Vinyl</option>
                <option value="cassette">Cassette</option>
            </select>
        </div>

        <div class="field-wrapper">
            <label for="condition">Condition:</label>
            <select id="condition" v-model="form.condition">
                <option value="new">New</option>
                <option value="used">Used</option>
            </select>
        </div>

        <div class="field-wrapper">
            <label for="notes">
                <span>Notes:</span>
                <span class="optional">(optional)</span>
            </label>
            <textarea id="notes" v-model="form.notes" />
        </div>

        <div class="field-wrapper field-wrapper--checkbox">
            <label for="exclude_from_randomizer">
                <span>Exclude from Randomizer:</span>
                <span class="optional">(optional)</span>
            </label>
            <input
                id="exclude_from_randomizer"
                type="checkbox"
                v-model="form.exclude_from_randomizer"
            />
        </div>

        <button :disabled="isFormDisabled">
            {{ !mediaItem ? "Add Media item" : "Update Media item" }}
        </button>
    </form>
</template>
