<script setup>
import { ref } from "vue";
import { RiSunLine, RiMoonLine, RiMenuLine } from "@remixicon/vue";
import AccountMenu from "@/components/AccountMenu.vue";
import { useTheme } from "@/composables/useTheme";
import { useAuth } from "@/composables/useAuth";

const { theme, toggleTheme } = useTheme();
const { user } = useAuth();

const mobileNavRef = ref(null);
const closeMobileNav = () => mobileNavRef.value?.hidePopover();
</script>

<template>
    <nav class="navbar">
        <template v-if="user">
            <button
                type="button"
                class="nav-toggle"
                popovertarget="mobile-nav-popover"
                aria-label="Open menu"
            >
                <RiMenuLine />
            </button>

            <div class="nav-links">
                <router-link to="/">Collection</router-link>
                <router-link to="/add">Add</router-link>
                <router-link to="/bulk-add">Bulk Add</router-link>
                <router-link to="/random">Random</router-link>
            </div>

            <div
                class="mobile-nav"
                id="mobile-nav-popover"
                popover
                ref="mobileNavRef"
            >
                <div class="mobile-nav__container">
                    <router-link to="/" @click="closeMobileNav"
                        >Collection</router-link
                    >
                    <router-link to="/add" @click="closeMobileNav"
                        >Add</router-link
                    >
                    <router-link to="/bulk-add" @click="closeMobileNav"
                        >Bulk Add</router-link
                    >
                    <router-link to="/random" @click="closeMobileNav"
                        >Random</router-link
                    >
                </div>
            </div>
        </template>

        <div v-else class="auth-links">
            <router-link to="/login">Log in</router-link>
            <router-link to="/create-account">Sign up</router-link>
        </div>

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
            <AccountMenu v-if="user" />
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

.nav-toggle {
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

    @media (min-width: 768px) {
        display: none;
    }
}

.nav-links {
    display: none;

    @media (min-width: 768px) {
        display: flex;
        align-items: center;
        gap: 2rem;
    }
}

.auth-links {
    display: flex;
    align-items: center;
    gap: 2rem;
}

.mobile-nav {
    background-color: $surface;
    color: $text;
    border: 1px solid $border;
    padding: 1.6rem;
    position: absolute;
    inset: unset;
    top: 70px;
    left: 25px;
    width: 200px;

    &__container {
        display: flex;
        flex-direction: column;
        gap: 1.2rem;
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
