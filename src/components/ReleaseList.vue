<script setup>
import { onMounted, ref, watch } from "vue";
import { useReleases } from "@/composables/useReleases";
import { RiArrowUpLine, RiArrowDownLine, RiLoader4Line } from "@remixicon/vue";
import ReleaseCard from "./ReleaseCard.vue";

const { releases, fetchAll, sortReleases } = useReleases();
const ascending = ref(true);
const sortState = ref("acquired_date");
const isFetching = ref(true);

const handleDelete = (id) => {
    releases.value = releases.value.filter((item) => item.id !== id);
};

watch(sortState, () => {
    isFetching.value = true;
    sortReleases(sortState.value, ascending.value).finally(() => {
        isFetching.value = false;
    });
});

watch(ascending, () => {
    isFetching.value = true;
    sortReleases(sortState.value, ascending.value).finally(() => {
        isFetching.value = false;
    });
});

onMounted(() => {
    fetchAll().finally(() => {
        isFetching.value = false;
    });
});
</script>

<template>
    <div class="release-list">
        <p>
            You have <strong>{{ releases.length }}</strong>
            {{ releases.length > 1 ? "releases" : "release" }} in your
            collection
        </p>
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
                        {{ ascending ? "Acsending" : "Descending" }}
                    </span>

                    <RiArrowUpLine v-if="ascending" :width="16" />
                    <RiArrowDownLine v-else :width="16" />
                </button>
            </div>
        </div>
        <div v-if="isFetching" class="release-list"></div>
        <div v-if="releases.length > 0" class="release-list">
            <ReleaseCard
                v-for="release in releases"
                :key="release.id"
                :release="release"
                :show-buttons="true"
                @deleted="handleDelete"
            />
        </div>
    </div>
</template>

<style scoped lang="scss">
.sort-buttons {
    align-items: center;
    display: flex;
    gap: 10px;
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
    gap: 8px;
    justify-content: center;
}

.release-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    justify-content: center;
}
</style>
