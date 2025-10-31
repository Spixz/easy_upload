import { $enum } from "ts-enum-util";
import extractPotentialRequirementsFromPage from "./extract_file_requirements";
import { FileCategory } from "@/commons/enums";
import mime from "mime";
import { InputRequirements } from "@/commons/interfaces";
import { ChromeBridgeMessage } from "@/commons/communications_interfaces";
import { serviceWorkerPort } from "@/content_scripts/bridge/contentscript_sidepanel_bridges";

export async function onInputFileClick(input: HTMLInputElement) {
  console.log("L'user à cliqué sur l'input");

  serviceWorkerPort.postMessage({
    name: "open_sidepanel",
  } as ChromeBridgeMessage);

  // sendRawRequirements(input);
}

async function sendRawRequirements(input: HTMLInputElement) {
  const potentialRequirements: string[] = extractPotentialRequirementsFromPage({
    visibleOnly: false,
  });
  const allowedCategories: FileCategory[] = input.dataset
    .originalAccept!.split(",")
    .map(inferCategoryFromMimeString)
    .filter((value) => value != null);
  const mainAllowedCategory: FileCategory =
    findMajoritaryFileCategory(allowedCategories);

  console.log(potentialRequirements);
  serviceWorkerPort.postMessage({
    name: "input_unprocess_requirements",
    data: {
      raw_requirements: {
        text_for_requirements: potentialRequirements,
        file_category: mainAllowedCategory,
      } as InputRequirements,
    },
  });
}

export function inferCategoryFromMimeString(
  accept_elem: string,
): FileCategory | null {
  const overittedCategory = OverritedCategory.getCategory(accept_elem);
  if (overittedCategory != null) return overittedCategory;

  const basicAccept = basicAcceptToCategory(accept_elem);
  if (basicAccept != null) return basicAccept;

  const extension: string = accept_elem.trim().replace(".", "");
  const calc: any = mime.getType(extension);
  return typeof calc === "string" ? basicAcceptToCategory(calc) : null;
}

function basicAcceptToCategory(accept_elem: string): FileCategory | null {
  const category: string | undefined = [
    "application",
    "image",
    "video",
    "audio",
  ].find((elem) => accept_elem.includes(elem));

  if (accept_elem == "*") return FileCategory.all;
  if (category != undefined) {
    return $enum(FileCategory).getValueOrDefault(
      category,
      FileCategory.application,
    );
  }
  return null;
}

export function findMajoritaryFileCategory(
  categories: FileCategory[],
): FileCategory {
  const scores: Record<FileCategory, number> = {
    [FileCategory.application]: 0,
    [FileCategory.image]: 0,
    [FileCategory.video]: 0,
    [FileCategory.audio]: 0,
    [FileCategory.all]: 0,
  };

  if (categories.length == 0) return FileCategory.all;

  for (let cate of categories) {
    if (cate == FileCategory.application) scores[FileCategory.application]++;
    else if (cate == FileCategory.audio) scores[FileCategory.audio]++;
    else if (cate == FileCategory.image) scores[FileCategory.image]++;
    else if (cate == FileCategory.video) scores[FileCategory.video]++;
    else scores[FileCategory.all]++;
  }

  if (scores[FileCategory.all] != 0) return FileCategory.all;

  const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);

  if (sorted[0][1] == sorted[1][1]) return FileCategory.all;

  return $enum(FileCategory).getValueOrDefault(
    sorted[0][0],
    FileCategory.application,
  );
}

class OverritedCategory {
  accept: string[];
  category: FileCategory;
  static formats: OverritedCategory[] = [];

  private constructor(accept: string[], category: FileCategory) {
    this.accept = accept;
    this.category = category;
  }

  static addFormat(accept: string[], category: FileCategory) {
    this.formats.push(new OverritedCategory(accept, category));
  }

  static getCategory(acceptValue: string): FileCategory | null {
    if (this.formats.length == 0) {
      this.initList();
    }
    var res = this.formats.find((local) => local.accept.includes(acceptValue));
    return res != undefined ? res.category : null;
  }

  static initList() {
    OverritedCategory.addFormat(
      [".mp4", "application/mp4"],
      FileCategory.video,
    );
    OverritedCategory.addFormat([".ogx"], FileCategory.video);
    OverritedCategory.addFormat(
      [".mkv", "application/x-matroska"],
      FileCategory.video,
    );
    OverritedCategory.addFormat(
      [".webm", "application/webm"],
      FileCategory.video,
    );
  }
}
