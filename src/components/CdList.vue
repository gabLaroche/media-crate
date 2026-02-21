<script setup>
import { onMounted } from "vue";
import { useCds } from "@/composables/useCds";
import CdCard from "./CdCard.vue";

const { cds, fetchAll } = useCds();
onMounted(fetchAll);
</script>

<template>
    <div>
        <CdCard v-for="cd in cds" :key="cd.id" :cd="cd" />
    </div>
</template>
