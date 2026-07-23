<script setup>
import { ref, computed, watch } from "vue";
import { searchRelease, lookupReleaseById } from "@/lib/discogs";
import { cleanTitle } from "@/lib/cleanTitle";
import { supabase } from "@/lib/supabase";

const props = defineProps(["selectedIds"]);
const emit = defineEmits(["selected", "deselected"]);

const MAX_AUTO_FETCH = 5;

const searchMode = ref("artist");
const query = ref("");
const textFilter = ref("");
const countryFilter = ref("");
const results = ref([]);
const loading = ref(false);
const hasSearched = ref(false);
const currentPage = ref(1);
const totalPages = ref(1);
const loadingMore = ref(false);
const isAutoFetching = ref(false);
const autoFetchCount = ref(0);
const autoFetchExhausted = ref(false);

const idInput = ref("");
const idLookupLoading = ref(false);
const idLookupError = ref("");
const viaIdLookup = ref(false);

let autoFetchTimer = null;

const sanitizeCoverImage = (url) =>
    url?.endsWith("/spacer.gif") ? null : (url ?? null);

const extractArtist = (title) => title.split(" - ")[0].trim();

const normalizeLocalRelease = (r) => ({
    id: `local_${r.id}`,
    _source: "local",
    _local_id: r.id,
    title: `${r.artist} - ${r.title}`,
    year: r.year,
    cover_image: sanitizeCoverImage(r.artworks?.url ?? null),
    country: null,
    discogs_master_id: null,
    discogs_type: null,
});

const availableCountries = computed(() => {
    const countries = results.value
        .filter((r) => r._source !== "local" && r.country)
        .map((r) => r.country);
    return [...new Set(countries)].sort();
});

const filteredResults = computed(() => {
    return results.value.filter((r) => {
        const matchesText =
            !textFilter.value.trim() ||
            (searchMode.value === "artist"
                ? cleanTitle(r.title)
                      .toLowerCase()
                      .includes(textFilter.value.toLowerCase())
                : extractArtist(r.title)
                      .toLowerCase()
                      .includes(textFilter.value.toLowerCase()));

        const matchesCountry =
            r._source === "local" ||
            !countryFilter.value ||
            r.country === countryFilter.value;

        return matchesText && matchesCountry;
    });
});

const hasMorePages = computed(
    () => currentPage.value < totalPages.value && !loadingMore.value,
);

const isSelected = (r) => props.selectedIds?.includes(r.id);

const setSearchMode = (mode) => {
    if (searchMode.value === mode) return;
    searchMode.value = mode;
    query.value = "";
    resetResults();
};

const resetResults = () => {
    results.value = [];
    textFilter.value = "";
    countryFilter.value = "";
    hasSearched.value = false;
    currentPage.value = 1;
    totalPages.value = 1;
    autoFetchCount.value = 0;
    autoFetchExhausted.value = false;
    isAutoFetching.value = false;
    viaIdLookup.value = false;
    clearTimeout(autoFetchTimer);
};

const dedupeResults = (incoming) => {
    const seenIds = new Set(results.value.map((r) => r.id));
    return incoming.filter((r) => !seenIds.has(r.id));
};

const buildSearchParams = (page) =>
    searchMode.value === "artist"
        ? { artist: query.value, page }
        : { title: query.value, page };

const search = async () => {
    if (!query.value.trim()) return;
    loading.value = true;
    resetResults();

    const [discogsData, localData] = await Promise.allSettled([
        searchRelease(buildSearchParams(1)),
        supabase
            .from("releases")
            .select("id, title, artist, year, artworks(url)")
            .is("discogs_master_id", null)
            .or(`title.ilike.%${query.value}%,artist.ilike.%${query.value}%`),
    ]);

    const discogsResults =
        discogsData.status === "fulfilled"
            ? (discogsData.value.results || []).map((r) => ({
                  ...r,
                  cover_image: sanitizeCoverImage(r.cover_image),
                  discogs_type: "master",
              }))
            : [];

    if (discogsData.status === "fulfilled") {
        totalPages.value = discogsData.value.pagination?.pages ?? 1;
    }

    const localResults =
        localData.status === "fulfilled"
            ? (localData.value.data || []).map(normalizeLocalRelease)
            : [];

    results.value = [...localResults, ...discogsResults];
    loading.value = false;
    hasSearched.value = true;
};

const loadMore = async () => {
    if (loadingMore.value || currentPage.value >= totalPages.value) return;
    loadingMore.value = true;
    currentPage.value++;

    try {
        const data = await searchRelease(buildSearchParams(currentPage.value));
        const newResults = (data.results || []).map((r) => ({
            ...r,
            cover_image: sanitizeCoverImage(r.cover_image),
        }));
        results.value = [...results.value, ...dedupeResults(newResults)];
    } finally {
        loadingMore.value = false;
        isAutoFetching.value = false;
    }
};

const onResultsScroll = (e) => {
    const el = e.target;
    if (el.scrollHeight - el.scrollTop <= el.clientHeight + 80) {
        autoFetchCount.value = 0;
        loadMore();
    }
};

watch(filteredResults, (filtered) => {
    clearTimeout(autoFetchTimer);

    if (
        !hasSearched.value ||
        loading.value ||
        filtered.length > 0 ||
        !hasMorePages.value ||
        autoFetchExhausted.value
    ) {
        isAutoFetching.value = false;
        return;
    }

    if (autoFetchCount.value >= MAX_AUTO_FETCH) {
        autoFetchExhausted.value = true;
        isAutoFetching.value = false;
        return;
    }

    isAutoFetching.value = true;
    autoFetchTimer = setTimeout(async () => {
        autoFetchCount.value++;
        await loadMore();
    }, 300);
});

watch([textFilter, countryFilter], () => {
    autoFetchCount.value = 0;
    autoFetchExhausted.value = false;
    clearTimeout(autoFetchTimer);
});

const clear = () => {
    query.value = "";
    idInput.value = "";
    idLookupError.value = "";
    resetResults();
};

const shorthandTypes = { m: "master", r: "release" };

const parseDiscogsIdInput = (value) => {
    const trimmed = value.trim();

    const urlMatch = trimmed.match(
        /discogs\.com\/(?:[a-z-]+\/)?(release|master)\/(\d+)/i,
    );
    if (urlMatch) {
        return { id: urlMatch[2], type: urlMatch[1].toLowerCase() };
    }

    const shorthandMatch = trimmed.match(/^\[?([mr])(\d+)\]?$/i);
    if (shorthandMatch) {
        return {
            id: shorthandMatch[2],
            type: shorthandTypes[shorthandMatch[1].toLowerCase()],
        };
    }

    if (/^\d+$/.test(trimmed)) {
        return { id: trimmed, type: null };
    }

    return null;
};

const lookupById = async () => {
    const parsed = parseDiscogsIdInput(idInput.value);
    if (!parsed) {
        idLookupError.value =
            "Enter a valid Discogs release/master ID or URL.";
        return;
    }

    idLookupLoading.value = true;
    idLookupError.value = "";

    try {
        const result = await lookupReleaseById(parsed);
        const normalized = {
            ...result,
            cover_image: sanitizeCoverImage(result.cover_image),
            discogs_type: result.type,
        };

        results.value = [
            normalized,
            ...results.value.filter((r) => r.id !== normalized.id),
        ];
        hasSearched.value = true;
        viaIdLookup.value = true;
        textFilter.value = "";
        countryFilter.value = "";
        idInput.value = "";
    } catch (err) {
        idLookupError.value = err.message || "Release not found.";
    } finally {
        idLookupLoading.value = false;
    }
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
        <div class="search-card">
            <div class="search-row">
                <div class="mode-toggle">
                    <button
                        type="button"
                        :class="[
                            'mode-toggle__btn',
                            {
                                'mode-toggle__btn--active':
                                    searchMode === 'artist',
                            },
                        ]"
                        @click="setSearchMode('artist')"
                    >
                        Artist
                    </button>
                    <button
                        type="button"
                        :class="[
                            'mode-toggle__btn',
                            {
                                'mode-toggle__btn--active':
                                    searchMode === 'title',
                            },
                        ]"
                        @click="setSearchMode('title')"
                    >
                        Album
                    </button>
                </div>
                <input
                    v-model="query"
                    class="search-input"
                    :placeholder="
                        searchMode === 'artist'
                            ? 'Search by artist…'
                            : 'Search by album…'
                    "
                    @keydown.enter.prevent="search"
                />
                <button
                    type="button"
                    @click="search"
                    :disabled="!query.trim() || loading"
                >
                    {{ loading ? "Searching…" : "Search" }}
                </button>
            </div>

            <div class="search-row">
                <input
                    v-model="idInput"
                    class="search-input"
                    placeholder="Paste a Discogs URL, master ID, or release ID…"
                    @keydown.enter.prevent="lookupById"
                />
                <button
                    type="button"
                    class="button button--outline"
                    @click="lookupById"
                    :disabled="!idInput.trim() || idLookupLoading"
                >
                    {{ idLookupLoading ? "Looking up…" : "Add by ID" }}
                </button>
            </div>
            <p v-if="idLookupError" class="id-lookup__error">
                {{ idLookupError }}
            </p>
        </div>

        <div v-if="hasSearched" class="results-card">
            <div v-if="results.length > 0 && !viaIdLookup" class="filters">
                <input
                    v-model="textFilter"
                    class="text-filter"
                    :placeholder="
                        searchMode === 'artist'
                            ? 'Filter by album…'
                            : 'Filter by artist…'
                    "
                />
                <select v-model="countryFilter" class="filter">
                    <option value="">All countries</option>
                    <option
                        v-for="country in availableCountries"
                        :key="country"
                        :value="country"
                    >
                        {{ country }}
                    </option>
                </select>
            </div>

            <p
                v-if="
                    filteredResults.length === 0 &&
                    !loading &&
                    !loadingMore &&
                    !isAutoFetching
                "
                class="results-status"
            >
                {{
                    autoFetchExhausted
                        ? "No results found, try adjusting your filters."
                        : "Searching for more results…"
                }}
            </p>
            <p
                v-else-if="
                    filteredResults.length === 0 &&
                    (loadingMore || isAutoFetching)
                "
                class="results-status"
            >
                Searching for more results…
            </p>

            <div class="results" @scroll="onResultsScroll">
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
                    <img :src="r.cover_image ?? '/No_Image_Available.png'" />
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
                <div v-if="loadingMore" class="results__loading-more">
                    Loading more…
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.release-search {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.search-card {
    background-color: $surface;
    border: 1px solid $border;
    border-radius: 10px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.search-row {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;

    @media (min-width: 768px) {
        flex-direction: row;
    }

    .button {
        flex-shrink: 0;
    }
}

.search-input {
    flex: 1;
    min-width: 0;
    border-radius: 8px;
    padding: 0.65rem 0.9rem;
}

.mode-toggle {
    display: flex;
    flex-shrink: 0;
    border: 1px solid $border;
    border-radius: 8px;
    overflow: hidden;

    &__btn {
        background-color: transparent;
        color: $text;
        border: none;
        border-radius: 0;
        padding: 0.65rem 1.1rem;

        &:hover {
            background-color: rgba($primary, 0.12);
        }

        &--active {
            background-color: $primary;
            color: $neutral-white;

            &:hover {
                background-color: $primary;
            }
        }
    }
}

.id-lookup__error {
    margin: 0;
    font-size: 0.85em;
    color: $danger;
}

.results-card {
    background-color: $surface;
    border: 1px solid $border;
    border-radius: 10px;
    padding: 1.25rem;
}

.filters {
    display: flex;
    gap: 10px;
    margin-bottom: 0.75rem;
}

.text-filter {
    flex: 1;
    border-radius: 8px;
}

.filter {
    flex-shrink: 0;
    border-radius: 8px;
}

.results-status {
    margin: 0;
    color: $text-muted;
    font-size: 0.9rem;
}

.results {
    max-height: 320px;
    overflow-y: auto;

    &__loading-more {
        text-align: center;
        padding: 8px;
        font-size: 0.85em;
        color: $text-muted;
    }
}

.result {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0.5rem;
    margin: 4px 0;
    cursor: pointer;
    border-radius: 8px;

    &:hover:not(.result--selected) {
        background: rgba($primary, 0.12);
    }

    &--selected {
        opacity: 0.5;

        &:hover {
            background: rgba($danger, 0.08);
        }
    }

    &--local {
        border-left: 2px solid $secondary-lighter;
        padding-left: 8px;
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
        color: $text-muted;
    }

    &__country {
        font-size: 0.8em;
        color: $text-muted;
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
        color: $success-dark;
    }

    img {
        object-fit: cover;
        border-radius: 6px;
        flex-shrink: 0;
        width: 50px;
        height: 50px;
    }
}
</style>
