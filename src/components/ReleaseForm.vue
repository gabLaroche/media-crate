<script setup>
import { computed, ref, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useReleases } from "@/composables/useReleases";
import { useSources } from "@/composables/useSources";
import ReleaseSearch from "@/components/ReleaseSearch.vue";
import BulkRow from "@/components/BulkRow.vue";
import { cleanTitle } from "@/lib/cleanTitle";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/composables/useAuth";

const { addRelease, updateRelease, bulkAddReleases, uploadArtwork } =
    useReleases();
const { getOrCreateSource } = useSources();
const router = useRouter();
const { user } = useAuth();

const { release, bulk } = defineProps(["release", "bulk"]);
const emit = defineEmits(["submitted"]);

// --- Quota ---
const quotaExceeded = ref(false);

const fetchQuota = async () => {
    if (!user.value) return;
    const { data } = await supabase
        .from("profiles")
        .select("used_bytes, upload_quota_mb")
        .eq("id", user.value.id)
        .single();
    if (data) {
        quotaExceeded.value =
            data.used_bytes >= (data.upload_quota_mb ?? 50) * 1024 * 1024;
    }
};

onMounted(fetchQuota);

const today = new Date();
const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
    .toISOString()
    .split("T")[0];

// --- Row factory ---
const newRow = () => ({
    id: crypto.randomUUID(),
    discogs_id: null,
    artist: "",
    album_name: "",
    release_date: "",
    acquired_date: localDate,
    source_id: "",
    source_name: "",
    media_type: "cd",
    condition: "used",
    exclude_from_randomizer: false,
    artwork_url: "",
    artwork_file: null,
    artwork_hash: null,
    notes: "",
});

// --- Single / edit mode row ---
const row = ref(newRow());

// Populate row from release prop in edit mode
watch(
    () => release,
    (val) => {
        if (!val) return;
        row.value = {
            ...newRow(),
            artist: val.artist ?? "",
            album_name: val.album_name ?? "",
            release_date: val.release_date ? String(val.release_date) : "",
            acquired_date: val.acquired_date ?? localDate,
            source_id: val.source_id ?? "",
            source_name: "",
            media_type: val.media_type ?? "cd",
            condition: val.condition ?? "used",
            exclude_from_randomizer: val.exclude_from_randomizer ?? false,
            artwork_url: val.artwork_url ?? "",
            notes: val.notes ?? "",
        };
    },
    { immediate: true },
);

// --- Bulk mode rows ---
const bulkRows = ref([]);

const selectedDiscogsIds = computed(() =>
    bulkRows.value.map((r) => r.discogs_id),
);

// --- Refs for ReleaseSearch reset ---
const releaseSearchRef = ref(null);
const bulkReleaseSearchRef = ref(null);

// --- Autofill (single/add mode) ---
const autofill = (result) => {
    const cleaned = cleanTitle(result.title || "");
    const separatorIndex = cleaned.indexOf(" - ");
    const artist =
        separatorIndex !== -1 ? cleaned.slice(0, separatorIndex).trim() : "";
    const albumName =
        separatorIndex !== -1
            ? cleaned.slice(separatorIndex + 3).trim()
            : cleaned;

    row.value = {
        ...row.value,
        artist,
        album_name: albumName,
        release_date: result.year ? String(result.year) : "",
        artwork_url: result.cover_image || "",
        discogs_id: result._source === "local" ? null : result.id,
        artwork_file: null,
        artwork_hash: null,
    };
};

// --- Bulk mode handlers ---
const onDiscogsSelected = (result) => {
    const cleaned = cleanTitle(result.title || "");
    const separatorIndex = cleaned.indexOf(" - ");
    const artist =
        separatorIndex !== -1 ? cleaned.slice(0, separatorIndex).trim() : "";
    const albumName =
        separatorIndex !== -1
            ? cleaned.slice(separatorIndex + 3).trim()
            : cleaned;

    bulkRows.value.push({
        ...newRow(),
        discogs_id: result._source === "local" ? null : result.id,
        artist,
        album_name: albumName,
        release_date: result.year ? String(result.year) : "",
        artwork_url: result.cover_image || "",
    });
};

const onDiscogsDeselected = (result) => {
    bulkRows.value = bulkRows.value.filter((r) => r.discogs_id !== result.id);
};

const removeRow = (id) => {
    bulkRows.value = bulkRows.value.filter((r) => r.id !== id);
};

const addEmptyRow = () => {
    bulkRows.value.push(newRow());
};

const updateRow = (updated) => {
    const i = bulkRows.value.findIndex((r) => r.id === updated.id);
    if (i !== -1) bulkRows.value[i] = updated;
};

// --- Submission state ---
const isSubmitting = ref(false);

const isSingleDisabled = computed(
    () => !row.value.artist.trim() || !row.value.album_name.trim(),
);

const isBulkDisabled = computed(
    () =>
        bulkRows.value.length === 0 ||
        bulkRows.value.some((r) => !r.artist.trim() || !r.album_name.trim()),
);

// --- Resolve a row to a payload entry (upload artwork if needed) ---
const resolveRow = async (r) => {
    let sourceId = r.source_id;
    if (!sourceId && r.source_name?.trim()) {
        sourceId = await getOrCreateSource(r.source_name);
    }

    let artworkUrl = r.artwork_url || undefined;
    if (r.artwork_file) {
        artworkUrl = await uploadArtwork(
            r.artwork_file,
            r.artwork_hash,
            user.value.id,
        );
    }

    return {
        artist: r.artist.trim(),
        title: r.album_name,
        year: r.release_date ? parseInt(r.release_date) : undefined,
        acquired_date: r.acquired_date || undefined,
        discogs_master_id: r.discogs_id ?? undefined,
        artwork_url: artworkUrl,
        notes: r.notes || undefined,
        condition: r.condition,
        source_id: sourceId || undefined,
        media_type: r.media_type,
        exclude_from_randomizer: r.exclude_from_randomizer ?? false,
    };
};

// --- Unified submit ---
const handleSubmit = async () => {
    isSubmitting.value = true;
    try {
        if (release) {
            // Edit mode — only patch collection fields
            let sourceId = row.value.source_id;
            if (!sourceId && row.value.source_name?.trim()) {
                sourceId = await getOrCreateSource(row.value.source_name);
            }
            await updateRelease(release.id, {
                condition: row.value.condition,
                notes: row.value.notes,
                source_id: sourceId || null,
                exclude_from_randomizer: row.value.exclude_from_randomizer,
                acquired_date: row.value.acquired_date,
                media_type: row.value.media_type,
            });
            emit("submitted");
        } else if (bulk) {
            // Bulk add
            const resolvedReleases = await Promise.all(
                bulkRows.value.map(resolveRow),
            );
            await bulkAddReleases({ releases: resolvedReleases });
            resetBulkForm();
            emit("submitted");
            router.push({ name: "collection" });
        } else {
            // Single add
            const resolved = await resolveRow(row.value);
            await bulkAddReleases({ releases: [resolved] });
            resetRow();
            router.push({ name: "collection" });
        }
    } catch (err) {
        console.error(err);
    } finally {
        isSubmitting.value = false;
    }
};

const resetRow = () => {
    releaseSearchRef.value?.clear();
    row.value = newRow();
};

const resetBulkForm = () => {
    bulkReleaseSearchRef.value?.clear();
    bulkRows.value = [];
};
</script>

<template>
    <!-- ======= SINGLE / EDIT MODE ======= -->
    <template v-if="!bulk">
        <ReleaseSearch
            v-if="!release"
            ref="releaseSearchRef"
            @selected="autofill"
        />

        <form @submit.prevent="handleSubmit">
            <BulkRow
                :row="row"
                :removable="false"
                :editable="!release"
                :quotaExceeded="quotaExceeded"
                @update:row="row = $event"
            />

            <div class="form-footer">
                <button
                    v-if="!release"
                    type="button"
                    class="button button--outline"
                    @click="resetRow"
                >
                    Reset
                </button>
                <button :disabled="isSingleDisabled || isSubmitting">
                    {{ release ? "Update Release" : "Add Release" }}
                </button>
            </div>
        </form>
    </template>

    <!-- ======= BULK MODE ======= -->
    <template v-else>
        <ReleaseSearch
            ref="bulkReleaseSearchRef"
            :selectedIds="selectedDiscogsIds"
            @selected="onDiscogsSelected"
            @deselected="onDiscogsDeselected"
        />

        <form @submit.prevent="handleSubmit">
            <div class="bulk-rows" v-if="bulkRows.length > 0">
                <BulkRow
                    v-for="r in bulkRows"
                    :key="r.id"
                    :row="r"
                    :quotaExceeded="quotaExceeded"
                    @update:row="updateRow"
                    @remove="removeRow(r.id)"
                />
            </div>

            <p v-else class="bulk-empty">
                Search for an artist above and select releases to add them here.
            </p>

            <button type="button" @click="addEmptyRow">+ Add Manually</button>

            <div class="form-footer">
                <button
                    type="button"
                    class="button button--outline"
                    @click="resetBulkForm"
                >
                    Reset
                </button>
                <button
                    type="submit"
                    :disabled="isBulkDisabled || isSubmitting"
                >
                    {{
                        isSubmitting
                            ? "Adding…"
                            : `Add ${bulkRows.length} Release${bulkRows.length !== 1 ? "s" : ""}`
                    }}
                </button>
            </div>
        </form>
    </template>
</template>

<style scoped>
.form-footer {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
}
</style>
