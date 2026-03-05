<script setup>
import { ref, onMounted } from "vue";
import { useReleases } from "@/composables/useReleases";
import ReleaseCard from "@/components/ReleaseCard.vue";
import LoadingSpinner from "@/components/LoadingSpinner.vue";

const { fetchRandomRelease, updateRecencyWindow } = useReleases();
const current = ref(null);
const isFetching = ref(false);

onMounted(async () => {
    await updateRecencyWindow();
});

const pick = async () => {
    isFetching.value = true;
    const release = await fetchRandomRelease();
    if (release) {
        current.value = release;
    }
    isFetching.value = false;
};
</script>

<template>
    <div>
        <h1>Random Pick</h1>
        <button @click="pick">Pick Release</button>

        <LoadingSpinner v-if="isFetching" />

        <div class="release-container">
            <ReleaseCard
                v-if="current"
                :release="current"
                :show-buttons="false"
            />
        </div>
    </div>
</template>

<style scoped>
.release-container {
    margin-top: 20px;
}
</style>
