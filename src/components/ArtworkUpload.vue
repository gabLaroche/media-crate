<script setup>
import { ref } from "vue";
import { RiUpload2Line, RiCloseLine } from "@remixicon/vue";

const props = defineProps({
    modelValue: { type: String, default: "" },
    disabled: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue", "file", "hash"]);

const inputRef = ref(null);
const processing = ref(false);
const error = ref("");

const MAX_PX = 300;
const MAX_BYTES = 1 * 1024 * 1024;
const QUALITY = 0.82;

const computeHash = async (blob) => {
    if (!crypto?.subtle) {
        console.warn(
            "[ArtworkUpload] crypto.subtle unavailable — hash deduplication disabled.",
        );
        return null;
    }
    const buffer = await blob.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    return Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
};

const processImage = (file) =>
    new Promise((resolve, reject) => {
        const supportedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (!supportedTypes.includes(file.type)) {
            return reject(
                new Error("Only JPEG, PNG, and WebP files are supported."),
            );
        }

        const img = new Image();
        const objectUrl = URL.createObjectURL(file);

        img.onload = () => {
            URL.revokeObjectURL(objectUrl);

            const side = Math.min(img.width, img.height);
            const sx = (img.width - side) / 2;
            const sy = (img.height - side) / 2;
            const outputSize = Math.min(side, MAX_PX);

            const canvas = document.createElement("canvas");
            canvas.width = outputSize;
            canvas.height = outputSize;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(
                img,
                sx,
                sy,
                side,
                side,
                0,
                0,
                outputSize,
                outputSize,
            );

            const outputType =
                file.type === "image/png" ? "image/png" : "image/jpeg";

            canvas.toBlob(
                (blob) => {
                    if (!blob)
                        return reject(new Error("Failed to process image."));
                    if (blob.size > MAX_BYTES) {
                        return reject(
                            new Error(
                                `Image is still ${(blob.size / 1024 / 1024).toFixed(1)}MB after compression. Please use a smaller image.`,
                            ),
                        );
                    }
                    const processedFile = new File(
                        [blob],
                        file.name.replace(
                            /\.[^.]+$/,
                            outputType === "image/png" ? ".png" : ".jpg",
                        ),
                        { type: outputType },
                    );
                    resolve(processedFile);
                },
                outputType,
                QUALITY,
            );
        };

        img.onerror = () => {
            URL.revokeObjectURL(objectUrl);
            reject(new Error("Could not load image."));
        };

        img.src = objectUrl;
    });

const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    error.value = "";
    processing.value = true;

    try {
        const processed = await processImage(file);
        const hash = await computeHash(processed);
        const previewUrl = URL.createObjectURL(processed);
        emit("update:modelValue", previewUrl);
        emit("file", processed);
        emit("hash", hash);
    } catch (err) {
        error.value = err.message;
        emit("update:modelValue", "");
        emit("file", null);
        emit("hash", null);
    } finally {
        processing.value = false;
        if (inputRef.value) inputRef.value.value = "";
    }
};

const clear = () => {
    emit("update:modelValue", "");
    emit("file", null);
    emit("hash", null);
    error.value = "";
    if (inputRef.value) inputRef.value.value = "";
};

defineExpose({ clear });
</script>

<template>
    <div class="artwork-upload">
        <template v-if="modelValue">
            <div class="artwork-upload__preview">
                <img :src="modelValue" alt="Artwork preview" />
                <button
                    type="button"
                    class="artwork-upload__remove"
                    @click="clear"
                    aria-label="Remove artwork"
                >
                    <RiCloseLine :size="14" />
                </button>
            </div>
        </template>

        <template v-else>
            <label
                class="artwork-upload__dropzone"
                :class="{
                    'artwork-upload__dropzone--disabled':
                        disabled || processing,
                }"
                :aria-disabled="disabled || processing"
            >
                <span v-if="processing" class="artwork-upload__status"
                    >Processing…</span
                >
                <template v-else-if="disabled">
                    <span
                        class="artwork-upload__status artwork-upload__status--blocked"
                    >
                        Storage quota reached
                    </span>
                </template>
                <template v-else>
                    <RiUpload2Line class="artwork-upload__icon" />
                    <span class="artwork-upload__label">Upload artwork</span>
                    <span class="artwork-upload__hint"
                        >JPEG · PNG · WebP · max 1MB · cropped to square</span
                    >
                </template>

                <input
                    ref="inputRef"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    :disabled="disabled || processing"
                    class="artwork-upload__input"
                    @change="onFileChange"
                />
            </label>

            <p v-if="error" class="artwork-upload__error">{{ error }}</p>
            <p class="artwork-upload__disclaimer">
                Uploaded artwork is visible to all users.
            </p>
        </template>
    </div>
</template>

<style lang="scss" scoped>
.artwork-upload {
    &__preview {
        position: relative;
        display: inline-block;

        img {
            display: block;
            width: 150px;
            height: 150px;
            object-fit: cover;
            border-radius: 6px;
        }
    }

    &__remove {
        position: absolute;
        top: -8px;
        right: -8px;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        border: none;
        background: $primary-dark;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;

        &:hover {
            background: red;
        }
    }

    &__dropzone {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        width: 150px;
        height: 150px;
        border: 2px dashed rgba($secondary-lighter, 0.4);
        border-radius: 6px;
        cursor: pointer;
        transition:
            border-color 0.15s,
            background 0.15s;
        text-align: center;
        padding: 12px;

        &:hover:not(&--disabled) {
            border-color: $secondary-lighter;
            background: rgba($secondary-lighter, 0.05);
        }

        &--disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
    }

    &__input {
        display: none;
    }

    &__icon {
        opacity: 0.6;
        width: 24px;
        height: 24px;
    }

    &__label {
        font-size: 0.8rem;
        font-weight: 600;
    }

    &__hint {
        font-size: 0.68rem;
        opacity: 0.5;
        line-height: 1.3;
    }

    &__status {
        font-size: 0.8rem;
        opacity: 0.7;

        &--blocked {
            color: red;
            opacity: 1;
        }
    }

    &__error {
        color: red;
        font-size: 0.8rem;
        margin-top: 6px;
        max-width: 150px;
    }

    &__disclaimer {
        font-size: 0.68rem;
        opacity: 0.45;
        margin-top: 6px;
        max-width: 150px;
        line-height: 1.3;
    }
}
</style>
