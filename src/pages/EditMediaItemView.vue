<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useMediaItems } from "@/composables/useMediaItems";
import MediaItemForm from "@/components/MediaItemForm.vue";

const props = defineProps({
    id: String, // from router
});

const { fetchOne } = useMediaItems();
const router = useRouter();

const mediaItem = ref(null);

const fetchMediaItem = async () => {
    const item = await fetchOne(props.id);

    if (!item) {
        window.history.back();
        return;
    }

    mediaItem.value = item;
};

onMounted(fetchMediaItem);

const onSubmitted = () => {
    router.push({ name: "collection" });
};
</script>

<template>
    <div>
        <h1>Edit Media item</h1>
        <MediaItemForm :media-item="mediaItem" @submitted="onSubmitted" />
    </div>
</template>
