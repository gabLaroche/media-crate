<script setup>
import { vMaska } from "maska/vue";
import { RiCloseLine } from "@remixicon/vue";
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
    <div :class="['bulk-row', removable ? 'bulk-row--compact' : 'bulk-row--full']">
        <button
            v-if="removable"
            type="button"
            class="bulk-row__remove"
            @click="emit('remove')"
            aria-label="Remove"
        >
            <RiCloseLine :width="14" />
        </button>

        <div class="bulk-row__primary">
            <template v-if="editable">
                <img
                    v-if="row.artwork_url && !row.artwork_file"
                    :src="row.artwork_url"
                    class="bulk-row__artwork-preview"
                    alt="Artwork"
                />
                <ArtworkUpload
                    v-else
                    :modelValue="row.artwork_url"
                    :disabled="quotaExceeded"
                    class="bulk-row__artwork"
                    @update:modelValue="update('artwork_url', $event)"
                    @file="update('artwork_file', $event)"
                    @hash="update('artwork_hash', $event)"
                />
            </template>
            <img
                v-else-if="row.artwork_url"
                :src="row.artwork_url"
                class="bulk-row__artwork-preview"
                alt="Artwork"
            />

            <div class="bulk-row__primary-fields">
                <div class="field">
                    <label>Artist <span class="required">*</span></label>
                    <input
                        :value="row.artist"
                        :disabled="!editable"
                        placeholder="e.g. Radiohead"
                        required
                        @input="update('artist', $event.target.value)"
                    />
                </div>

                <div class="field">
                    <label>Album <span class="required">*</span></label>
                    <input
                        :value="row.album_name"
                        :disabled="!editable"
                        placeholder="e.g. OK Computer"
                        required
                        @input="update('album_name', $event.target.value)"
                    />
                </div>
            </div>
        </div>

        <div class="bulk-row__secondary">
            <div class="field-grid field-grid--3">
                <div class="field">
                    <label>Release Year</label>
                    <input
                        type="text"
                        v-maska="'####'"
                        :value="row.release_date"
                        :disabled="!editable"
                        placeholder="YYYY"
                        @input="update('release_date', $event.target.value)"
                    />
                </div>

                <div class="field">
                    <label>Acquired Date</label>
                    <input
                        type="date"
                        :value="row.acquired_date"
                        @input="update('acquired_date', $event.target.value)"
                    />
                </div>

                <SourceSelect
                    :modelValue="row.source_id"
                    :typed="row.source_name"
                    @update:modelValue="update('source_id', $event)"
                    @update:typed="update('source_name', $event)"
                />
            </div>

            <div class="field-grid field-grid--2">
                <div class="field">
                    <label>Format</label>
                    <select
                        :value="row.media_type"
                        @change="update('media_type', $event.target.value)"
                    >
                        <option value="cd">CD</option>
                        <option value="vinyl">Vinyl</option>
                        <option value="cassette">Cassette</option>
                    </select>
                </div>

                <div class="field">
                    <label>Condition</label>
                    <select
                        :value="row.condition"
                        @change="update('condition', $event.target.value)"
                    >
                        <option value="new">New</option>
                        <option value="used">Used</option>
                    </select>
                </div>
            </div>

            <div class="field">
                <label>Notes</label>
                <textarea
                    :value="row.notes"
                    placeholder="Optional notes…"
                    maxlength="2000"
                    @input="update('notes', $event.target.value)"
                />
            </div>

            <label class="checkbox-field">
                <input
                    type="checkbox"
                    :checked="row.exclude_from_randomizer"
                    @change="
                        update(
                            'exclude_from_randomizer',
                            $event.target.checked,
                        )
                    "
                />
                <span>Exclude from Randomizer</span>
            </label>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.bulk-row {
    position: relative;
    background-color: $surface;
    border: 1px solid $border;
    border-radius: 10px;
    display: flex;
    flex-direction: column;
}

.bulk-row--full {
    .bulk-row__primary {
        padding: 1.25rem;
        border-bottom: 1px solid $border;
        border-radius: 10px 10px 0 0;
        background-color: rgba($border, 0.25);
    }

    .bulk-row__secondary {
        padding: 1.25rem;
    }
}

.bulk-row--compact {
    padding: 3rem 1rem 1rem;
    gap: 1rem;
}

.bulk-row__primary {
    display: flex;
    gap: 1.25rem;
    align-items: flex-start;
}

.bulk-row__artwork-preview {
    width: 110px;
    height: 110px;
    object-fit: cover;
    border-radius: 6px;
    flex-shrink: 0;
}

.bulk-row__artwork {
    flex-shrink: 0;
}

.bulk-row__primary-fields {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    min-width: 0;
}

.bulk-row__secondary {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.field-grid {
    display: grid;
    gap: 1rem;

    &--2 {
        grid-template-columns: repeat(2, 1fr);
    }

    &--3 {
        grid-template-columns: repeat(3, 1fr);
    }

    @media (max-width: 700px) {
        grid-template-columns: 1fr;
    }

    :deep(.source-select) {
        margin-bottom: 0;

        label {
            font-size: 0.7rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: $text-muted;
        }

        input {
            border-radius: 8px;
            padding: 0.65rem 0.75rem;
        }
    }
}

.field {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    min-width: 0;

    label {
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: $text-muted;
    }

    input,
    select,
    textarea {
        border-radius: 8px;
        padding: 0.65rem 0.75rem;
    }

    textarea {
        resize: vertical;
        min-height: 90px;
        font-family: inherit;
    }
}

.required {
    color: $danger;
}

.checkbox-field {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-weight: normal;
    cursor: pointer;
    width: fit-content;

    input {
        width: 1.2rem;
        height: 1.2rem;
    }
}

.bulk-row__remove {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    width: 26px;
    height: 26px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border-radius: 50%;
    background-color: hsl(337 100% 95%);
    color: $danger-dark;

    &:hover {
        background-color: $danger;
        color: $neutral-white;
    }
}
</style>
