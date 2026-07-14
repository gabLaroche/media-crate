import { createApp } from "vue";
import { registerSW } from "virtual:pwa-register";
import App from "./App.vue";
import router from "./router";
import { useAuth } from "@/composables/useAuth";
import { useTheme } from "@/composables/useTheme";
import "@/assets/styles/_base.scss";

useTheme().init();

const app = createApp(App);

const { init } = useAuth();
await init();

app.use(router);

app.mount("#app");
registerSW({ immediate: true });
