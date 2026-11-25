// Theme of the global antd ConfigProvider (src/App.tsx). Issue #100: it reproduces exactly what the
// app rendered before (same two component overrides), now read from the tokens. The future design
// sets antd's global tokens (colorPrimary, borderRadius, fontFamily…) here.
import type { ThemeConfig } from "antd";
import { semantic } from "./tokens";

export const antdTheme: ThemeConfig = {
  components: {
    Modal: {
      colorBgMask: semantic.modalMask,
    },
    Input: {
      colorTextPlaceholder: semantic.inputPlaceholder,
      activeBorderColor: "none",
      hoverBorderColor: "none",
    },
  },
};
