<script setup>
import { computed } from "vue";
import { formatDuration, formatTrackDuration } from "@/lib/formatDuration";

const { release } = defineProps(["release"]);

const tracks = computed(() => release.tracklist ?? []);
</script>

<template>
    <div class="tracklist">
        <p v-if="!tracks.length" class="empty-state">
            Tracklist not available for this release.
        </p>

        <template v-else>
            <p v-if="release.duration_seconds" class="tracklist__summary">
                {{ tracks.length }}
                {{ tracks.length === 1 ? "track" : "tracks" }} &middot;
                {{ formatDuration(release.duration_seconds) }}
            </p>

            <ol class="tracklist__rows">
                <li
                    v-for="(track, i) in tracks"
                    :key="`${track.position}-${i}`"
                    class="tracklist__row"
                >
                    <span class="tracklist__position">{{
                        track.position
                    }}</span>
                    <span class="tracklist__title">{{ track.title }}</span>
                    <span class="tracklist__duration">{{
                        formatTrackDuration(track.duration_seconds) ?? "—"
                    }}</span>
                </li>
            </ol>
        </template>
    </div>
</template>

<style lang="scss" scoped>
.tracklist {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.875rem;
}

.tracklist__summary {
    margin: 0;
    font-size: 0.8rem;
    color: $text-muted;
}

.tracklist__rows {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin: 0;
    padding: 0;
    list-style: none;
}

.tracklist__row {
    display: flex;
    align-items: baseline;
    gap: 0.6rem;
    font-size: 0.85rem;
}

.tracklist__position {
    flex-shrink: 0;
    width: 1.5rem;
    color: $text-muted;
}

.tracklist__title {
    flex: 1;
    min-width: 0;
    overflow-wrap: break-word;
}

.tracklist__duration {
    flex-shrink: 0;
    color: $text-muted;
    font-variant-numeric: tabular-nums;
}

.empty-state {
    margin: 0;
    padding: 2rem 1.5rem;
    text-align: center;
    color: $text-muted;
    background-color: rgba($border, 0.2);
    border: 1px dashed $border;
    border-radius: 10px;
}
</style>
