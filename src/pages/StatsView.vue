<script setup>
import { computed, onMounted, ref } from "vue";
import {
    RiDiscLine,
    RiCalendarLine,
    RiUserStarLine,
    RiStore2Line,
    RiPieChartLine,
    RiBarChartLine,
    RiTimeLine,
    RiPriceTag3Line,
} from "@remixicon/vue";
import { useReleases } from "@/composables/useReleases";
import { useSources } from "@/composables/useSources";
import LoadingSpinner from "@/components/LoadingSpinner.vue";

const { releases, fetchAll } = useReleases();
const { sources, fetchSources } = useSources();

const isLoading = ref(true);

onMounted(async () => {
    await Promise.all([fetchAll(), fetchSources()]);
    isLoading.value = false;
});

const totalReleases = computed(() => releases.value.length);

const releaseYears = computed(() =>
    releases.value
        .map((r) => Number(r.release_date))
        .filter((y) => Number.isFinite(y) && y > 0),
);

const averageReleaseYear = computed(() => {
    if (!releaseYears.value.length) return null;
    const sum = releaseYears.value.reduce((a, b) => a + b, 0);
    return Math.round(sum / releaseYears.value.length);
});

const collectionAge = computed(() => {
    if (averageReleaseYear.value === null) return null;
    return new Date().getFullYear() - averageReleaseYear.value;
});

const oldestReleaseYear = computed(() =>
    releaseYears.value.length ? Math.min(...releaseYears.value) : null,
);

const newestReleaseYear = computed(() =>
    releaseYears.value.length ? Math.max(...releaseYears.value) : null,
);

// Groups items by a derived key and returns the most frequent one.
const topByCount = (items, keyFn) => {
    const counts = new Map();
    for (const item of items) {
        const key = keyFn(item);
        if (!key) continue;
        counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    let top = null;
    for (const [name, count] of counts) {
        if (!top || count > top.count) top = { name, count };
    }
    return top;
};

const topArtist = computed(() => topByCount(releases.value, (r) => r.artist));

const sourceNameById = computed(
    () => new Map(sources.value.map((s) => [s.id, s.name])),
);

const topSource = computed(() =>
    topByCount(releases.value, (r) => sourceNameById.value.get(r.source_id)),
);

const breakdown = (counts) => {
    const entries = Object.entries(counts).filter(([, count]) => count > 0);
    return entries
        .map(([label, count]) => ({
            label,
            count,
            percent: totalReleases.value
                ? Math.round((count / totalReleases.value) * 100)
                : 0,
        }))
        .sort((a, b) => b.count - a.count);
};

const formatBreakdown = computed(() => {
    const counts = { CD: 0, Vinyl: 0, Cassette: 0 };
    const labels = { cd: "CD", vinyl: "Vinyl", cassette: "Cassette" };
    for (const r of releases.value) {
        const label = labels[r.media_type];
        if (label) counts[label]++;
    }
    return breakdown(counts);
});

const conditionBreakdown = computed(() => {
    const counts = { New: 0, Used: 0 };
    const labels = { new: "New", used: "Used" };
    for (const r of releases.value) {
        const label = labels[r.condition];
        if (label) counts[label]++;
    }
    return breakdown(counts);
});

const firstAcquiredDate = computed(() => {
    const dates = releases.value.map((r) => r.acquired_date).filter(Boolean);
    if (!dates.length) return null;
    return dates.reduce((earliest, d) => (d < earliest ? d : earliest));
});

const formatDate = (value) =>
    new Date(value).toLocaleDateString("en-CA", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
</script>

<template>
    <div class="page">
        <h1>Collection Stats</h1>
        <p class="page-subtitle">Some fun numbers about your collection.</p>

        <LoadingSpinner v-if="isLoading" />

        <p v-else-if="totalReleases === 0" class="empty-state">
            Add some releases to your collection to see stats here.
        </p>

        <template v-else>
            <div class="stats-grid">
                <div class="stat-card">
                    <RiDiscLine class="stat-card__icon" />
                    <span class="stat-card__value">{{ totalReleases }}</span>
                    <span class="stat-card__label">Total releases</span>
                </div>

                <div v-if="averageReleaseYear" class="stat-card">
                    <RiCalendarLine class="stat-card__icon" />
                    <span class="stat-card__value"
                        >{{ averageReleaseYear }}</span
                    >
                    <span class="stat-card__label"
                        >Average release year ({{ collectionAge }} years
                        old)</span
                    >
                </div>

                <div
                    v-if="oldestReleaseYear && newestReleaseYear"
                    class="stat-card"
                >
                    <RiTimeLine class="stat-card__icon" />
                    <span class="stat-card__value"
                        >{{ oldestReleaseYear }} – {{ newestReleaseYear }}</span
                    >
                    <span class="stat-card__label">Release year range</span>
                </div>

                <div v-if="topArtist" class="stat-card">
                    <RiUserStarLine class="stat-card__icon" />
                    <span class="stat-card__value">{{ topArtist.name }}</span>
                    <span class="stat-card__label"
                        >Most collected artist ({{ topArtist.count }}
                        release{{ topArtist.count !== 1 ? "s" : "" }})</span
                    >
                </div>

                <div v-if="topSource" class="stat-card">
                    <RiStore2Line class="stat-card__icon" />
                    <span class="stat-card__value">{{ topSource.name }}</span>
                    <span class="stat-card__label"
                        >Most used source ({{ topSource.count }}
                        release{{ topSource.count !== 1 ? "s" : "" }})</span
                    >
                </div>

                <div v-if="firstAcquiredDate" class="stat-card">
                    <RiCalendarLine class="stat-card__icon" />
                    <span class="stat-card__value">{{
                        formatDate(firstAcquiredDate)
                    }}</span>
                    <span class="stat-card__label"
                        >First release added to your collection</span
                    >
                </div>

                <div v-if="formatBreakdown.length" class="stat-card">
                    <RiPieChartLine class="stat-card__icon" />
                    <span class="stat-card__label stat-card__label--heading"
                        >Format breakdown</span
                    >
                    <div class="stat-card__bars">
                        <div
                            v-for="f in formatBreakdown"
                            :key="f.label"
                            class="bar"
                        >
                            <span class="bar__label"
                                >{{ f.label }} ({{ f.count }})</span
                            >
                            <div class="bar__track">
                                <div
                                    class="bar__fill"
                                    :style="{ width: `${f.percent}%` }"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="conditionBreakdown.length" class="stat-card">
                    <RiBarChartLine class="stat-card__icon" />
                    <span class="stat-card__label stat-card__label--heading"
                        >Condition breakdown</span
                    >
                    <div class="stat-card__bars">
                        <div
                            v-for="c in conditionBreakdown"
                            :key="c.label"
                            class="bar"
                        >
                            <span class="bar__label"
                                >{{ c.label }} ({{ c.count }})</span
                            >
                            <div class="bar__track">
                                <div
                                    class="bar__fill"
                                    :style="{ width: `${c.percent}%` }"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <!--
                    TODO: Most common genre requires capturing genre/style
                    data from Discogs at add-time (not currently stored on
                    releases) plus a migration to add the column(s), and
                    wouldn't apply retroactively to existing releases
                    without a backfill.
                -->
                <div class="stat-card stat-card--pending">
                    <RiPriceTag3Line class="stat-card__icon" />
                    <span class="stat-card__value">Coming soon</span>
                    <span class="stat-card__label"
                        >Most common genre — needs genre data we don't
                        collect yet</span
                    >
                </div>

                <!--
                    TODO: Total/average album length requires track
                    duration data, which only exists on Discogs *release*
                    objects (not the *master* objects our add flow
                    resolves to) - would need an extra Discogs API call
                    per add (master's main_release -> that release's
                    tracklist), a migration to store it, and again
                    wouldn't apply retroactively without a backfill.
                -->
                <div class="stat-card stat-card--pending">
                    <RiTimeLine class="stat-card__icon" />
                    <span class="stat-card__value">Coming soon</span>
                    <span class="stat-card__label"
                        >Total & average album length — needs track
                        duration data we don't collect yet</span
                    >
                </div>
            </div>
        </template>
    </div>
</template>

<style lang="scss" scoped>
.page-subtitle {
    color: $text-muted;
    margin: -0.75rem 0 1.5rem;
}

.empty-state {
    padding: 2rem 1.5rem;
    text-align: center;
    color: $text-muted;
    background-color: rgba($border, 0.2);
    border: 1px dashed $border;
    border-radius: 10px;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 1.25rem;
}

.stat-card {
    background-color: $surface;
    border: 1px solid $border;
    border-radius: 10px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;

    &--pending {
        border-style: dashed;
        opacity: 0.75;
    }
}

.stat-card__icon {
    color: $primary;
    width: 22px;
    height: 22px;
    margin-bottom: 0.25rem;
}

.stat-card__value {
    font-size: 1.4rem;
    font-weight: 700;
    line-height: 1.25;
}

.stat-card__label {
    color: $text-muted;
    font-size: 0.85rem;

    &--heading {
        font-weight: 700;
        text-transform: uppercase;
        font-size: 0.7rem;
        letter-spacing: 0.04em;
        color: $text-muted;
    }
}

.stat-card__bars {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    margin-top: 0.25rem;
}

.bar {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    &__label {
        font-size: 0.8rem;
        color: $text;
    }

    &__track {
        height: 6px;
        border-radius: 999px;
        background-color: rgba($border, 0.6);
        overflow: hidden;
    }

    &__fill {
        height: 100%;
        background-color: $primary;
        border-radius: 999px;
    }
}
</style>
