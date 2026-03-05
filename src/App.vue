<script setup></script>

<template>
    <router-view />
</template>

<style lang="scss">
body {
    font-family: "Lato", sans-serif;
    margin: 0;
    padding: 16px;
    background-color: $primary-lighter;
}

* {
    box-sizing: border-box;
}

/* Lato 300 */
@font-face {
    font-family: "Lato";
    font-style: normal;
    font-weight: 300;
    font-display: swap;
    src: url("https://fonts.gstatic.com/s/lato/v24/S6u9w4BMUTPHh7USSwiPGQ.woff2")
        format("woff2");
}

@font-face {
    font-family: "Lato";
    font-style: italic;
    font-weight: 300;
    font-display: swap;
    src: url("https://fonts.gstatic.com/s/lato/v24/S6u8w4BMUTPHjxsAXC-q.woff2")
        format("woff2");
}

/* Lato 400 */
@font-face {
    font-family: "Lato";
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: url("https://fonts.gstatic.com/s/lato/v24/S6uyw4BMUTPHjx4wXg.woff2")
        format("woff2");
}

@font-face {
    font-family: "Lato";
    font-style: italic;
    font-weight: 400;
    font-display: swap;
    src: url("https://fonts.gstatic.com/s/lato/v24/S6u8w4BMUTPHjxswWC-q.woff2")
        format("woff2");
}

/* Lato 700 */
@font-face {
    font-family: "Lato";
    font-style: normal;
    font-weight: 700;
    font-display: swap;
    src: url("https://fonts.gstatic.com/s/lato/v24/S6u9w4BMUTPHh6UVSwiPGQ.woff2")
        format("woff2");
}

@font-face {
    font-family: "Lato";
    font-style: italic;
    font-weight: 700;
    font-display: swap;
    src: url("https://fonts.gstatic.com/s/lato/v24/S6u8w4BMUTPHjxswXg-q.woff2")
        format("woff2");
}

form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

label {
    font-weight: bold;
}

input,
select,
textarea {
    background-color: $neutral-white;
    padding: 0.5rem;
    border: 1px solid $neutral-light;
    border-radius: 4px;
}

button {
    padding: 0.5rem 1rem;
    background-color: $primary;
    color: $neutral-white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all $transition;
}

button:hover {
    background-color: $primary-dark;
}

button:disabled {
    background-color: $neutral-mid;
    color: $neutral-white;
    cursor: not-allowed;
}

.button {
    &--delete {
        background-color: $danger;

        &:hover {
            background-color: $danger-dark;
        }
    }

    &--link-style {
        color: $primary;
        background-color: transparent;
        border: none;
        cursor: pointer;
        padding: 0;

        &:hover {
            color: $primary-dark;
            background-color: transparent;
        }
    }

    &--field-icon {
        padding: 0;
        color: $primary;
        background-color: transparent;
        border: none;
        cursor: pointer;

        &:hover {
            color: $primary-dark;
            background-color: transparent;
        }
    }
}

.optional {
    color: $neutral-mid;
    font-size: 0.8em;
    margin-left: 5px;
}

.field-wrapper {
    justify-content: flex-start;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    &--checkbox {
        align-items: center;
        flex-direction: row;

        input {
            width: 1rem;
            height: 1rem;
        }
    }
}

a:link,
a:visited {
    color: $primary;
    text-decoration: none;
    transition: all $transition;
}

a:hover,
a:active {
    color: $primary-dark;
}

img {
    border-radius: 4px;
    max-width: 100%;
    height: auto;
}
</style>
