<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useReleases } from "@/composables/useReleases";
import ReleaseForm from "@/components/ReleaseForm.vue";

const props = defineProps({
    id: String, // from router
});

const { fetchOne } = useReleases();
const router = useRouter();

const release = ref(null);

const fetchRelease = async () => {
    try {
        const item = await fetchOne(props.id);
        if (!item) {
            router.push({ name: "collection" });
            return;
        }
        release.value = item;
    } catch {
        router.push({ name: "collection" });
    }
};

onMounted(fetchRelease);

const onSubmitted = () => {
    router.push({ name: "collection" });
};
</script>

<template>
    <div>
        <h1>Edit Release</h1>
        <ReleaseForm :release="release" @submitted="onSubmitted" />
    </div>
</template>
