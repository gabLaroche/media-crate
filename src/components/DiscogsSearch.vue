<script setup>
import { ref } from "vue";
import { searchRelease } from "@/lib/discogs";

const emit = defineEmits(["selected"]);

const artist = ref("");
const album = ref("");
const results = ref([]);
const loading = ref(false);

const search = async () => {
    loading.value = true;
    const data = await searchRelease({
        artist: artist.value,
        title: album.value,
    });
    results.value = data.results || [];
    console.log(data);
    loading.value = false;
};

const selectRelease = (r) => {
    emit("selected", r);
    results.value = [];
    artist.value = "";
    album.value = "";
};
</script>

<template>
    <div class="discogs-search">
        <h3>Auto-fill from Discogs</h3>

        <div class="search">
            <input v-model="artist" placeholder="Artist" />
            <input v-model="album" placeholder="Album" />

            <button @click="search">Search</button>
        </div>

        <p v-if="loading">Searching…</p>

        <div class="results">
            <div v-for="r in results" :key="r.id" class="result">
                <div>
                    <img v-if="r.cover_image" :src="r.cover_image" width="60" />
                    <span>{{ r.title }} ({{ r.year }})</span>
                </div>
                <button @click="selectRelease(r)">Use</button>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.discogs-search {
    margin-bottom: 20px;
    .search {
        display: flex;
        gap: 10px;
    }

    .results {
        max-width: 500px;
        max-height: 300px;
        overflow-y: auto;
    }
    .result {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        margin: 10px 0;
    }
}
</style>
