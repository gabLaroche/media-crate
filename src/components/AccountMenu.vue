<script setup>
import { computed } from "vue";
import { useAuth } from "@/composables/useAuth";
import { useRouter } from "vue-router";
import { RiAccountCircle2Line, RiLogoutBoxLine } from "@remixicon/vue";

const router = useRouter();
const { logout, user } = useAuth();

const onLogout = async () => {
    await logout();
    router.push({ path: "/login" });
};

const displayName = computed(
    () => user?.value?.user_metadata?.display_name ?? user?.value?.email,
);
</script>
<template>
    <div class="account-menu">
        <button class="account-btn" popovertarget="account-popover">
            <RiAccountCircle2Line />
        </button>

        <div class="account-popover" id="account-popover" popover>
            <div class="account-popover__container">
                <div class="account-popover__display-name">
                    Hi {{ displayName }}!
                </div>
                <router-link
                    to="/account"
                    popovertarget="account-popover"
                    popovertargetaction="hide"
                >
                    My account
                </router-link>
                <button
                    class="account-popover__logout button button--link-style"
                    @click="onLogout"
                >
                    <RiLogoutBoxLine :width="16" :height="16" />
                    Log out
                </button>
            </div>
        </div>
    </div>
</template>
<style scoped lang="scss">
.account-menu {
    margin-left: auto;
    position: relative;
}
.account-btn {
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 0;
    color: inherit;

    svg {
        width: 2.4rem;
        height: 2.4rem;
    }
}

.account-popover {
    border: transparent;
    padding: 1.6rem;
    position: absolute;
    inset: unset;
    top: 70px;
    right: 25px;
    width: 200px;

    &__display-name,
    &__logout,
    a {
        font-size: 1.6rem;
    }

    &__container {
        display: flex;
        flex-direction: column;
        gap: 1.6rem;
    }

    &__logout {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        text-align: left;
    }
}
</style>
