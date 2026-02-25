<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useSources } from "@/composables/useSources";

const props = defineProps({
    modelValue: [String, Number], // bound source_id
});

const emit = defineEmits(["update:modelValue", "update:typed"]);

const { sources, fetchSources } = useSources();
const search = ref("");
const selectedExisting = ref(null);
const isOpen = ref(false);

onMounted(fetchSources);

const openDropdown = () => {
    isOpen.value = true;
};

const handleBlur = () => {
    // Small timeout so click can register before closing
    setTimeout(() => {
        isOpen.value = false;
    }, 150);
};

// Filter existing sources based on input
const filteredSources = computed(() => {
    return sources.value.filter((s) =>
        s.name.toLowerCase().includes(search.value.toLowerCase()),
    );
});

// Select an existing source from dropdown
const selectExisting = (s) => {
    selectedExisting.value = s;
    search.value = s.name;
    emit("update:modelValue", s.id); // binds to source_id in form
    emit("update:typed", ""); // clear typed new source
    isOpen.value = false;
};

// Watch for v-model changes to pre-fill (edit form)
watch(
    () => props.modelValue,
    (val) => {
        if (val) {
            const existing = sources.value.find((s) => s.id === val);
            if (existing) {
                selectedExisting.value = existing;
                search.value = existing.name;
            }
        }
    },
    { immediate: true },
);

// Expose the typed value for creation-on-submit
watch(search, (val) => {
    if (!selectedExisting.value || selectedExisting.value.name !== val) {
        selectedExisting.value = null;
        emit("update:modelValue", null); // no existing id selected
        emit("update:typed", val); // this will be used to create new source
    }
});
</script>

<template>
    <div class="field-wrapper source-select">
        <label>Source</label>
        <input
            class="source-select__input"
            type="text"
            v-model="search"
            placeholder="Type or select a source"
            @focus="openDropdown"
            @blur="handleBlur"
        />

        <ul
            v-if="isOpen && filteredSources.length"
            class="source-select__dropdown"
        >
            <li
                v-for="s in filteredSources"
                :key="s.id"
                @click="selectExisting(s)"
            >
                {{ s.name }}
            </li>
        </ul>
    </div>
</template>

<style lang="scss" scoped>
.source-select {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    margin-bottom: 1rem;

    &__dropdown {
        position: absolute;
        top: calc(100% + 2px);
        left: 0;
        right: 0;
        background-color: $neutral-white;
        border: 1px solid $neutral-light;
        border-top: none;
        border-radius: 0 0 4px 4px;
        max-height: 200px;
        margin: 0;
        overflow-y: auto;
        padding: 0;
        list-style: none;
        z-index: 1;

        li {
            padding: 0.5rem;
            cursor: pointer;

            &:hover {
                background-color: #f0f0f0;
            }
        }
    }
}
</style>
