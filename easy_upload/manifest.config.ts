import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

export default defineManifest({
  manifest_version: 3,
  name: pkg.name,
  version: pkg.version,
  icons: {
    48: 'public/logo.png',
  },
  action: {
    default_icon: {
      48: 'public/logo.png',
    },
    default_popup: 'src/popup/index.html',
  },
  permissions: [
    'sidePanel',
    'contentSettings',
  ],
  content_scripts: [{
    js: [
      'src/content_scripts/react_app/main.tsx',
      'src/content_scripts/page_modifiers/input_file/input_file_modifiers.ts',
    ],
    matches: ['<all_urls>'],
  }],
  side_panel: {
    default_path: 'src/sidepanel/index.html',
  },
  background: {
    service_worker: "src/service_worker.ts",
    type: "module"
  },
})
