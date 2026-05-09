<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { supabase } from "@/lib/supabase";
import { useReleases } from "@/composables/useReleases";
import { useSources } from "@/composables/useSources";
import {
    RiArrowUpLine,
    RiArrowDownLine,
    RiSearchLine,
    RiLayoutGridLine,
    RiListUnordered,
} from "@remixicon/vue";
import ReleaseCard from "./ReleaseCard.vue";
import LoadingSpinner from "./LoadingSpinner.vue";

const MEDIA_TYPES = [
    { value: "cd", label: "CD", plural: "CDs" },
    { value: "vinyl", label: "Vinyl", plural: "Vinyls" },
    { value: "cassette", label: "Cassette", plural: "Cassettes" },
];

const route = useRoute();
const emit = defineEmits(["resolved", "error"]);

const { releases, fetchAll, fetchAllForUser } = useReleases();
const { sources, fetchSources } = useSources();

const ascending = ref(true);
const sortState = ref("acquired_date");
const isFetching = ref(false);
const searchText = ref("");
const mediaTypeFilter = ref("");
const viewMode = ref("grid");

const publicUserId = ref(null);
const displayName = ref("");

const typeCounts = computed(() =>
    Object.fromEntries(
        MEDIA_TYPES.map((t) => [
            t.value,
            releases.value.filter((r) => r.media_type === t.value).length,
        ]),
    ),
);

const filteredReleases = computed(() => {
    let result = [...releases.value];

    const q = searchText.value.trim().toLowerCase();
    if (q) {
        result = result.filter(
            (r) =>
                r.album_name?.toLowerCase().includes(q) ||
                r.artist?.toLowerCase().includes(q),
        );
    }

    if (mediaTypeFilter.value) {
        result = result.filter((r) => r.media_type === mediaTypeFilter.value);
    }

    result.sort((a, b) => {
        let aVal = a[sortState.value] ?? "";
        let bVal = b[sortState.value] ?? "";
        if (typeof aVal === "string") aVal = aVal.toLowerCase();
        if (typeof bVal === "string") bVal = bVal.toLowerCase();
        if (aVal < bVal) return ascending.value ? -1 : 1;
        if (aVal > bVal) return ascending.value ? 1 : -1;
        return 0;
    });

    return result;
});

const handleDelete = (id) => {
    releases.value = releases.value.filter((item) => item.id !== id);
};

const init = async () => {
    isFetching.value = true;

    const slug = route.params.slug;

    if (slug) {
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("id, is_public")
            .eq("slug", slug)
            .maybeSingle();

        if (profileError || !profile) {
            emit("error", "not-found");
            return;
        }

        if (!profile.is_public) {
            emit("error", "private");
            return;
        }

        publicUserId.value = profile.id;

        const { data: nameData } = await supabase.rpc(
            "get_display_name_by_id",
            { p_user_id: profile.id },
        );
        displayName.value = nameData ?? slug;

        emit("resolved", displayName.value);
        await fetchAllForUser(profile.id);
    } else {
        await Promise.all([fetchAll(), fetchSources()]);
    }

    isFetching.value = false;
};

onMounted(init);
</script>

<template>
    <div class="release-list-page">
        <LoadingSpinner v-if="isFetching" />

        <template v-else>
            <template v-if="releases.length > 0">
                <div class="collection-header">
                    <div class="header-left">
                        <div class="search-field">
                            <span class="control-label">Search</span>
                            <div class="search-wrapper">
                                <input
                                    class="search-input"
                                    type="search"
                                    v-model="searchText"
                                />
                                <RiSearchLine
                                    class="search-icon"
                                    :width="16"
                                />
                            </div>
                        </div>

                        <div class="controls-row">
                            <div class="control-group">
                                <span class="control-label">View as</span>
                                <div class="view-buttons">
                                    <button
                                        :class="[
                                            'btn-view',
                                            {
                                                active: viewMode === 'grid',
                                            },
                                        ]"
                                        @click="viewMode = 'grid'"
                                        aria-label="Grid view"
                                    >
                                        <RiLayoutGridLine :width="15" />
                                    </button>
                                    <button
                                        :class="[
                                            'btn-view',
                                            {
                                                active: viewMode === 'list',
                                            },
                                        ]"
                                        @click="viewMode = 'list'"
                                        aria-label="List view"
                                    >
                                        <RiListUnordered :width="15" />
                                    </button>
                                </div>
                            </div>

                            <div class="control-group">
                                <span class="control-label">Filter by:</span>
                                <div class="filter-pills">
                                    <button
                                        :class="[
                                            'pill',
                                            { active: !mediaTypeFilter },
                                        ]"
                                        @click="mediaTypeFilter = ''"
                                    >
                                        All
                                    </button>
                                    <button
                                        v-for="type in MEDIA_TYPES"
                                        :key="type.value"
                                        :class="[
                                            'pill',
                                            {
                                                active:
                                                    mediaTypeFilter ===
                                                    type.value,
                                            },
                                        ]"
                                        @click="mediaTypeFilter = type.value"
                                    >
                                        {{ type.label }}
                                    </button>
                                </div>
                            </div>

                            <div class="control-group sort-group">
                                <span class="control-label">Sort By</span>
                                <select v-model="sortState">
                                    <option value="album_name">
                                        Album name
                                    </option>
                                    <option value="artist">Artist</option>
                                    <option value="release_date">
                                        Release year
                                    </option>
                                    <option value="acquired_date">
                                        Acquired date
                                    </option>
                                    <option value="created_at">
                                        Date added
                                    </option>
                                </select>
                                <button
                                    class="btn-sort-dir"
                                    @click="ascending = !ascending"
                                >
                                    <RiArrowUpLine
                                        v-if="ascending"
                                        :width="16"
                                    />
                                    <RiArrowDownLine v-else :width="16" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="header-right">
                        <div class="stat-pill stat-pill--total">
                            {{ releases.length }}
                            {{
                                releases.length === 1
                                    ? "Release"
                                    : "Releases"
                            }}
                            total
                        </div>
                        <div class="stat-pills">
                            <div
                                v-for="type in MEDIA_TYPES"
                                :key="type.value"
                                class="stat-pill"
                            >
                                {{ typeCounts[type.value] }}
                                {{ type.plural }}
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    v-if="filteredReleases.length > 0"
                    :class="['release-list', `release-list--${viewMode}`]"
                >
                    <ReleaseCard
                        v-for="release in filteredReleases"
                        :key="release.id"
                        :release="release"
                        :show-buttons="!publicUserId"
                        :view-mode="viewMode"
                        @deleted="handleDelete"
                    />
                </div>

                <p v-else class="no-results">No releases match your search.</p>
            </template>

            <div v-else-if="!publicUserId">
                <p>No releases found.</p>
                <router-link to="/add">Add your first release</router-link>
            </div>

            <div v-else>
                <p>This collection is empty.</p>
            </div>
        </template>
    </div>
</template>

<style scoped lang="scss">
.release-list-page {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.collection-header {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 2rem;
    align-items: start;

    @media screen and (max-width: 860px) {
        grid-template-columns: 1fr;
    }
}

.header-left {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.control-label {
    font-size: 0.78rem;
    font-weight: 600;
    color: $neutral-mid;
    white-space: nowrap;
}

.search-field {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
}

.search-wrapper {
    position: relative;

    .search-input {
        width: 100%;
        box-sizing: border-box;
        padding-right: 2.2rem;
    }

    .search-icon {
        position: absolute;
        right: 0.65rem;
        top: 50%;
        transform: translateY(-50%);
        color: $neutral-mid;
        pointer-events: none;
    }
}

.controls-row {
    display: flex;
    align-items: center;
    gap: 1.25rem;
    flex-wrap: wrap;
}

.control-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.sort-group {
    margin-left: auto;
}

.view-buttons {
    display: flex;
    gap: 0.25rem;
}

.btn-view {
    width: 32px;
    height: 32px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    background-color: $primary-muted;
    color: $primary-dark;

    &.active,
    &:hover {
        background-color: $primary;
        color: $neutral-white;
    }
}

.filter-pills {
    display: flex;
    gap: 0.35rem;
    flex-wrap: wrap;
}

.pill {
    padding: 0.25rem 0.85rem;
    border-radius: 999px;
    font-size: 0.8rem;
    font-weight: 500;
    background-color: $primary-muted;
    color: $primary-dark;
    cursor: pointer;
    border: none;

    &.active,
    &:hover {
        background-color: $primary;
        color: $neutral-white;
    }
}

.btn-sort-dir {
    width: 32px;
    height: 32px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.header-right {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-end;

    @media screen and (max-width: 860px) {
        flex-direction: row;
        flex-wrap: wrap;
        align-items: center;
        justify-content: flex-start;
    }
}

.stat-pill {
    padding: 0.5rem 1.25rem;
    border-radius: 999px;
    background-color: $primary-muted;
    color: $primary-darker;
    font-size: 0.85rem;
    font-weight: 500;
    white-space: nowrap;
}

.stat-pill--total {
    font-size: 0.95rem;
    font-weight: 600;
}

.stat-pills {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    justify-content: flex-end;

    @media screen and (max-width: 860px) {
        justify-content: flex-start;
    }
}

.release-list--grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1rem;
}

.release-list--list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.no-results {
    margin: 0;
    color: $primary-dark;
}
</style>
