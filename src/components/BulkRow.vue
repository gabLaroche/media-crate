<script setup>
import { vMaska } from "maska/vue";
import SourceSelect from "@/components/SourceSelect.vue";
import ArtworkUpload from "@/components/ArtworkUpload.vue";

const props = defineProps({
    row: { type: Object, required: true },
    removable: { type: Boolean, default: true },
    editable: { type: Boolean, default: true },
    quotaExceeded: { type: Boolean, default: false },
});
const emit = defineEmits(["update:row", "remove"]);

const update = (field, value) => {
    emit("update:row", { ...props.row, [field]: value });
};
</script>

<template>
    <div class="bulk-row">
        <!-- Artwork -->
        <template v-if="editable">
            <img
                v-if="row.artwork_url && !row.artwork_file"
                :src="row.artwork_url"
                width="50"
                height="50"
                alt="Artwork"
            />
            <ArtworkUpload
                v-else
                :modelValue="row.artwork_url"
                :disabled="quotaExceeded"
                @update:modelValue="update('artwork_url', $event)"
                @file="update('artwork_file', $event)"
                @hash="update('artwork_hash', $event)"
            />
        </template>
        <template v-else>
            <img
                v-if="row.artwork_url"
                :src="row.artwork_url"
                width="50"
                height="50"
                alt="Artwork"
            />
        </template>

        <!-- Artist -->
        <div class="field-wrapper">
            <label>Artist:</label>
            <input
                :value="row.artist"
                :disabled="!editable"
                @input="update('artist', $event.target.value)"
                required
            />
        </div>

        <!-- Album -->
        <div class="field-wrapper">
            <label>Album:</label>
            <input
                :value="row.album_name"
                :disabled="!editable"
                @input="update('album_name', $event.target.value)"
                required
            />
        </div>

        <!-- Release Date -->
        <div class="field-wrapper">
            <label>Release Date:</label>
            <input
                type="text"
                v-maska="'####'"
                :value="row.release_date"
                :disabled="!editable"
                @input="update('release_date', $event.target.value)"
                placeholder="YYYY"
            />
        </div>

        <!-- Acquired Date -->
        <div class="field-wrapper">
            <label>Acquired Date:</label>
            <input
                type="date"
                :value="row.acquired_date"
                @input="update('acquired_date', $event.target.value)"
            />
        </div>

        <!-- Source -->
        <SourceSelect
            :modelValue="row.source_id"
            :typed="row.source_name"
            @update:modelValue="update('source_id', $event)"
            @update:typed="update('source_name', $event)"
        />

        <!-- Type -->
        <div class="field-wrapper">
            <label>Type:</label>
            <select
                :value="row.media_type"
                @change="update('media_type', $event.target.value)"
            >
                <option value="cd">CD</option>
                <option value="vinyl">Vinyl</option>
                <option value="cassette">Cassette</option>
            </select>
        </div>

        <!-- Condition -->
        <div class="field-wrapper">
            <label>Condition:</label>
            <select
                :value="row.condition"
                @change="update('condition', $event.target.value)"
            >
                <option value="new">New</option>
                <option value="used">Used</option>
            </select>
        </div>

        <!-- Notes -->
        <div class="field-wrapper">
            <label>Notes:</label>
            <textarea
                :value="row.notes"
                @input="update('notes', $event.target.value)"
                placeholder="(optional)"
            />
        </div>

        <!-- Exclude from Randomizer -->
        <div class="field-wrapper field-wrapper--checkbox">
            <label>
                <span>Exclude from Randomizer:</span>
                <span class="optional">(optional)</span>
            </label>
            <input
                type="checkbox"
                :checked="row.exclude_from_randomizer"
                @change="
                    update('exclude_from_randomizer', $event.target.checked)
                "
            />
        </div>

        <button v-if="removable" type="button" @click="emit('remove')">
            Remove
        </button>
    </div>
</template>
