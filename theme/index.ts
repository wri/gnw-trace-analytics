/**
 * Chakra UI v3 system mirroring the GNW (project-zeno-next) theme:
 * IBM Plex Sans/Mono, GNW primary blue, neutral grays and accent palette.
 */

import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  theme: {
    tokens: {
      fonts: {
        heading: { value: "var(--font-IBMPlexSans), sans-serif" },
        body: { value: "var(--font-IBMPlexSans), sans-serif" },
        mono: { value: "var(--font-IBMPlexMono), monospace" },
      },
      colors: {
        primary: {
          25: { value: "#F7F9FF" },
          50: { value: "#E0E8FF" },
          100: { value: "#D7DFF2" },
          200: { value: "#AFBFE6" },
          300: { value: "#7898D7" },
          400: { value: "#3361C0" },
          500: { value: "#0041B1" },
          600: { value: "#0A3785" },
          700: { value: "#002C6C" },
          800: { value: "#022456" },
          900: { value: "#0E1E3C" },
          950: { value: "#000828" },
        },
        neutral: {
          50: { value: "#FFFFFF" },
          100: { value: "#FFFFFF" },
          200: { value: "#F4F5F7" },
          300: { value: "#E1E2E6" },
          400: { value: "#B2B7BD" },
          500: { value: "#656E7B" },
          600: { value: "#394048" },
          700: { value: "#282D33" },
          800: { value: "#212629" },
          900: { value: "#13171A" },
          950: { value: "#02070B" },
        },
        secondary: {
          50: { value: "#fcfee7" },
          100: { value: "#F8F8D6" },
          200: { value: "#F0F4B4" },
          300: { value: "#E2ED7D" },
          400: { value: "#CAD470" },
          500: { value: "#9CA25A" },
          600: { value: "#7B8044" },
          700: { value: "#5B5F3A" },
          800: { value: "#42442C" },
          900: { value: "#323625" },
          950: { value: "#242e05" },
        },
        mint: {
          500: { value: "#00DCA7" },
          600: { value: "#00b086" },
        },
      },
    },
    semanticTokens: {
      colors: {
        bg: {
          DEFAULT: { value: "{colors.white}" },
          subtle: { value: "{colors.neutral.200}" },
          muted: { value: "{colors.neutral.300}" },
          panel: { value: "{colors.white}" },
        },
        fg: {
          DEFAULT: { value: "{colors.neutral.800}" },
          muted: { value: "{colors.neutral.600}" },
          subtle: { value: "{colors.neutral.500}" },
          link: { value: "#0049aa" },
        },
        border: {
          DEFAULT: { value: "{colors.neutral.300}" },
          emphasized: { value: "{colors.neutral.400}" },
        },
        primary: {
          solid: { value: "{colors.primary.500}" },
          fg: { value: "{colors.primary.700}" },
          contrast: { value: "{colors.primary.50}" },
          muted: { value: "{colors.primary.100}" },
          subtle: { value: "{colors.primary.25}" },
        },
      },
    },
  },
  globalCss: {
    html: {
      colorPalette: "primary",
    },
    body: {
      bg: "bg.subtle",
      color: "fg",
    },
  },
});

export const system = createSystem(defaultConfig, config);
