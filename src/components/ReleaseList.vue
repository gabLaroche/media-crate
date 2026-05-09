<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { supabase } from "@/lib/supabase";
import { useReleases } from "@/composables/useReleases";
import { RiArrowUpLine, RiArrowDownLine } from "@remixicon/vue";
import ReleaseCard from "./ReleaseCard.vue";
import LoadingSpinner from "./LoadingSpinner.vue";

const route = useRoute();

const emit = defineEmits(["resolved", "error"]);

const { releases, fetchAll, fetchAllForUser } = useReleases();

const ascending = ref(true);
const sortState = ref("acquired_date");
const isFetching = ref(false);
const searchText = ref("");
const mediaTypeFilter = ref("");

const publicUserId = ref(null);
const displayName = ref("");

const mediaTypes = computed(() => {
    const types = new Set(
        releases.value.map((r) => r.media_type).filter(Boolean),
    );
    return [...types].sort();
});

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
            {
                p_user_id: profile.id,
            },
        );
        displayName.value = nameData ?? slug;

        emit("resolved", displayName.value);

        await fetchAllForUser(profile.id);
    } else {
        await fetchAll();
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
                <p class="count">
                    <template v-if="publicUserId">
                        <strong>{{ displayName }}</strong> has
                    </template>
                    <template v-else>You have&nbsp;</template>
                    <strong>{{ releases.length }}</strong>
                    {{ releases.length === 1 ? "release" : "releases" }} in
                    {{ publicUserId ? "their" : "your" }} collection<template
                        v-if="filteredReleases.length !== releases.length"
                        >, showing {{ filteredReleases.length }}</template
                    >
                </p>

                <div class="controls">
                    <input
                        class="search-input"
                        type="search"
                        v-model="searchText"
                        placeholder="Search artist or album…"
                    />

                    <select
                        v-if="mediaTypes.length > 1"
                        v-model="mediaTypeFilter"
                        class="filter-select"
                    >
                        <option value="">All formats</option>
                        <option
                            v-for="type in mediaTypes"
                            :key="type"
                            :value="type"
                        >
                            {{ type }}
                        </option>
                    </select>

                    <div class="sort-controls">
                        <label for="sort-select">Sort:</label>
                        <select id="sort-select" v-model="sortState">
                            <option value="album_name">Release name</option>
                            <option value="artist">Artist</option>
                            <option value="release_date">Release year</option>
                            <option value="acquired_date">Acquired date</option>
                            <option value="created_at">Date added</option>
                        </select>
                        <button
                            class="sort-order-btn"
                            @click="ascending = !ascending"
                        >
                            <span>{{ ascending ? "Asc" : "Desc" }}</span>
                            <RiArrowUpLine v-if="ascending" :width="16" />
                            <RiArrowDownLine v-else :width="16" />
                        </button>
                    </div>
                </div>

                <div v-if="filteredReleases.length > 0" class="release-list">
                    <ReleaseCard
                        v-for="release in filteredReleases"
                        :key="release.id"
                        :release="release"
                        :show-buttons="!publicUserId"
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
    gap: 1rem;
}

.count {
    margin: 0;
}

.controls {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.75rem;
}

.search-input {
    flex: 1;
    min-width: 180px;
}

.filter-select {
    min-width: 130px;
}

.sort-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-left: auto;

    label {
        white-space: nowrap;
    }
}

.sort-order-btn {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    white-space: nowrap;
}

.release-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.no-results {
    margin: 0;
    color: $primary-dark;
}
</style>
