<script setup>
const year = new Date().getFullYear();

const links = [{ to: "/feedback", label: "Feedback" }];
</script>

<template>
    <footer class="app-footer">
        <span class="app-footer__copyright"
            >&copy; {{ year }} MediaCrate</span
        >
        <nav class="app-footer__links">
            <router-link
                v-for="link in links"
                :key="link.to"
                :to="link.to"
                >{{ link.label }}</router-link
            >
        </nav>
    </footer>
</template>

<style lang="scss" scoped>
.app-footer {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.6rem;
    border-top: 1px solid $border;
    color: $text-muted;
    font-size: 0.85rem;

    &__links {
        display: flex;
        gap: 1.6rem;

        a {
            color: $text-muted;

            &:hover {
                color: $text;
            }
        }
    }
}
</style>
