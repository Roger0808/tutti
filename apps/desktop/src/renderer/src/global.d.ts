import type { DesktopApi } from "@preload/types";

declare global {
  interface Window {
    nextop?: DesktopApi;
  }

  interface ImportMetaEnv {
    readonly VITE_NEXTOPD_ACCESS_TOKEN?: string;
    readonly VITE_NEXTOPD_BASE_URL?: string;
    readonly VITE_NEXTOP_WEB_DEV?: string;
    readonly VITE_NEXTOP_WEB_WORKSPACE_ID?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export {};
