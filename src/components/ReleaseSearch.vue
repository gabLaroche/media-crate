<script setup>
import { ref, computed } from "vue";
import { searchRelease } from "@/lib/discogs";
import { cleanTitle } from "@/lib/cleanTitle";
import { supabase } from "@/lib/supabase";

const props = defineProps(["selectedIds"]);
const emit = defineEmits(["selected", "deselected"]);

const artist = ref("");
const albumFilter = ref("");
const countryFilter = ref("");
const results = ref([]);
const loading = ref(false);
const hasSearched = ref(false);

// Normalise a local DB release into the same shape as a Discogs result
const normalizeLocalRelease = (r) => ({
    id: `local_${r.id}`, // namespaced so it never collides with a Discogs int ID
    _source: "local",
    _local_id: r.id,
    title: `${r.artist} - ${r.title}`,
    year: r.year,
    cover_image: r.artworks?.url ?? null,
    country: null,
    discogs_master_id: null,
});

const availableCountries = computed(() => {
    const countries = results.value
        .filter((r) => r._source !== "local")
        .map((r) => r.country)
        .filter(Boolean);
    return [...new Set(countries)].sort();
});

const filteredResults = computed(() => {
    return results.value.filter((r) => {
        const matchesAlbum =
            !albumFilter.value.trim() ||
            cleanTitle(r.title)
                .toLowerCase()
                .includes(albumFilter.value.toLowerCase());
        // Local results are never filtered by country
        const matchesCountry =
            r._source === "local" ||
            !countryFilter.value ||
            r.country === countryFilter.value;
        return matchesAlbum && matchesCountry;
    });
});

const isSelected = (r) => props.selectedIds?.includes(r.id);

const search = async () => {
    if (!artist.value.trim()) return;
    loading.value = true;
    hasSearched.value = false;
    results.value = [];
    albumFilter.value = "";
    countryFilter.value = "";

    // Fire both searches in parallel
    const [discogsData, localData] = await Promise.allSettled([
        searchRelease({ artist: artist.value }),
        supabase
            .from("releases")
            .select("id, title, artist, year, artworks(url)")
            .is("discogs_master_id", null)
            .or(`title.ilike.%${artist.value}%,artist.ilike.%${artist.value}%`),
    ]);

    const discogsResults =
        discogsData.status === "fulfilled"
            ? discogsData.value.results || []
            : [];

    const localResults =
        localData.status === "fulfilled"
            ? (localData.value.data || []).map(normalizeLocalRelease)
            : [];

    // Local results first, then Discogs
    results.value = [...localResults, ...discogsResults];
    loading.value = false;
    hasSearched.value = true;
};

const clear = () => {
    results.value = [];
    artist.value = "";
    albumFilter.value = "";
    countryFilter.value = "";
    hasSearched.value = false;
};

const selectRelease = (r) => {
    if (isSelected(r)) {
        emit("deselected", r);
    } else {
        emit("selected", r);
    }
};

defineExpose({ clear });
</script>

<template>
    <div class="release-search">
        <h3>Search</h3>

        <div class="search">
            <input
                v-model="artist"
                placeholder="Artist"
                @keydown.enter.prevent="search"
            />
            <button
                type="button"
                @click="search"
                :disabled="!artist.trim() || loading"
            >
                {{ loading ? "Searching…" : "Search" }}
            </button>
        </div>

        <template v-if="hasSearched">
            <div v-if="results.length > 0" class="filters">
                <input
                    v-model="albumFilter"
                    class="album-filter"
                    placeholder="Filter albums…"
                />
                <select v-model="countryFilter" class="country-filter">
                    <option value="">All countries</option>
                    <option v-for="c in availableCountries" :key="c" :value="c">
                        {{ c }}
                    </option>
                </select>
            </div>

            <p v-if="filteredResults.length === 0">No results found</p>

            <div class="results">
                <div
                    v-for="r in filteredResults"
                    :key="r.id"
                    class="result"
                    :class="{
                        'result--selected': isSelected(r),
                        'result--local': r._source === 'local',
                    }"
                    @click="selectRelease(r)"
                >
                    <img
                        v-if="r.cover_image"
                        :src="r.cover_image"
                        width="50"
                        height="50"
                        style="
                            object-fit: cover;
                            border-radius: 3px;
                            flex-shrink: 0;
                        "
                    />
                    <div v-else class="result__art-placeholder" />
                    <div class="result__info">
                        <span class="result__title">{{
                            cleanTitle(r.title)
                        }}</span>
                        <span class="result__year" v-if="r.year"
                            >({{ r.year }})</span
                        >
                        <span class="result__country" v-if="r.country">{{
                            r.country
                        }}</span>
                    </div>
                    <span v-if="r._source === 'local'" class="result__badge"
                        >Library</span
                    >
                    <span v-if="isSelected(r)" class="result__check">✓</span>
                </div>
            </div>
        </template>
    </div>
</template>

<style lang="scss" scoped>
.release-search {
    margin-bottom: 20px;

    .search {
        display: flex;
        flex-direction: column;
        gap: 10px;

        @media (min-width: 768px) {
            flex-direction: row;
        }
    }

    .filters {
        display: flex;
        gap: 10px;
        margin-top: 10px;
    }

    .album-filter {
        flex: 1;
    }

    .country-filter {
        flex-shrink: 0;
    }

    .results {
        max-width: 500px;
        max-height: 300px;
        overflow-y: auto;
        margin-top: 10px;
    }

    .result {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 6px;
        margin: 4px 0;
        cursor: pointer;
        border-radius: 4px;

        &:hover:not(.result--selected) {
            background: rgba(0, 0, 0, 0.05);
        }

        &--selected {
            opacity: 0.5;

            &:hover {
                background: rgba(255, 0, 0, 0.05);
            }
        }

        &--local {
            border-left: 2px solid $secondary-lighter;
            padding-left: 8px;
        }

        &__art-placeholder {
            width: 50px;
            height: 50px;
            flex-shrink: 0;
            border-radius: 3px;
            background: rgba($secondary-lighter, 0.15);
        }

        &__info {
            flex: 1;
            display: flex;
            gap: 6px;
            align-items: baseline;
            flex-wrap: wrap;
        }

        &__title {
            font-weight: 500;
        }

        &__year {
            font-size: 0.85em;
            color: #888;
        }

        &__country {
            font-size: 0.8em;
            color: #aaa;
            margin-left: auto;
            white-space: nowrap;
        }

        &__badge {
            font-size: 0.7rem;
            font-weight: 600;
            padding: 2px 6px;
            border-radius: 4px;
            background: rgba($secondary-lighter, 0.15);
            color: $secondary-lighter;
            white-space: nowrap;
            flex-shrink: 0;
        }

        &__check {
            font-size: 1.1em;
            color: green;
        }
    }
}
</style>
