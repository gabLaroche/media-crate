<script setup></script>

<template>
    <router-view />
</template>

<style>
:root {
    --primary-color: #007bff;
    --primary-color-dark: #0069d9;
    --secondary-color: #ccc;
    --success-color: #28a745;
    --danger-color: #dc3545;
    --warning-color: #ffc107;
    --info-color: #17a2b8;
    --light-color: #f8f9fa;
    --dark-color: #343a40;
}

body {
    font-family: "Lato", sans-serif;
    margin: 0;
    padding: 16px;
    background-color: var(--light-color);
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
    padding: 0.5rem;
    border: 1px solid var(--secondary-color);
    border-radius: 4px;
}

button {
    padding: 0.5rem 1rem;
    background-color: var(--primary-color);
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s ease;
}

button:hover {
    background-color: var(--primary-color-dark);
}

button:disabled {
    background-color: var(--secondary-color);
    color: #000;
    cursor: not-allowed;
}

a:link,
a:visited {
    color: var(--primary-color);
    text-decoration: none;
    transition: all 0.3s ease;
}

a:hover,
a:active {
    color: var(--primary-color-dark);
}
</style>
