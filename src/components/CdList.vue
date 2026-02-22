<script setup>
import { onMounted, ref } from "vue";
import { useCds } from "@/composables/useCds";
import CdCard from "./CdCard.vue";

const { cds, fetchAll, sortCds } = useCds();
const ascending = ref(true);

onMounted(fetchAll);
</script>

<template>
    <button @click="sortCds('album_name', ascending)">Sort by Title</button>
    <button @click="sortCds('artist', ascending)">Sort by Artist</button>
    <button @click="sortCds('release_date', ascending)">
        Sort by Release Year
    </button>
    <button @click="sortCds('acquired_date', ascending)">
        Sort by Acquired Date
    </button>
    <button @click="ascending = !ascending">Toggle Sort Order</button>
    <p>Current Sort Order: {{ ascending ? "Ascending" : "Descending" }}</p>
    <div>
        <CdCard v-for="cd in cds" :key="cd.id" :cd="cd" />
    </div>
</template>
