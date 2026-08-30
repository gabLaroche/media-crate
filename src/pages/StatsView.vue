<script setup>
import { computed, onMounted, ref, watch } from "vue";
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
import { formatDuration } from "@/lib/formatDuration";
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

// --- Acquisitions calendar (GitHub-style contribution graph) ---

const utcDateKey = (date) => date.toISOString().slice(0, 10);

// Most recent year first, so the toggle defaults to the latest year with data.
const acquisitionYears = computed(() => {
    const years = new Set();
    for (const r of releases.value) {
        if (!r.acquired_date) continue;
        years.add(new Date(r.acquired_date).getUTCFullYear());
    }
    return [...years].sort((a, b) => b - a);
});

const selectedYear = ref(null);

watch(
    acquisitionYears,
    (years) => {
        if (years.length && !years.includes(selectedYear.value)) {
            selectedYear.value = years[0];
        }
    },
    { immediate: true },
);

const acquisitionCalendar = computed(() => {
    if (!selectedYear.value) return { weeks: [], monthLabels: [] };
    const year = selectedYear.value;

    const counts = new Map();
    for (const r of releases.value) {
        if (!r.acquired_date) continue;
        const date = new Date(r.acquired_date);
        if (date.getUTCFullYear() !== year) continue;
        const key = utcDateKey(date);
        counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const now = new Date();
    const today = new Date(
        Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()),
    );

    // Pad out to full Sun-Sat weeks so every column has 7 rows; padding
    // days (outside the year, or after today) are rendered but hidden.
    const start = new Date(Date.UTC(year, 0, 1));
    start.setUTCDate(start.getUTCDate() - start.getUTCDay());
    const end = new Date(Date.UTC(year, 11, 31));
    end.setUTCDate(end.getUTCDate() + (6 - end.getUTCDay()));

    const days = [];
    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
        const key = utcDateKey(d);
        const inYear = d.getUTCFullYear() === year;
        days.push({
            date: new Date(d),
            key,
            count: inYear ? (counts.get(key) ?? 0) : 0,
            hidden: !inYear || d > today,
        });
    }

    const maxCount = Math.max(0, ...days.map((d) => d.count));

    const levelFor = (count) => {
        if (count === 0 || !maxCount) return 0;
        const ratio = count / maxCount;
        if (ratio <= 0.25) return 1;
        if (ratio <= 0.5) return 2;
        if (ratio <= 0.75) return 3;
        return 4;
    };

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
        weeks.push(
            days
                .slice(i, i + 7)
                .map((d) => ({ ...d, level: levelFor(d.count) })),
        );
    }

    // Label only the week containing the 1st of a month, so each month
    // gets exactly one label instead of every week near the start of one.
    const monthLabels = weeks.map((week) => {
        const firstOfMonth = week.find(
            (d) => !d.hidden && d.date.getUTCDate() === 1,
        );
        return firstOfMonth
            ? firstOfMonth.date.toLocaleDateString("en-US", {
                  month: "short",
                  timeZone: "UTC",
              })
            : "";
    });

    return { weeks, monthLabels };
});

const formatDayTooltip = (day) => {
    const label = day.date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
    });
    return `${day.count} acquired on ${label}`;
};

// Lets desktop users click-and-drag the calendar horizontally, since it
// has no scrollbar-visible affordance otherwise. Touch keeps native scroll.
const isDraggingCalendar = ref(false);
let dragStartX = 0;
let dragStartScrollLeft = 0;

const startCalendarDrag = (e) => {
    if (e.pointerType === "touch") return;
    isDraggingCalendar.value = true;
    dragStartX = e.clientX;
    dragStartScrollLeft = e.currentTarget.scrollLeft;
    e.currentTarget.setPointerCapture(e.pointerId);
};

const dragCalendar = (e) => {
    if (!isDraggingCalendar.value) return;
    e.currentTarget.scrollLeft = dragStartScrollLeft - (e.clientX - dragStartX);
};

const endCalendarDrag = () => {
    isDraggingCalendar.value = false;
};
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
                <div v-if="acquisitionYears.length" class="stat-card">
                    <div class="calendar__header">
                        <div class="calendar__title">
                            <RiCalendarLine class="stat-card__icon" />
                            <span
                                class="stat-card__label stat-card__label--heading stat-card__label--with-tooltip"
                            >
                                Acquisitions
                                <Tooltip
                                    text="Each square is a day. Darker squares mean more releases were added to your collection that day - hover a square for the exact count."
                                >
                                    <RiInformationLine
                                        class="stat-card__info-icon"
                                    />
                                </Tooltip>
                            </span>
                        </div>

                        <div
                            v-if="acquisitionYears.length > 1"
                            class="calendar__years"
                        >
                            <button
                                v-for="year in acquisitionYears"
                                :key="year"
                                type="button"
                                class="calendar__year-btn"
                                :class="{
                                    'calendar__year-btn--active':
                                        year === selectedYear,
                                }"
                                @click="selectedYear = year"
                            >
                                {{ year }}
                            </button>
                        </div>
                        <span v-else class="calendar__year-label">{{
                            selectedYear
                        }}</span>
                    </div>

                    <div class="calendar">
                        <div
                            class="calendar__scroll"
                            :class="{
                                'calendar__scroll--dragging':
                                    isDraggingCalendar,
                            }"
                            @pointerdown="startCalendarDrag"
                            @pointermove="dragCalendar"
                            @pointerup="endCalendarDrag"
                            @pointercancel="endCalendarDrag"
                        >
                            <div class="calendar__months">
                                <span
                                    v-for="(label, i) in acquisitionCalendar.monthLabels"
                                    :key="i"
                                    class="calendar__month"
                                    >{{ label }}</span
                                >
                            </div>
                            <div class="calendar__grid">
                                <template
                                    v-for="day in acquisitionCalendar.weeks.flat()"
                                    :key="day.key"
                                >
                                    <Tooltip
                                        v-if="!day.hidden"
                                        :text="formatDayTooltip(day)"
                                        :focusable="false"
                                        class="calendar__day-tooltip"
                                    >
                                        <div
                                            class="calendar__day"
                                            :class="`calendar__day--level-${day.level}`"
                                        />
                                    </Tooltip>
                                    <div
                                        v-else
                                        class="calendar__day calendar__day--hidden"
                                    />
                                </template>
                            </div>
                        </div>
                    </div>
                    <div class="calendar__legend">
                        <span>Less</span>
                        <span
                            v-for="level in [0, 1, 2, 3, 4]"
                            :key="level"
                            class="calendar__day"
                            :class="`calendar__day--level-${level}`"
                        />
                        <span>More</span>
                    </div>
                </div>
                <div v-else class="stat-card stat-card--pending">
                    <div class="stat-card__heading">
                        <RiCalendarLine class="stat-card__icon" />
                        <span
                            class="stat-card__label stat-card__label--heading"
                            >Acquisitions calendar</span
                        >
                    </div>
                    <span class="stat-card__value">Coming soon</span>
                </div>

                <div class="stat-card">
                    <div class="stat-card__heading">
                        <RiDiscLine class="stat-card__icon" />
                        <span
                            class="stat-card__label stat-card__label--heading"
                            >Total releases</span
                        >
                    </div>
                    <span class="stat-card__value">{{ totalReleases }}</span>
                </div>

                <div v-if="averageReleaseYear" class="stat-card">
                    <div class="stat-card__heading">
                        <RiCalendarLine class="stat-card__icon" />
                        <span
                            class="stat-card__label stat-card__label--heading"
                            >Average release year ({{ collectionAge }} years
                            old)</span
                        >
                    </div>
                    <span class="stat-card__value"
                        >{{ averageReleaseYear }}</span
                    >
                </div>

                <div
                    v-if="oldestReleaseYear && newestReleaseYear"
                    class="stat-card"
                >
                    <div class="stat-card__heading">
                        <RiTimeLine class="stat-card__icon" />
                        <span
                            class="stat-card__label stat-card__label--heading"
                            >Release year range</span
                        >
                    </div>
                    <span class="stat-card__value"
                        >{{ oldestReleaseYear }} – {{ newestReleaseYear }}</span
                    >
                </div>

                <div v-if="firstAcquiredDate" class="stat-card">
                    <div class="stat-card__heading">
                        <RiCalendarLine class="stat-card__icon" />
                        <span
                            class="stat-card__label stat-card__label--heading"
                            >First release added to your collection</span
                        >
                    </div>
                    <span class="stat-card__value">{{
                        formatDate(firstAcquiredDate)
                    }}</span>
                </div>

                <div v-if="topArtists.length" class="stat-card">
                    <div class="stat-card__heading">
                        <RiUserStarLine class="stat-card__icon" />
                        <span
                            class="stat-card__label stat-card__label--heading"
                            >Top artists</span
                        >
                    </div>
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
                    <div class="stat-card__heading">
                        <RiStore2Line class="stat-card__icon" />
                        <span
                            class="stat-card__label stat-card__label--heading"
                            >Top sources</span
                        >
                    </div>
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
                    <div class="stat-card__heading">
                        <RiHistoryLine class="stat-card__icon" />
                        <span
                            class="stat-card__label stat-card__label--heading"
                            >Releases by decade</span
                        >
                    </div>
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
                    <div class="stat-card__heading">
                        <RiPieChartLine class="stat-card__icon" />
                        <span
                            class="stat-card__label stat-card__label--heading"
                            >Format breakdown</span
                        >
                    </div>
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
                    <div class="stat-card__heading">
                        <RiBarChartLine class="stat-card__icon" />
                        <span
                            class="stat-card__label stat-card__label--heading"
                            >Condition breakdown</span
                        >
                    </div>
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
                    <div class="stat-card__heading">
                        <RiPriceTag3Line class="stat-card__icon" />
                        <span
                            class="stat-card__label stat-card__label--heading stat-card__label--with-tooltip"
                        >
                            Top genres
                            <Tooltip
                                text="Genre tags come from Discogs and are approximate - they may not match every release exactly."
                            >
                                <RiInformationLine
                                    class="stat-card__info-icon"
                                />
                            </Tooltip>
                        </span>
                    </div>
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
                    <div class="stat-card__heading">
                        <RiPriceTag3Line class="stat-card__icon" />
                        <span
                            class="stat-card__label stat-card__label--heading"
                            >Most common genre
                        </span>
                    </div>
                    <span class="stat-card__value">Coming soon</span>
                </div>

                <div v-if="averageDurationSeconds" class="stat-card">
                    <div class="stat-card__heading">
                        <RiTimeLine class="stat-card__icon" />
                        <span
                            class="stat-card__label stat-card__label--heading stat-card__label--with-tooltip"
                        >
                            Total collection length
                            <Tooltip
                                text="Track durations come from Discogs and are approximate - they may not match your physical copies exactly."
                            >
                                <RiInformationLine
                                    class="stat-card__info-icon"
                                />
                            </Tooltip>
                        </span>
                    </div>
                    <span class="stat-card__value"
                        >{{ formatDuration(totalDurationSeconds) }}</span
                    >
                </div>
                <div v-else class="stat-card stat-card--pending">
                    <div class="stat-card__heading">
                        <RiTimeLine class="stat-card__icon" />
                        <span
                            class="stat-card__label stat-card__label--heading"
                            >Total collection length</span
                        >
                    </div>
                    <span class="stat-card__value">Coming soon</span>
                </div>

                <div v-if="averageDurationSeconds" class="stat-card">
                    <div class="stat-card__heading">
                        <RiTimeLine class="stat-card__icon" />
                        <span
                            class="stat-card__label stat-card__label--heading stat-card__label--with-tooltip"
                        >
                            Average release length
                            <Tooltip
                                text="Track durations come from Discogs and are approximate - they may not match your physical copies exactly."
                            >
                                <RiInformationLine
                                    class="stat-card__info-icon"
                                />
                            </Tooltip>
                        </span>
                    </div>
                    <span class="stat-card__value"
                        >{{ formatDuration(averageDurationSeconds) }}</span
                    >
                </div>
                <div v-else class="stat-card stat-card--pending">
                    <div class="stat-card__heading">
                        <RiTimeLine class="stat-card__icon" />
                        <span
                            class="stat-card__label stat-card__label--heading"
                            >Average release length</span
                        >
                    </div>
                    <span class="stat-card__value">Coming soon</span>
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
    background-color: color-mix(in srgb, #{$border} 20%, transparent);
    border: 1px dashed $border;
    border-radius: 10px;
}

.stats-grid {
    columns: 4 220px;
    column-gap: 1.25rem;
    // A card taller than the column-balancing algorithm expects can make
    // the browser render a phantom extra column past the 4 specified,
    // widening the page itself even though every card's own content fits.
    overflow-x: hidden;
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

.calendar {
    $cell: 8px;
    $gap: 2px;

    // Flex items default to a min-width equal to their content's intrinsic
    // width, which would let the (much wider) grid push this card - and the
    // page - wider instead of scrolling internally.
    min-width: 0;

    &__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 0.6rem;
        margin-bottom: 0.5rem;
    }

    &__title {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        .stat-card__icon {
            margin-bottom: 0;
        }
    }

    &__years {
        display: flex;
        flex-wrap: wrap;
        min-width: 0;
        gap: 0.3rem;
    }

    &__year-btn {
        background: none;
        border: 1px solid $border;
        color: $text-muted;
        padding: 0.2rem 0.6rem;
        font-size: 0.75rem;
        border-radius: 999px;

        &:hover {
            background-color: rgba($primary, 0.1);
            color: $text;
        }

        &--active {
            background-color: $primary;
            border-color: $primary;
            color: $neutral-white;
        }
    }

    &__year-label {
        font-size: 0.75rem;
        color: $text-muted;
    }

    &__scroll {
        width: 100%;
        min-width: 0;
        overflow-x: auto;
        padding-bottom: 0.25rem;
        cursor: grab;
        user-select: none;

        &--dragging {
            cursor: grabbing;
        }
    }

    &__months {
        display: grid;
        grid-auto-flow: column;
        grid-auto-columns: $cell;
        gap: $gap;
        margin-bottom: 0.25rem;
        width: max-content;
    }

    &__month {
        font-size: 0.65rem;
        color: $text-muted;
        white-space: nowrap;
    }

    &__grid {
        display: grid;
        grid-auto-flow: column;
        grid-auto-columns: $cell;
        grid-template-rows: repeat(7, $cell);
        gap: $gap;
        width: max-content;
    }

    &__day-tooltip {
        display: flex;
        width: $cell;
        height: $cell;
    }

    &__legend {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        margin-top: 0.5rem;
        font-size: 0.7rem;
        color: $text-muted;
    }

    &__day {
        width: $cell;
        height: $cell;
        border-radius: 2px;
        background-color: color-mix(in srgb, #{$border} 60%, transparent);

        &--level-1 {
            background-color: rgba($primary, 0.25);
        }

        &--level-2 {
            background-color: rgba($primary, 0.5);
        }

        &--level-3 {
            background-color: rgba($primary, 0.75);
        }

        &--level-4 {
            background-color: $primary;
        }

        &--hidden {
            background-color: color-mix(in srgb, #{$border} 25%, transparent);
        }
    }
}

.stat-card__heading {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.stat-card__icon {
    color: $primary;
    width: 22px;
    height: 22px;
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
        background-color: color-mix(in srgb, #{$border} 60%, transparent);
        overflow: hidden;
    }

    &__fill {
        height: 100%;
        background-color: $primary;
        border-radius: 999px;
    }
}
</style>
