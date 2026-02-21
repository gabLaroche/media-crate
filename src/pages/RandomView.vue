<script setup>
import { ref } from "vue";
import { useCds } from "@/composables/useCds";

const { getRandomCd } = useCds();
const current = ref(null);

const pick = async () => (current.value = await getRandomCd());
</script>

<template>
    <div>
        <h1>Random Pick</h1>
        <button @click="pick">Pick CD</button>

        <div v-if="current">
            <h2>{{ current.album_name }}</h2>
            <p>{{ current.artist }}</p>
        </div>
    </div>
</template>
