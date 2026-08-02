<script setup>
import { RiSearchLine, RiDiscLine, RiShareLine } from "@remixicon/vue";

const features = [
    {
        icon: RiSearchLine,
        title: "Add releases in seconds",
        text: "Search Discogs by artist or album, or paste a release URL to autofill the details.",
    },
    {
        icon: RiDiscLine,
        title: "Track your physical media",
        text: "Track format, condition, source, and notes for every release.",
    },
    {
        icon: RiShareLine,
        title: "Share your collection",
        text: "Publish a public link so friends can browse what you've got.",
    },
];
</script>

<template>
    <div class="welcome">
        <section class="hero">
            <h1>MediaCrate</h1>
            <p class="hero__tagline">
                Catalog your CDs, vinyl, and cassettes. Track what you own,
                where it came from, and share your collection with the
                world.
            </p>
            <div class="hero__actions">
                <router-link to="/create-account" class="hero__cta"
                    >Get Started</router-link
                >
                <router-link to="/login" class="hero__cta hero__cta--outline"
                    >Log in</router-link
                >
            </div>
        </section>

        <section class="features">
            <div v-for="f in features" :key="f.title" class="feature">
                <component :is="f.icon" class="feature__icon" />
                <h3>{{ f.title }}</h3>
                <p>{{ f.text }}</p>
            </div>
        </section>
    </div>
</template>

<style lang="scss" scoped>
.welcome {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 3rem;
    padding: 2rem 0 3rem;
}

.hero {
    text-align: center;
    max-width: 560px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;

    h1 {
        font-size: 2.5rem;
        margin: 0;
    }

    &__tagline {
        color: $text-muted;
        font-size: 1.05rem;
        line-height: 1.5;
        margin: 0;
    }

    &__actions {
        display: flex;
        gap: 1rem;
        margin-top: 0.5rem;
        flex-wrap: wrap;
        justify-content: center;
    }

    &__cta {
        display: inline-block;
        background-color: $primary;
        color: $neutral-white;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        font-weight: bold;
        transition: all $transition;

        &:hover {
            background-color: $primary-dark;
        }

        &--outline {
            background-color: transparent;
            border: 1px solid $primary;
            color: $primary;
            padding: calc(0.5rem - 1px) calc(1rem - 1px);

            &:hover {
                background-color: $primary-dark;
                color: $neutral-white;
            }
        }
    }
}

.features {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1.5rem;
    max-width: 900px;
    margin: 0 auto;
    width: 100%;
}

.feature {
    background-color: $surface;
    border: 1px solid $border;
    border-radius: 10px;
    padding: 1.5rem;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;

    h3 {
        margin: 0;
        font-size: 1rem;
    }

    p {
        margin: 0;
        color: $text-muted;
        font-size: 0.9rem;
        line-height: 1.4;
    }

    &__icon {
        color: $primary;
        width: 28px;
        height: 28px;
    }
}
</style>
