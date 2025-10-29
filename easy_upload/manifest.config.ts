import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "./package.json";

export default defineManifest({
  manifest_version: 3,
  name: pkg.name,
  version: pkg.version,
  icons: {
    48: "public/logo.png",
  },
  permissions: ["sidePanel", "contentSettings", "offscreen", "storage"],
  content_scripts: [
    {
      js: [
        "src/content_scripts/page_modifiers/on_document_click.ts",
      ],
      matches: ["<all_urls>"],
    },
  ],
  side_panel: {
    default_path: "src/sidepanel/index.html",
  },
  background: {
    service_worker: "src/service_worker/service_worker.ts",
    type: "module",
  },
  web_accessible_resources: [
    {
      resources: [
        "wasm/*",
      ],
      matches: ["<all_urls>"],
    },
  ],
  // @ts-ignore
  cross_origin_embedder_policy: {
    value: "require-corp",
  },
  // @ts-ignore
  cross_origin_opener_policy: {
    value: "same-origin",
  },
  content_security_policy: {
    extension_pages:
      "script-src 'self' 'wasm-unsafe-eval'; worker-src 'self' 'wasm-unsafe-eval';",
    // ---------------------------------------------
    sandbox:
      "sandbox allow-scripts allow-forms allow-popups allow-modals; script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval'; child-src 'self';",
  },
});
