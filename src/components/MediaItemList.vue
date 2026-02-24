<script setup>
import { onMounted, ref, watch } from "vue";
import { useMediaItems } from "@/composables/useMediaItems";
import { RiArrowUpLine, RiArrowDownLine, RiLoader4Line } from "@remixicon/vue";
import MediaItemCard from "./MediaItemCard.vue";

const { mediaItems, fetchAll, sortMediaItems } = useMediaItems();
const ascending = ref(true);
const sortState = ref("acquired_date");
const isFetching = ref(true);

const handleDelete = (id) => {
    mediaItems.value = mediaItems.value.filter((item) => item.id !== id);
};

watch(sortState, () => {
    isFetching.value = true;
    sortMediaItems(sortState.value, ascending.value).finally(() => {
        isFetching.value = false;
    });
});

watch(ascending, () => {
    isFetching.value = true;
    sortMediaItems(sortState.value, ascending.value).finally(() => {
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
    <div class="media-item-list">
        <div class="sort-buttons">
            <h2>Sort by:</h2>
            <div>
                <label for="album_name">Album Name:</label>
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
        <div v-if="isFetching" class="media-item-list"></div>
        <div v-if="mediaItems.length > 0" class="media-item-list">
            <MediaItemCard
                v-for="mediaItem in mediaItems"
                :key="mediaItem.id"
                :media-item="mediaItem"
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

.media-item-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    justify-content: center;
}
</style>
