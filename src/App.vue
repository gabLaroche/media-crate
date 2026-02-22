<script setup></script>

<template>
    <router-view />
</template>

<style>
/* latin subset — adjust if you need other subsets */
body {
    font-family: "Lato", sans-serif;
    margin: 0;
    padding: 0;
    background-color: #f5f5f5;
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
    border: 1px solid #ccc;
    border-radius: 4px;
}

button {
    padding: 0.5rem 1rem;
    background-color: #007bff;
    color: #fff;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

button:hover {
    background-color: #0056b3;
}

button:disabled {
    background-color: #ccc;
    color: #666;
    cursor: not-allowed;
}
</style>
