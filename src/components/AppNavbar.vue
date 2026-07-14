<script setup>
import { RiSunLine, RiMoonLine } from "@remixicon/vue";
import AccountMenu from "@/components/AccountMenu.vue";
import { useTheme } from "@/composables/useTheme";

const { theme, toggleTheme } = useTheme();
</script>

<template>
    <nav class="navbar">
        <router-link to="/">Collection</router-link>
        <router-link to="/add">Add</router-link>
        <router-link to="/bulk-add">Bulk Add</router-link>
        <router-link to="/random">Random</router-link>
        <div class="nav-end">
            <button
                type="button"
                class="theme-toggle"
                @click="toggleTheme"
                :aria-label="
                    theme === 'dark'
                        ? 'Switch to light mode'
                        : 'Switch to dark mode'
                "
            >
                <RiSunLine v-if="theme === 'dark'" />
                <RiMoonLine v-else />
            </button>
            <AccountMenu />
        </div>
    </nav>
</template>

<style lang="scss" scoped>
.navbar {
    align-items: center;
    display: flex;
    gap: 2rem;
    padding: 1.2rem;
    border-bottom: 1px solid $border;

    a {
        font-weight: bold;
    }
}

.nav-end {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 1rem;
}

.theme-toggle {
    background: none;
    border: none;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: inherit;
    cursor: pointer;

    svg {
        width: 2.4rem;
        height: 2.4rem;
    }
}
</style>
