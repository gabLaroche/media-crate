<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import {
    RiCloseLine,
    RiEyeLine,
    RiPencilLine,
    RiDeleteBin6Line,
    RiCalendarLine,
    RiArrowLeftSLine,
    RiArrowRightSLine,
} from "@remixicon/vue";
import { useReleases } from "@/composables/useReleases";
import ReleaseDetails from "@/components/ReleaseDetails.vue";
import ReleaseTracklist from "@/components/ReleaseTracklist.vue";

const {
    release,
    showButtons,
    viewMode = "grid",
} = defineProps(["release", "showButtons", "viewMode"]);
const { deleteRelease } = useReleases();

const emit = defineEmits(["deleted"]);
const deleteConfirmRef = ref(null);
const viewDialogRef = ref(null);
const activePage = ref("info");
const router = useRouter();

const goToEditPage = () => router.push(`/edit/${release.id}`);

const openViewDialog = () => {
    activePage.value = "info";
    viewDialogRef.value?.showModal();
};

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
        :class="['card', `card--${viewMode}`, 'card--clickable']"
        @click="openViewDialog"
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
                    <button class="btn-icon" @click="openViewDialog">
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
        <ReleaseDetails
            v-else
            :release="release"
            :showButtons="showButtons"
        />

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
            :id="`view-details-${release.id}`"
            ref="viewDialogRef"
            @click.self.stop="onViewDialogClick"
        >
            <div class="dialog-content view-dialog-content" @click.stop>
                <RiCloseLine
                    class="close-icon"
                    @click="viewDialogRef.close()"
                />
                <div class="card card--grid view-dialog-card">
                    <div class="card-image-wrap">
                        <img
                            class="card-image"
                            :src="
                                release.artwork_url ??
                                '/No_Image_Available.png'
                            "
                            :alt="release.album_name"
                        />
                    </div>

                    <div class="page-pager">
                        <button
                            type="button"
                            class="pager-btn"
                            :disabled="activePage === 'info'"
                            aria-label="Previous page"
                            @click="activePage = 'info'"
                        >
                            <RiArrowLeftSLine :width="18" />
                        </button>
                        <span class="pager-label">{{
                            activePage === "info" ? "Info" : "Tracklist"
                        }}</span>
                        <button
                            type="button"
                            class="pager-btn"
                            :disabled="activePage === 'tracklist'"
                            aria-label="Next page"
                            @click="activePage = 'tracklist'"
                        >
                            <RiArrowRightSLine :width="18" />
                        </button>
                    </div>

                    <div class="page-content">
                        <ReleaseDetails
                            v-if="activePage === 'info'"
                            :release="release"
                            :showButtons="false"
                        />
                        <ReleaseTracklist v-else :release="release" />
                    </div>
                </div>
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

    &.card--clickable {
        cursor: pointer;
    }

    &.card--list {
        display: flex;
        flex-direction: row;
        height: 72px;

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
    flex-shrink: 0;
}

.card-image {
    display: block;
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
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

// ── Dialog ───────────────────────────────────────────────
dialog {
    border: 0;
    background-color: transparent;
    cursor: default;
    // Prevent the dialog itself from becoming a second scroll container -
    // scrolling for oversized content happens inside .page-content instead.
    overflow: hidden;

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
    width: min(400px, 92vw);
    max-width: none;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
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
}

.view-dialog-card {
    width: 100%;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
}

.page-pager {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 0.75rem 0;
    flex-shrink: 0;
}

.page-content {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
}

.pager-label {
    min-width: 5rem;
    text-align: center;
    font-size: 0.85rem;
    font-weight: 600;
}

.pager-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    padding: 0;
    border-radius: 6px;
    background-color: $primary-muted;
    color: $primary-dark;

    &:hover:not(:disabled) {
        background-color: $primary-light;
        color: $neutral-white;
    }

    &:disabled {
        background-color: transparent;
        color: $text-muted;
        cursor: default;
    }
}
</style>
