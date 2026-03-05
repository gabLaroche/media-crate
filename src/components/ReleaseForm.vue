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

const discogsSearchRef = ref(null);

// --- Bulk mode release rows ---
const bulkRows = ref([]);

// Track Discogs IDs already added to prevent duplicates
const selectedDiscogsIds = computed(() =>
    bulkRows.value.map((r) => r.discogs_id),
);

const newBulkRow = (overrides = {}) => ({
    id: crypto.randomUUID(),
    discogs_id: null,
    artist: "",
    album_name: "",
    release_date: "",
    acquired_date: localDate,
    artwork_url: "",
    notes: "",
    source_id: "",
    source_name: "",
    media_type: "cd",
    condition: "used",
    ...overrides,
});

const onDiscogsSelected = (release) => {
    const cleaned = cleanTitle(release.title || "");
    const separatorIndex = cleaned.indexOf(" - ");
    const artist =
        separatorIndex !== -1 ? cleaned.slice(0, separatorIndex).trim() : "";
    const albumName =
        separatorIndex !== -1
            ? cleaned.slice(separatorIndex + 3).trim()
            : cleaned;

    bulkRows.value.push(
        newBulkRow({
            discogs_id: release.id,
            artist,
            album_name: albumName,
            release_date: release.year ? String(release.year) : "",
            artwork_url: release.cover_image || "",
        }),
    );
};

const onDiscogsDeselected = (release) => {
    const row = bulkRows.value.find((r) => r.discogs_id === release.id);
    if (row) bulkRows.value = bulkRows.value.filter((r) => r.id !== row.id);
};

const removeRow = (id) => {
    bulkRows.value = bulkRows.value.filter((r) => r.id !== id);
};

const addEmptyRow = () => {
    bulkRows.value.push(newBulkRow());
};

// --- Submission state ---
const isFormSubmitting = ref(false);

// --- Single mode ---
const isFormDisabled = computed(
    () => !form.album_name || !form.artist || !form.release_date,
);

const isBulkDisabled = computed(
    () =>
        bulkRows.value.length === 0 ||
        bulkRows.value.some((r) => !r.album_name.trim() || !r.artist.trim()),
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
    form.artwork_file = null;
};

const onArtworkUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    form.artwork_file = file;
    form.artwork_url = URL.createObjectURL(file);
};

const clearArtwork = () => {
    form.artwork_url = "";
    form.artwork_file = null;
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
            .then(() => {
                resetForm();
                router.push({ name: "collection" });
            })
            .catch(console.error)
            .finally(() => (isFormSubmitting.value = false));
    }
};

const submitBulk = async () => {
    isFormSubmitting.value = true;

    const releases = await Promise.all(
        bulkRows.value.map(async (row) => {
            let sourceId = row.source_id;
            if (!sourceId && row.source_name?.trim()) {
                sourceId = await getOrCreateSource(row.source_name);
            }
            return {
                title: row.album_name,
                artist: row.artist.trim(),
                year: row.release_date ? parseInt(row.release_date) : undefined,
                acquired_date: row.acquired_date || undefined,
                discogs_master_id: row.discogs_id ?? undefined,
                artwork_url: row.artwork_url || undefined,
                notes: row.notes || undefined,
                condition: row.condition,
                source_id: sourceId || undefined,
                media_type: row.media_type,
            };
        }),
    );

    await bulkAddReleases({ releases })
        .then(() => {
            resetBulkForm();
            emit("submitted");
            router.push({ name: "collection" });
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
            <div class="bulk-rows">
                <div v-for="row in bulkRows" :key="row.id" class="bulk-row">
                    <!-- Row 1: artwork + artist + album -->
                    <div class="bulk-row__primary">
                        <img
                            v-if="row.artwork_url"
                            :src="row.artwork_url"
                            class="bulk-row__artwork"
                        />
                        <div v-else class="bulk-row__artwork-placeholder" />
                        <div class="field-wrapper bulk-row__artist">
                            <label>Artist:</label>
                            <input
                                v-model="row.artist"
                                placeholder="Artist"
                                required
                            />
                        </div>
                        <div class="field-wrapper bulk-row__album">
                            <label>Album:</label>
                            <input
                                v-model="row.album_name"
                                placeholder="Album"
                                required
                            />
                        </div>
                    </div>

                    <!-- Row 2: release year + acquired date + type + condition -->
                    <div class="bulk-row__meta">
                        <div class="field-wrapper">
                            <label>Year:</label>
                            <input
                                type="text"
                                v-maska="'####'"
                                v-model="row.release_date"
                                placeholder="YYYY"
                            />
                        </div>
                        <div class="field-wrapper">
                            <label>Acquired:</label>
                            <input type="date" v-model="row.acquired_date" />
                        </div>
                        <div class="field-wrapper">
                            <label>Type:</label>
                            <select v-model="row.media_type">
                                <option value="cd">CD</option>
                                <option value="vinyl">Vinyl</option>
                                <option value="cassette">Cassette</option>
                            </select>
                        </div>
                        <div class="field-wrapper">
                            <label>Condition:</label>
                            <select v-model="row.condition">
                                <option value="new">New</option>
                                <option value="used">Used</option>
                            </select>
                        </div>
                    </div>

                    <!-- Row 3: source -->
                    <div class="bulk-row__source">
                        <SourceSelect
                            v-model="row.source_id"
                            v-model:typed="row.source_name"
                        />
                    </div>

                    <!-- Row 4: notes + remove -->
                    <div class="bulk-row__footer">
                        <div class="field-wrapper bulk-row__notes">
                            <label>Notes:</label>
                            <textarea
                                v-model="row.notes"
                                placeholder="(optional)"
                                rows="1"
                            />
                        </div>
                        <button
                            type="button"
                            class="bulk-row__remove"
                            @click="removeRow(row.id)"
                        >
                            Remove
                        </button>
                    </div>
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
// ---- Bulk rows ----

.bulk-rows {
    display: flex;
    flex-direction: column;
    gap: 0;
}

.bulk-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px 0;
    border-bottom: 1px solid rgba(0, 0, 0, 0.08);

    &:first-child {
        border-top: 1px solid rgba(0, 0, 0, 0.08);
    }

    // Row 1: artwork + artist + album
    &__primary {
        display: flex;
        flex-direction: column;
        gap: 6px;

        @media (min-width: 768px) {
            flex-direction: row;
            align-items: center;
            gap: 10px;
        }
    }

    &__artwork {
        width: 64px;
        height: 64px;
        object-fit: cover;
        border-radius: 3px;
        flex-shrink: 0;

        @media (min-width: 768px) {
            width: 48px;
            height: 48px;
        }
    }

    &__artwork-placeholder {
        display: none;

        @media (min-width: 768px) {
            display: block;
            width: 48px;
            height: 48px;
            flex-shrink: 0;
        }
    }

    &__artist {
        @media (min-width: 768px) {
            flex: 1;
        }
    }

    &__album {
        @media (min-width: 768px) {
            flex: 2;
        }
    }

    // Row 2: year + acquired + type + condition
    &__meta {
        display: flex;
        flex-direction: column;
        gap: 6px;

        @media (min-width: 768px) {
            flex-direction: row;
            align-items: center;
            gap: 10px;
            padding-left: 58px; // align with fields above (artwork width + gap)

            .field-wrapper {
                flex: 1;

                input,
                select {
                    width: 100%;
                }
            }
        }
    }

    // Row 3: source
    &__source {
        @media (min-width: 768px) {
            padding-left: 58px;
        }
    }

    // Row 4: notes + remove
    &__footer {
        display: flex;
        align-items: flex-start;
        flex-direction: column;
        gap: 10px;

        @media (min-width: 768px) {
            flex-direction: row;
            padding-left: 58px;
        }
    }

    &__notes {
        flex: 1;
        width: 100%;

        textarea {
            resize: vertical;
            min-height: 2em;
            width: 100%;
        }
    }

    &__remove {
        @media (min-width: 768px) {
            flex-shrink: 0;
            align-self: flex-end;
        }
    }
}
</style>
