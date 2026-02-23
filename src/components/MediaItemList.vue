<script setup>
import { onMounted, ref, watch } from "vue";
import { useMediaItems } from "@/composables/useMediaItems";
import { RiArrowUpLine, RiArrowDownLine } from "@remixicon/vue";
import MediaItemCard from "./MediaItemCard.vue";

const { mediaItems, fetchAll, sortMediaItems } = useMediaItems();
const ascending = ref(true);
const sortState = ref("acquired_date");

const handleDelete = (id) => {
    mediaItems.value = mediaItems.value.filter((item) => item.id !== id);
};

watch(sortState, () => {
    sortMediaItems(sortState.value, ascending.value);
});

watch(ascending, () => {
    sortMediaItems(sortState.value, ascending.value);
});

onMounted(() => {
    fetchAll();
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
        <div>
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

<style scoped>
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
    margin-left: auto;
}

.sort-order button {
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: center;
}
</style>
