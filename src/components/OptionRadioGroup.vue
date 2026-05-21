<script setup lang="ts">
interface OptionItem {
  readonly label: string;
  readonly value: string;
}

const props = defineProps<{
  title: string;
  name: string;
  options: readonly OptionItem[];
  modelValue: string;
  showError: boolean;
}>();

const emit = defineEmits<{
  (event: "update:modelValue", value: string): void;
}>();

function onChange(event: Event): void {
  const target = event.target as HTMLInputElement;
  emit("update:modelValue", target.value);
}
</script>

<template>
  <div>
    <h2 class="mb-4 text-[1.25rem] leading-6 font-medium text-[var(--primary-color)]">{{ title }}</h2>
    <div class="flex flex-wrap gap-3">
      <label
        v-for="option in props.options"
        :key="option.value"
        class="flex cursor-pointer items-center gap-2 select-none"
      >
        <input
          :name="props.name"
          :value="option.value"
          :checked="props.modelValue === option.value"
          :class="['radio-input', { error: props.showError }]"
          type="radio"
          @change="onChange"
        />
        <span class="text-base leading-5 text-[var(--text-main)]">{{ option.label }}</span>
      </label>
    </div>
  </div>
</template>
