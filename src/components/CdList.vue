<script setup>
import { onMounted, ref } from "vue";
import { useCds } from "@/composables/useCds";
import CdCard from "./CdCard.vue";

const { cds, fetchAll, sortCds } = useCds();
const ascending = ref(true);

onMounted(fetchAll);
</script>

<template>
    <div class="cd-list">
        <div class="sort-buttons">
            <button @click="sortCds('album_name', ascending)">
                Sort by Album Name
            </button>
            <button @click="sortCds('artist', ascending)">
                Sort by Artist
            </button>
            <button @click="sortCds('release_date', ascending)">
                Sort by Release Year
            </button>
            <button @click="sortCds('acquired_date', ascending)">
                Sort by Acquired Date
            </button>
            <div class="sort-order">
                <button @click="ascending = !ascending">
                    Toggle Sort Order
                </button>
                <p>
                    Current Sort Order:
                    {{ ascending ? "Ascending" : "Descending" }}
                </p>
            </div>
        </div>
        <div>
            <CdCard v-for="cd in cds" :key="cd.id" :cd="cd" />
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
