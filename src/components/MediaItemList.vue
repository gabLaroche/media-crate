<script setup>
import { onMounted, ref, watch } from "vue";
import { useMediaItems } from "@/composables/useMediaItems";
import { RiArrowUpLine, RiArrowDownLine } from "@remixicon/vue";
import MediaItemCard from "./MediaItemCard.vue";

const { mediaItems, fetchAll, sortMediaItems } = useMediaItems();
const ascending = ref(true);
const sortState = ref("acquired_date");

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
            <button @click="sortState = 'album_name'">
                Sort by Album Name
            </button>
            <button @click="sortState = 'artist'">Sort by Artist</button>
            <button @click="sortState = 'release_date'">
                Sort by Release Year
            </button>
            <button @click="sortState = 'acquired_date'">
                Sort by Acquired Date
            </button>
            <div class="sort-order">
                <button @click="ascending = !ascending">
                    Toggle Sort Order

                    <RiArrowUpLine v-if="ascending" />
                    <RiArrowDownLine v-else />
                </button>
            </div>
        </div>
        <div>
            <MediaItemCard
                v-for="mediaItem in mediaItems"
                :key="mediaItem.id"
                :media-item="mediaItem"
            />
        </div>
    </div>
</template>

<style scoped>
.sort-buttons {
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
</style>
