<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import {
    RiPencilLine,
    RiDeleteBin6Line,
    RiCalendarLine,
    RiImportLine,
    RiStore2Line,
    RiInformationLine,
    RiExternalLinkLine,
} from "@remixicon/vue";
import { useSources } from "@/composables/useSources";

const { release, showButtons } = defineProps(["release", "showButtons"]);
const { sources } = useSources();
const router = useRouter();

const sourceName = computed(
    () => sources.value.find((s) => s.id == release.source_id)?.name ?? null,
);

const acquiredDate = computed(() => {
    if (!release.acquired_date) return null;
    return new Date(release.acquired_date).toLocaleDateString("en-CA", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
});

const discogsUrl = computed(() => {
    if (!release.discogs_master_id) return null;
    const path = release.discogs_type === "release" ? "release" : "master";
    return `https://www.discogs.com/${path}/${release.discogs_master_id}`;
});

const goToEditPage = () => router.push(`/edit/${release.id}`);
</script>

<template>
    <div class="card-body">
        <div class="card-row">
            <div class="tags">
                <span v-if="release.media_type" class="tag">{{
                    release.media_type
                }}</span>
                <span v-if="release.condition" class="tag">{{
                    release.condition
                }}</span>
            </div>

            <div v-if="showButtons" class="action-buttons">
                <button class="btn-icon" @click="goToEditPage">
                    <RiPencilLine :width="15" />
                </button>
                <button
                    class="btn-icon btn-icon--danger"
                    command="show-modal"
                    :commandfor="`delete-confirm-${release.id}`"
                >
                    <RiDeleteBin6Line :width="15" />
                </button>
            </div>
        </div>

        <div class="card-info">
            <div class="info-block">
                <strong class="info-title">{{
                    release.album_name
                }}</strong>
                <span class="info-label">By</span>
                <strong>{{ release.artist }}</strong>
            </div>
        </div>

        <div class="card-details">
            <div v-if="release.release_date" class="detail-row">
                <RiCalendarLine :width="14" />
                <span>{{ release.release_date }}</span>
            </div>
            <div v-if="acquiredDate" class="detail-row">
                <RiImportLine :width="14" />
                <span>{{ acquiredDate }}</span>
            </div>
            <div v-if="sourceName" class="detail-row">
                <RiStore2Line :width="14" />
                <span>{{ sourceName }}</span>
            </div>
            <div v-if="release.notes" class="detail-row detail-row--notes">
                <RiInformationLine :width="14" />
                <span>{{ release.notes }}</span>
            </div>
            <a
                v-if="discogsUrl"
                :href="discogsUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="detail-row"
                @click.stop
            >
                <RiExternalLinkLine :width="14" />
                <span>View on Discogs</span>
            </a>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.card-body {
    padding: 0.875rem;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    gap: 0.75rem;
}

.card-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
}

.tags {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
    flex-shrink: 0;
}

.tag {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    background-color: $primary-muted;
    color: $primary-darker;
}

.action-buttons {
    display: flex;
    gap: 0.35rem;
    margin-left: auto;
    flex-shrink: 0;
}

.btn-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border-radius: 6px;
    background-color: $primary-muted;
    color: $primary-dark;

    &:hover {
        background-color: $primary-light;
        color: $neutral-white;
    }

    &.btn-icon--danger {
        background-color: hsl(337 100% 95%);
        color: $danger-dark;

        &:hover {
            background-color: $danger;
            color: $neutral-white;
        }
    }
}

.card-info {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.info-block {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
}

.info-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: $text-muted;
}

.info-title {
    font-size: 1.05rem;
}

.card-details {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-size: 0.85rem;
    color: $text-muted;
    border-top: 1px solid $border;
    padding-top: 0.75rem;
}

.detail-row {
    display: flex;
    align-items: center;
    gap: 0.4rem;

    svg {
        flex-shrink: 0;
    }
}

.detail-row--notes {
    border-top: 1px solid $border;
    padding-top: 0.35rem;
    margin-top: 0.1rem;
}
</style>
