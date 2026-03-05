<script setup>
import { reactive, computed, ref, watch } from "vue";
import { vMaska } from "maska/vue";
import { useReleases } from "@/composables/useReleases";
import { useSources } from "@/composables/useSources";
import DiscogsSearch from "@/components/DiscogsSearch.vue";
import SourceSelect from "@/components/SourceSelect.vue";
import { cleanTitle } from "@/lib/cleanTitle";

const { addRelease, updateRelease, bulkAddReleases } = useReleases();
const { getOrCreateSource } = useSources();

const { release, bulk } = defineProps(["release", "bulk"]);
const emit = defineEmits(["submitted"]);

const today = new Date();
const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];

// --- Single mode form ---
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
    artwork_file: null,
    discogs_master_id: null,
});

// --- Bulk mode shared fields ---
const bulkShared = reactive({
    artist: "",
    source_id: "",
    source_name: "",
    media_type: "cd",
    condition: "used",
});
const discogsSearchRef = ref(null);
// --- Bulk mode release rows ---
// Each row is seeded from a Discogs result. Users can tweak album_name,
// release_date, and notes per row.
const bulkRows = ref([]);

// Track Discogs IDs already added to prevent duplicates
const selectedDiscogsIds = computed(() =>
    bulkRows.value.map((r) => r.discogs_id),
);

const onDiscogsSelected = (release) => {
    // Derive artist + album from Discogs "Artist - Album" title format.
    // We split only on the first occurrence of " - " to handle edge cases.
    const cleaned = cleanTitle(release.title || "");
    const separatorIndex = cleaned.indexOf(" - ");
    const artist =
        separatorIndex !== -1 ? cleaned.slice(0, separatorIndex).trim() : "";
    const albumName =
        separatorIndex !== -1
            ? cleaned.slice(separatorIndex + 3).trim()
            : cleaned;

    // Pre-fill shared artist on first selection if not already set
    if (!bulkShared.artist && artist) bulkShared.artist = artist;

    bulkRows.value.push({
        id: crypto.randomUUID(),
        discogs_id: release.id,
        album_name: albumName,
        release_date: release.year ? String(release.year) : "",
        artwork_url: release.cover_image || "",
        notes: "",
    });
};

const onDiscogsDeselected = (release) => {
    const row = bulkRows.value.find((r) => r.discogs_id === release.id);
    if (row) bulkRows.value = bulkRows.value.filter((r) => r.id !== row.id);
};

const removeRow = (id) => {
    bulkRows.value = bulkRows.value.filter((r) => r.id !== id);
};

const addEmptyRow = () => {
    bulkRows.value.push({
        id: crypto.randomUUID(),
        discogs_id: null,
        album_name: "",
        release_date: "",
        artwork_url: "",
        notes: "",
    });
};

// --- Submission state ---
const isFormSubmitting = ref(false);

// --- Single mode ---
const isFormDisabled = computed(
    () => !form.album_name || !form.artist || !form.release_date,
);

const isBulkDisabled = computed(
    () =>
        !bulkShared.artist.trim() ||
        bulkRows.value.length === 0 ||
        bulkRows.value.some((r) => !r.album_name.trim()),
);

watch(
    () => release,
    (val) => {
        if (val) Object.assign(form, val);
    },
    { immediate: true },
);

const autofill = (release) => {
    const cleaned = cleanTitle(release.title);
    const separatorIndex = cleaned.indexOf(" - ");
    form.artist =
        separatorIndex !== -1 ? cleaned.slice(0, separatorIndex).trim() : "";
    form.album_name =
        separatorIndex !== -1
            ? cleaned.slice(separatorIndex + 3).trim()
            : cleaned;
    form.release_date = release.year ? String(release.year) : "";
    form.artwork_url = release.cover_image || "";
    form.discogs_master_id = release.id || null;
    // Clear any manually uploaded file when autofilling from Discogs
    form.artwork_file = null;
};

const onArtworkUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    form.artwork_file = file;
    // Show a local preview and clear Discogs URL
    form.artwork_url = URL.createObjectURL(file);
};

const clearArtwork = () => {
    form.artwork_url = "";
    form.artwork_file = null;
    // Note: discogs_master_id is intentionally kept — artwork and release ID are independent
};

const submit = async () => {
    isFormSubmitting.value = true;
    let sourceId = form.source_id;

    if (!sourceId && form.source_name?.trim()) {
        sourceId = await getOrCreateSource(form.source_name);
    }

    form.source_id = sourceId;
    const payload = { ...form };
    delete payload.source_name;

    if (release) {
        // On update, only patch the collections fields
        const collectionUpdates = {
            condition: payload.condition,
            notes: payload.notes,
            source_id: payload.source_id,
            exclude_from_randomizer: payload.exclude_from_randomizer,
            acquired_date: payload.acquired_date,
            media_type: payload.media_type,
        };
        await updateRelease(release.id, collectionUpdates)
            .then(() => {
                resetForm();
                emit("submitted");
            })
            .catch(console.error)
            .finally(() => (isFormSubmitting.value = false));
    } else {
        await addRelease(payload)
            .then(() => resetForm())
            .catch(console.error)
            .finally(() => (isFormSubmitting.value = false));
    }
};

const submitBulk = async () => {
    isFormSubmitting.value = true;

    let sourceId = bulkShared.source_id;
    if (!sourceId && bulkShared.source_name?.trim()) {
        sourceId = await getOrCreateSource(bulkShared.source_name);
    }

    const payload = {
        artist: bulkShared.artist.trim(),
        releases: bulkRows.value.map((row) => ({
            title: row.album_name,
            year: row.release_date ? parseInt(row.release_date) : undefined,
            discogs_master_id: row.discogs_id ?? undefined,
            artwork_url: row.artwork_url || undefined,
            notes: row.notes || undefined,
            condition: bulkShared.condition,
            source_id: sourceId || undefined,
            media_type: bulkShared.media_type,
        })),
    };

    await bulkAddReleases(payload)
        .then(() => {
            resetBulkForm();
            emit("submitted");
        })
        .catch(console.error)
        .finally(() => (isFormSubmitting.value = false));
};

const resetForm = () => {
    discogsSearchRef.value?.clear();
    Object.assign(form, {
        album_name: "",
        artist: "",
        release_date: "",
        acquired_date: "",
        source_id: "",
        source_name: "",
        condition: "used",
        media_type: "cd",
        notes: "",
        artwork_url: "",
        exclude_from_randomizer: false,
    });
};

const resetBulkForm = () => {
    discogsSearchRef.value?.clear();
    Object.assign(bulkShared, {
        artist: "",
        source_id: "",
        source_name: "",
        media_type: "cd",
        condition: "used",
    });
    bulkRows.value = [];
};
</script>

<template>
    <!-- ======= SINGLE MODE ======= -->
    <template v-if="!bulk">
        <DiscogsSearch
            v-if="!release"
            ref="discogsSearchRef"
            @selected="autofill"
        />
        <form @submit.prevent="submit">
            <div class="artwork-preview" v-if="form.artwork_url">
                <img :src="form.artwork_url" width="150" />
                <button
                    v-if="!form.discogs_master_id"
                    type="button"
                    @click="clearArtwork"
                >
                    Remove
                </button>
            </div>
            <div class="artwork-upload" v-else>
                <label for="artwork_file">
                    <span>Artwork:</span>
                    <span class="optional">(optional)</span>
                </label>
                <input
                    id="artwork_file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    @change="onArtworkUpload"
                />
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
                <label for="type">Type:</label>
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

            <button :disabled="isFormDisabled || isFormSubmitting">
                {{ !release ? "Add Release" : "Update Release" }}
            </button>
        </form>
    </template>

    <!-- ======= BULK MODE ======= -->
    <template v-else>
        <!-- Single Discogs search at the top; passes already-selected IDs to
             disable duplicates and show checkmarks -->
        <DiscogsSearch
            :selectedIds="selectedDiscogsIds"
            ref="discogsSearchRef"
            @selected="onDiscogsSelected"
            @deselected="onDiscogsDeselected"
        />

        <p v-if="bulkRows.length === 0" class="bulk-empty">
            Search for an artist above and select releases to add them here.
        </p>

        <form v-else @submit.prevent="submitBulk">
            <!-- Shared fields -->
            <div class="field-wrapper">
                <label for="bulk_artist">Artist:</label>
                <input
                    id="bulk_artist"
                    v-model="bulkShared.artist"
                    placeholder="Artist (shared across all releases)"
                    required
                />
            </div>

            <SourceSelect
                v-model="bulkShared.source_id"
                v-model:typed="bulkShared.source_name"
            />

            <div class="field-wrapper">
                <label for="bulk_type">Type:</label>
                <select id="bulk_type" v-model="bulkShared.media_type">
                    <option value="cd">CD</option>
                    <option value="vinyl">Vinyl</option>
                    <option value="cassette">Cassette</option>
                </select>
            </div>

            <div class="field-wrapper">
                <label for="bulk_condition">Condition:</label>
                <select id="bulk_condition" v-model="bulkShared.condition">
                    <option value="new">New</option>
                    <option value="used">Used</option>
                </select>
            </div>

            <!-- Release rows -->
            <div class="bulk-rows" v-if="bulkRows.length > 0">
                <div v-for="row in bulkRows" :key="row.id" class="bulk-row">
                    <img
                        v-if="row.artwork_url"
                        :src="row.artwork_url"
                        width="50"
                    />

                    <div class="field-wrapper">
                        <label>Album:</label>
                        <input
                            v-model="row.album_name"
                            placeholder="Album"
                            required
                        />
                    </div>

                    <div class="field-wrapper">
                        <label>Release Date:</label>
                        <input
                            type="text"
                            v-maska="'####'"
                            v-model="row.release_date"
                            placeholder="YYYY"
                        />
                    </div>

                    <div class="field-wrapper">
                        <label>Notes:</label>
                        <textarea
                            v-model="row.notes"
                            placeholder="(optional)"
                        />
                    </div>

                    <button type="button" @click="removeRow(row.id)">
                        Remove
                    </button>
                </div>
            </div>

            <button
                type="submit"
                :disabled="isBulkDisabled || isFormSubmitting"
            >
                {{
                    isFormSubmitting
                        ? "Adding…"
                        : `Add ${bulkRows.length} Release${bulkRows.length !== 1 ? "s" : ""}`
                }}
            </button>
        </form>
    </template>
</template>

<style lang="scss" scoped>
.bulk-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
}
</style>
