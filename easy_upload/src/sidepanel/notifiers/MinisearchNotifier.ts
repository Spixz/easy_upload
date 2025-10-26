import MiniSearch, { type SearchResult } from "minisearch";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface BasicCliCommand {
  title: string;
  command: string;
  description: string;
  example: string;
  intent: string;
  inputType: Record<string, string>;
}

export interface MagickCommand extends BasicCliCommand {}
export interface FfmpegCommand extends BasicCliCommand {}

export interface MinisearchState {
  initialized: boolean;
  minisearchImagemagick?: MiniSearch<MagickCommand>;
  minisearchFfmpeg?: MiniSearch<FfmpegCommand>;
  ensureInit: () => Promise<MinisearchState>;
}

export const MinisearchNotifier = create<MinisearchState>()(
  devtools((set, get) => ({
    initialized: false,
    async ensureInit(): Promise<MinisearchState> {
      if (get().initialized) return get();

      const minisearchImagemagick = await initImagemagickDb();
      const minisearchFfmpeg = await initFfmpegDb();
      set({ minisearchImagemagick, minisearchFfmpeg, initialized: true });
      return get();
    },
  })),
);

async function initImagemagickDb(): Promise<MiniSearch<MagickCommand>> {
  const commandsPath = chrome.runtime.getURL(
    "minisearch_db/imagemagick_commands.json",
  );
  const response = await fetch(commandsPath);
  if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
  const data: MagickCommand[] = await response.json();

  const ms = new MiniSearch<MagickCommand>({
    fields: ["title", "intent"],
    storeFields: [
      "title",
      "command",
      "description",
      "example",
      "intent",
      "input_type",
    ],
    idField: "command",
  });
  ms.addAll(data);
  return ms;
}

async function initFfmpegDb(): Promise<MiniSearch<FfmpegCommand>> {
  const commandsPath = chrome.runtime.getURL(
    "minisearch_db/ffmpeg_commands.json",
  );
  const response = await fetch(commandsPath);
  if (!response.ok) throw new Error(`Erreur HTTP ${response.status}`);
  const data: FfmpegCommand[] = await response.json();

  const ms = new MiniSearch<FfmpegCommand>({
    fields: ["title", "intent"],
    storeFields: [
      "title",
      "command",
      "description",
      "example",
      "intent",
      "input_type",
    ],
    idField: "command",
  });
  ms.addAll(data);
  return ms;
}

export function searchResultToCliCommand(
  searchResult: SearchResult,
): BasicCliCommand {
  const { id, terms, queryTerms, score, match, ...commandFields } =
    searchResult;
  return commandFields as BasicCliCommand;
}

export function searchResultsToCliCommands(
  searchResults: SearchResult[],
): BasicCliCommand[] {
  return searchResults.map(searchResultToCliCommand);
}
