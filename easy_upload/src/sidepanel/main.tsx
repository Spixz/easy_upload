import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./sidepanel_listener.ts";
import { clearOPFS } from "@/commons/helpers/helpers.ts";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

window.addEventListener("unload", async () => {
  await clearOPFS();
});
