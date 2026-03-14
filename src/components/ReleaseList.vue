<script setup>
import { onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { supabase } from "@/lib/supabase";
import { useReleases } from "@/composables/useReleases";
import { RiArrowUpLine, RiArrowDownLine } from "@remixicon/vue";
import ReleaseCard from "./ReleaseCard.vue";
import LoadingSpinner from "./LoadingSpinner.vue";

const route = useRoute();

const emit = defineEmits(["resolved", "error"]);

const {
    releases,
    fetchAll,
    fetchAllForUser,
    sortReleases,
    sortReleasesForUser,
} = useReleases();

const ascending = ref(true);
const sortState = ref("acquired_date");
const isFetching = ref(true);

// Set when viewing a public collection — null means own collection
const publicUserId = ref(null);
const displayName = ref("");

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

watch(sortState, () => {
    isFetching.value = true;
    const sorter = publicUserId.value
        ? sortReleasesForUser(
              publicUserId.value,
              sortState.value,
              ascending.value,
          )
        : sortReleases(sortState.value, ascending.value);
    sorter.finally(() => {
        isFetching.value = false;
    });
});

watch(ascending, () => {
    isFetching.value = true;
    const sorter = publicUserId.value
        ? sortReleasesForUser(
              publicUserId.value,
              sortState.value,
              ascending.value,
          )
        : sortReleases(sortState.value, ascending.value);
    sorter.finally(() => {
        isFetching.value = false;
    });
});

onMounted(init);
</script>

<template>
    <div class="release-list">
        <LoadingSpinner v-if="isFetching" />

        <template v-else>
            <p v-if="releases.length > 0">
                <template v-if="publicUserId">
                    <strong>{{ displayName }}</strong> has
                </template>
                <template v-else> You have </template>
                <strong>{{ releases.length }}</strong>
                {{ releases.length === 1 ? "release" : "releases" }} in
                {{ publicUserId ? "their" : "your" }} collection
            </p>

            <template v-if="releases.length > 0">
                <div class="sort-buttons">
                    <h2>Sort by:</h2>
                    <div>
                        <label for="album_name">Release Name:</label>
                        <input
                            type="radio"
                            id="album_name"
                            name="sort"
                            value="album_name"
                            v-model="sortState"
                        />
                    </div>
                    <div>
                        <label for="artist">Artist:</label>
                        <input
                            type="radio"
                            id="artist"
                            name="sort"
                            value="artist"
                            v-model="sortState"
                        />
                    </div>
                    <div>
                        <label for="release_date">Release Year:</label>
                        <input
                            type="radio"
                            id="release_date"
                            name="sort"
                            value="release_date"
                            v-model="sortState"
                        />
                    </div>
                    <div>
                        <label for="acquired_date">Acquired Date:</label>
                        <input
                            type="radio"
                            id="acquired_date"
                            name="sort"
                            value="acquired_date"
                            v-model="sortState"
                        />
                    </div>
                    <div class="sort-order">
                        <button @click="ascending = !ascending">
                            <span>
                                {{ ascending ? "Ascending" : "Descending" }}
                            </span>
                            <RiArrowUpLine v-if="ascending" :width="16" />
                            <RiArrowDownLine v-else :width="16" />
                        </button>
                    </div>
                </div>

                <div class="release-list">
                    <ReleaseCard
                        v-for="release in releases"
                        :key="release.id"
                        :release="release"
                        :show-buttons="!publicUserId"
                        @deleted="handleDelete"
                    />
                </div>
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
.sort-buttons {
    align-items: center;
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

.sort-buttons button {
    height: 40px;
}

.sort-order {
    @media screen and (min-width: 768px) {
        margin-left: auto;
    }
}

.sort-order button {
    display: flex;
    align-items: center;
    gap: 1rem;
    justify-content: center;
}

.release-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    justify-content: center;
}
</style>
