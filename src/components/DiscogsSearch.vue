<script setup>
import { ref, computed } from "vue";
import { RiCheckLine } from "@remixicon/vue";
import { searchRelease } from "@/lib/discogs";
import { cleanTitle } from "@/lib/cleanTitle";

const props = defineProps(["selectedIds"]);
const emit = defineEmits(["selected", "deselected"]);

const artist = ref("");
const releaseFilter = ref("");
const countryFilter = ref("");
const results = ref([]);
const loading = ref(false);
const hasSearched = ref(false);

const availableCountries = computed(() => {
    const countries = results.value.map((r) => r.country).filter(Boolean);
    return [...new Set(countries)].sort();
});

const filteredResults = computed(() => {
    return results.value.filter((r) => {
        const matchesRelease =
            !releaseFilter.value.trim() ||
            cleanTitle(r.title)
                .toLowerCase()
                .includes(releaseFilter.value.toLowerCase());
        const matchesCountry =
            !countryFilter.value || r.country === countryFilter.value;
        return matchesRelease && matchesCountry;
    });
});

const isSelected = (r) => props.selectedIds?.includes(r.id);

const search = async () => {
    if (!artist.value.trim()) return;
    loading.value = true;
    hasSearched.value = false;
    results.value = [];
    releaseFilter.value = "";
    countryFilter.value = "";
    const data = await searchRelease({ artist: artist.value });
    results.value = data.results || [];
    loading.value = false;
    hasSearched.value = true;
};

const selectRelease = (r) => {
    if (isSelected(r)) {
        emit("deselected", r);
    } else {
        emit("selected", r);
    }
};

const clear = () => {
    artist.value = "";
    releaseFilter.value = "";
    countryFilter.value = "";
    results.value = [];
    hasSearched.value = false;
};

defineExpose({ clear });
</script>

<template>
    <div class="discogs-search">
        <h3>Search Discogs</h3>

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
                    v-model="releaseFilter"
                    class="release-filter"
                    placeholder="Filter releases…"
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
                    :class="{ 'result--selected': isSelected(r) }"
                    @click="selectRelease(r)"
                >
                    <img v-if="r.cover_image" :src="r.cover_image" width="50" />
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
                    <RiCheckLine v-if="isSelected(r)" />
                    <!-- <span class="result__check">✓</span> -->
                </div>
            </div>
        </template>
    </div>
</template>

<style lang="scss" scoped>
.discogs-search {
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
        flex-wrap: wrap;
    }

    .release-filter {
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

        &__info {
            flex: 1;
            display: flex;
            gap: 6px;
            align-items: baseline;
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

        &__check {
            font-size: 1.1em;
            color: green;
        }
    }
}
</style>
