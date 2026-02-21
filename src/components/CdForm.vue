<script setup>
import { reactive } from "vue";
import { useCds } from "@/composables/useCds";

const { addCd } = useCds();

const form = reactive({
    album_name: "",
    artist: "",
    release_date: "",
    acquired_date: "",
    source: "",
    condition: "used",
    notes: "",
});

const submit = async () => {
    await addCd(form);
};
</script>

<template>
    <form @submit.prevent="submit">
        <input v-model="form.album_name" placeholder="Album" required />
        <input v-model="form.artist" placeholder="Artist" required />
        <input type="date" v-model="form.release_date" />
        <input type="date" v-model="form.acquired_date" />
        <input v-model="form.source" placeholder="Source" />

        <select v-model="form.condition">
            <option value="new">New</option>
            <option value="used">Used</option>
        </select>

        <textarea v-model="form.notes" />
        <button>Add CD</button>
    </form>
</template>
