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
    RiHistoryLine,
    RiInformationLine,
} from "@remixicon/vue";
import { useReleases } from "@/composables/useReleases";
import { useSources } from "@/composables/useSources";
import LoadingSpinner from "@/components/LoadingSpinner.vue";
import Tooltip from "@/components/Tooltip.vue";

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

const sourceNameById = computed(
    () => new Map(sources.value.map((s) => [s.id, s.name])),
);

// Counts occurrences of a derived key, ranked highest-first.
const rankByCount = (items, keyFn) => {
    const counts = new Map();
    for (const item of items) {
        const key = keyFn(item);
        if (!key) continue;
        counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
};

// Scales a list of {name, count} against its own highest count, for
// histogram-style bars (tallest bar = 100%) rather than share-of-total.
const relativeToMax = (entries) => {
    const max = Math.max(...entries.map((e) => e.count), 0);
    return entries.map((e) => ({
        label: e.name,
        count: e.count,
        percent: max ? Math.round((e.count / max) * 100) : 0,
    }));
};

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

const TOP_N = 5;

const topArtists = computed(() =>
    relativeToMax(rankByCount(releases.value, (r) => r.artist).slice(0, TOP_N)),
);

const sourceBreakdown = computed(() => {
    const ranked = rankByCount(releases.value, (r) =>
        sourceNameById.value.get(r.source_id),
    );
    const entries = ranked.slice(0, TOP_N);
    const rest = ranked.slice(TOP_N);
    if (rest.length) {
        entries.push({
            name: "Other",
            count: rest.reduce((sum, s) => sum + s.count, 0),
        });
    }
    // Not run through breakdown() - "Other" should stay pinned last
    // rather than getting re-sorted by count.
    return entries.map((e) => ({
        label: e.name,
        count: e.count,
        percent: totalReleases.value
            ? Math.round((e.count / totalReleases.value) * 100)
            : 0,
    }));
});

const decadeBreakdown = computed(() => {
    const counts = new Map();
    for (const year of releaseYears.value) {
        const decade = `${Math.floor(year / 10) * 10}s`;
        counts.set(decade, (counts.get(decade) ?? 0) + 1);
    }
    const entries = [...counts.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => parseInt(a.name) - parseInt(b.name));
    return relativeToMax(entries);
});

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

const genreBreakdown = computed(() => {
    const counts = new Map();
    for (const r of releases.value) {
        for (const genre of r.genres ?? []) {
            counts.set(genre, (counts.get(genre) ?? 0) + 1);
        }
    }
    const entries = [...counts.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, TOP_N);
    return relativeToMax(entries);
});

const releasesWithDuration = computed(() =>
    releases.value.filter(
        (r) => Number.isFinite(r.duration_seconds) && r.duration_seconds > 0,
    ),
);

const totalDurationSeconds = computed(() =>
    releasesWithDuration.value.reduce((sum, r) => sum + r.duration_seconds, 0),
);

const averageDurationSeconds = computed(() =>
    releasesWithDuration.value.length
        ? Math.round(
              totalDurationSeconds.value / releasesWithDuration.value.length,
          )
        : null,
);

const formatDuration = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.round((totalSeconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

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

                <div v-if="firstAcquiredDate" class="stat-card">
                    <RiCalendarLine class="stat-card__icon" />
                    <span class="stat-card__value">{{
                        formatDate(firstAcquiredDate)
                    }}</span>
                    <span class="stat-card__label"
                        >First release added to your collection</span
                    >
                </div>

                <div v-if="topArtists.length" class="stat-card">
                    <RiUserStarLine class="stat-card__icon" />
                    <span class="stat-card__label stat-card__label--heading"
                        >Top artists</span
                    >
                    <div class="stat-card__bars">
                        <div
                            v-for="a in topArtists"
                            :key="a.label"
                            class="bar"
                        >
                            <span class="bar__label"
                                >{{ a.label }} ({{ a.count }})</span
                            >
                            <div class="bar__track">
                                <div
                                    class="bar__fill"
                                    :style="{ width: `${a.percent}%` }"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="sourceBreakdown.length" class="stat-card">
                    <RiStore2Line class="stat-card__icon" />
                    <span class="stat-card__label stat-card__label--heading"
                        >Top sources</span
                    >
                    <div class="stat-card__bars">
                        <div
                            v-for="s in sourceBreakdown"
                            :key="s.label"
                            class="bar"
                        >
                            <span class="bar__label"
                                >{{ s.label }} ({{ s.count }})</span
                            >
                            <div class="bar__track">
                                <div
                                    class="bar__fill"
                                    :style="{ width: `${s.percent}%` }"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="decadeBreakdown.length" class="stat-card">
                    <RiHistoryLine class="stat-card__icon" />
                    <span class="stat-card__label stat-card__label--heading"
                        >Releases by decade</span
                    >
                    <div class="stat-card__bars">
                        <div
                            v-for="d in decadeBreakdown"
                            :key="d.label"
                            class="bar"
                        >
                            <span class="bar__label"
                                >{{ d.label }} ({{ d.count }})</span
                            >
                            <div class="bar__track">
                                <div
                                    class="bar__fill"
                                    :style="{ width: `${d.percent}%` }"
                                />
                            </div>
                        </div>
                    </div>
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

                <div v-if="genreBreakdown.length" class="stat-card">
                    <RiPriceTag3Line class="stat-card__icon" />
                    <span
                        class="stat-card__label stat-card__label--heading stat-card__label--with-tooltip"
                    >
                        Top genres
                        <Tooltip
                            text="Genre tags come from Discogs and are approximate - they may not match every release exactly."
                        >
                            <RiInformationLine class="stat-card__info-icon" />
                        </Tooltip>
                    </span>
                    <div class="stat-card__bars">
                        <div
                            v-for="g in genreBreakdown"
                            :key="g.label"
                            class="bar"
                        >
                            <span class="bar__label"
                                >{{ g.label }} ({{ g.count }})</span
                            >
                            <div class="bar__track">
                                <div
                                    class="bar__fill"
                                    :style="{ width: `${g.percent}%` }"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div v-else class="stat-card stat-card--pending">
                    <RiPriceTag3Line class="stat-card__icon" />
                    <span class="stat-card__value">Coming soon</span>
                    <span class="stat-card__label"
                        >Most common genre
                    </span>
                </div>

                <div v-if="averageDurationSeconds" class="stat-card">
                    <RiTimeLine class="stat-card__icon" />
                    <span class="stat-card__value"
                        >{{ formatDuration(totalDurationSeconds) }}</span
                    >
                    <span
                        class="stat-card__label stat-card__label--with-tooltip"
                    >
                        Total collection length (avg
                        {{ formatDuration(averageDurationSeconds) }}/release)
                        <Tooltip
                            text="Track durations come from Discogs and are approximate - they may not match your physical copies exactly."
                        >
                            <RiInformationLine class="stat-card__info-icon" />
                        </Tooltip>
                    </span>
                </div>
                <div v-else class="stat-card stat-card--pending">
                    <RiTimeLine class="stat-card__icon" />
                    <span class="stat-card__value">Coming soon</span>
                    <span class="stat-card__label"
                        >Total & average album length</span
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
    columns: 4 220px;
    column-gap: 1.25rem;
}

.stat-card {
    background-color: $surface;
    border: 1px solid $border;
    border-radius: 10px;
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    break-inside: avoid;
    margin-bottom: 1.25rem;

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

    &--with-tooltip {
        display: inline-flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 0.3rem;
    }
}

.stat-card__info-icon {
    width: 13px;
    height: 13px;
    flex-shrink: 0;
    color: $text-muted;
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
