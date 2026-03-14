<script setup>
import { ref } from "vue";
import ReleaseList from "@/components/ReleaseList.vue";
import NotFoundView from "@/pages/NotFoundView.vue";
import CollectionPrivateView from "@/pages/CollectionPrivateView.vue";

const displayName = ref("");
const errorType = ref(null); // "not-found" | "private" | null

const onResolved = (name) => {
    displayName.value = name;
    document.title = `${name}'s Collection | MediaCrate`;
};

const onError = (type) => {
    errorType.value = type;
    document.title =
        type === "private"
            ? "Private Collection | MediaCrate"
            : "Not Found | MediaCrate";
};
</script>

<template>
    <NotFoundView v-if="errorType === 'not-found'" />
    <CollectionPrivateView v-else-if="errorType === 'private'" />
    <div v-else>
        <h1>
            {{ displayName ? `${displayName}'s Collection` : "Collection" }}
        </h1>
        <ReleaseList @resolved="onResolved" @error="onError" />
    </div>
</template>
