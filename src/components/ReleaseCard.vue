<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import {
    RiCloseLine,
    RiEyeLine,
    RiPencilLine,
    RiDeleteBin6Line,
    RiCalendarLine,
    RiImportLine,
    RiStore2Line,
    RiInformationLine,
} from "@remixicon/vue";
import { useReleases } from "@/composables/useReleases";
import { useSources } from "@/composables/useSources";

const {
    release,
    showButtons,
    viewMode = "grid",
} = defineProps(["release", "showButtons", "viewMode"]);
const { deleteRelease } = useReleases();
const { sources } = useSources();

const emit = defineEmits(["deleted"]);
const deleteConfirmRef = ref(null);
const viewDialogRef = ref(null);
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

const goToEditPage = () => router.push(`/edit/${release.id}`);

const openViewDialog = () => viewDialogRef.value?.showModal();

const deleteItem = () => {
    deleteRelease(release.id).then(() => {
        emit("deleted", release.id);
        deleteConfirmRef.value.close();
    });
};

const onDialogClick = (e) => {
    if (e.currentTarget === deleteConfirmRef.value) {
        deleteConfirmRef.value.close();
    }
};

const onViewDialogClick = (e) => {
    if (e.currentTarget === viewDialogRef.value) {
        viewDialogRef.value.close();
    }
};
</script>

<template>
    <div
        :class="['card', `card--${viewMode}`]"
        @click="viewMode === 'list' && openViewDialog()"
    >
        <div class="card-image-wrap">
            <img
                class="card-image"
                :src="release.artwork_url ?? '/No_Image_Available.png'"
                :alt="release.album_name"
            />
        </div>

        <!-- ── LIST MODE BODY ── -->
        <template v-if="viewMode === 'list'">
            <div class="list-body">
                <div class="list-info">
                    <strong class="clamp">{{ release.album_name }}</strong>
                    <span class="clamp list-artist">{{
                        release.artist
                    }}</span>
                    <div
                        v-if="release.release_date"
                        class="detail-row list-release-date"
                    >
                        <RiCalendarLine :width="12" />
                        <span class="clamp">{{ release.release_date }}</span>
                    </div>
                </div>

                <div class="list-actions" @click.stop>
                    <button
                        class="btn-icon"
                        command="show-modal"
                        :commandfor="`view-details-${release.id}`"
                    >
                        <RiEyeLine :width="14" />
                    </button>
                    <template v-if="showButtons">
                        <button class="btn-icon" @click="goToEditPage">
                            <RiPencilLine :width="14" />
                        </button>
                        <button
                            class="btn-icon btn-icon--danger"
                            command="show-modal"
                            :commandfor="`delete-confirm-${release.id}`"
                        >
                            <RiDeleteBin6Line :width="14" />
                        </button>
                    </template>
                </div>
            </div>
        </template>

        <!-- ── GRID MODE BODY ── -->
        <template v-else>
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
                    <div
                        v-if="release.notes"
                        class="detail-row detail-row--notes"
                    >
                        <RiInformationLine :width="14" />
                        <span>{{ release.notes }}</span>
                    </div>
                </div>
            </div>
        </template>

        <dialog
            v-if="showButtons"
            :id="`delete-confirm-${release.id}`"
            ref="deleteConfirmRef"
            @click.self.stop="onDialogClick"
        >
            <div class="dialog-content" @click.stop>
                <RiCloseLine
                    class="close-icon"
                    @click="deleteConfirmRef.close()"
                />
                <p>
                    Are you sure you want to delete
                    <strong>{{ release.album_name }}</strong> by
                    <strong>{{ release.artist }}</strong
                    >?
                </p>
                <div class="dialog-buttons">
                    <button class="button--delete" @click="deleteItem">
                        Yes
                    </button>
                    <button
                        :commandfor="`delete-confirm-${release.id}`"
                        command="close"
                    >
                        No
                    </button>
                </div>
            </div>
        </dialog>

        <dialog
            v-if="viewMode === 'list'"
            :id="`view-details-${release.id}`"
            ref="viewDialogRef"
            @click.self.stop="onViewDialogClick"
        >
            <div class="dialog-content view-dialog-content" @click.stop>
                <RiCloseLine
                    class="close-icon"
                    @click="viewDialogRef.close()"
                />
                <ReleaseCard
                    :release="release"
                    :showButtons="false"
                    viewMode="grid"
                />
            </div>
        </dialog>
    </div>
</template>

<style lang="scss" scoped>
// ── Shared ──────────────────────────────────────────────
.card {
    background-color: $surface;
    border: 1px solid $border;
    border-radius: 10px;
    overflow: hidden;

    &.card--list {
        display: flex;
        flex-direction: row;
        height: 72px;
        cursor: pointer;

        .card-image-wrap {
            height: 100%;
            flex-shrink: 0;
        }

        .card-image {
            width: 100%;
            height: 100%;
            aspect-ratio: unset;
        }
    }
}

.card-image-wrap {
    overflow: hidden;
}

.card-image {
    display: block;
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
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

.info-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: $text-muted;
}

.detail-row {
    display: flex;
    align-items: center;
    gap: 0.4rem;

    svg {
        flex-shrink: 0;
    }
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

.clamp {
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
}

// ── List mode ────────────────────────────────────────────
.list-body {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0 1rem;
    flex: 1;
    min-width: 0;
}

.list-info {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;

    strong {
        font-size: 0.95rem;
    }
}

.list-artist {
    font-size: 0.85rem;
    color: $text-muted;
}

.list-release-date {
    font-size: 0.75rem;
    color: $text-muted;
}

.list-actions {
    display: flex;
    gap: 0.3rem;
    flex-shrink: 0;
}

// ── Grid mode ────────────────────────────────────────────
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

.action-buttons {
    display: flex;
    gap: 0.35rem;
    margin-left: auto;
    flex-shrink: 0;
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

.detail-row--notes {
    border-top: 1px solid $border;
    padding-top: 0.35rem;
    margin-top: 0.1rem;
}

// ── Dialog ───────────────────────────────────────────────
dialog {
    border: 0;
    background-color: transparent;
    cursor: default;

    &::backdrop {
        background-color: rgba($secondary-muted, 0.5);
    }
}

.dialog-content {
    background-color: $secondary-muted;
    color: $neutral-dark;
    border-radius: 8px;
    border: 1px solid $secondary-lighter;
    max-width: 400px;
    padding: 2rem;
    position: relative;

    .close-icon {
        position: absolute;
        top: 1rem;
        right: 1rem;
        color: $primary-dark;
        cursor: pointer;

        &:hover {
            color: $primary-darker;
        }
    }
}

.dialog-buttons {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
}

.view-dialog-content {
    background-color: transparent;
    border: none;
    padding: 2.5rem 0 0;
    width: min(360px, 92vw);
    max-width: none;
    color: $text;

    .close-icon {
        background-color: rgba($neutral-dark, 0.55);
        color: $neutral-white;
        border-radius: 50%;
        padding: 0.3rem;
        top: 0.5rem;
        right: 0.5rem;

        &:hover {
            background-color: rgba($neutral-dark, 0.75);
            color: $neutral-white;
        }
    }

    :deep(.card) {
        width: 100%;
    }

    :deep(.card-image-wrap) {
        width: 100%;
    }
}
</style>
