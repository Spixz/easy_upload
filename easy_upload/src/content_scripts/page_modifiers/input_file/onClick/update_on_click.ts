import { $enum } from "ts-enum-util";
// import { lookup } from "mime-types";
import extractPotentialRequirementsFromPage from "./extract_file_requirements";
import { FileCategory } from "@/commons/enums";
import mime from 'mime';

export default function inputOnClickListener(input: HTMLInputElement) {
    if (input.dataset.onClickListenerAttached != null) return;

    input.addEventListener('click', () => handleClick(input), true);
    input.dataset.onClickListenerAttached = '';
    console.log(`On click custom attaché sur `, input);
}

function handleClick(input: HTMLInputElement): void {
    console.log("L'user à cliqué sur l'input");
    const potentialRequirements: string[] = extractPotentialRequirementsFromPage({ visibleOnly: false });
    console.log(potentialRequirements);
    const allowedCategories: FileCategory[] = input.accept.split(",")
        .map(inferCategoryFromMimeString)
        .filter((value) => value != null);
    const mainAllowedCategory: FileCategory = findMajoritaryFileCategory(allowedCategories);

    // promptInstruction = promptForCategory[acceptedFileCategory];
    // prompt = `${potentialsRequirements}`\n\n ${promptInstruction};
}

export function inferCategoryFromMimeString(accept_elem: string): FileCategory | null {
    const overittedCategory = OverritedCategory.getCategory(accept_elem);
    if (overittedCategory != null) return overittedCategory;

    const basicAccept = basicAcceptToCategory(accept_elem);
    if (basicAccept != null) return basicAccept;

    const extension: string = accept_elem.trim().replace(".", "");
    const calc: any = mime.getType(extension);
    return (typeof calc === 'string') ? basicAcceptToCategory(calc) : null;
}

function basicAcceptToCategory(accept_elem: string): FileCategory | null {
    const category: string | undefined = ["application", "image", "video", "audio"]
        .find(elem => accept_elem.includes(elem));

    if (accept_elem == "*") return FileCategory.all;
    if (category != undefined) {
        return $enum(FileCategory).getValueOrDefault(category, FileCategory.application);
    }
    return null;
}

export function findMajoritaryFileCategory(categories: FileCategory[]): FileCategory {
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

    const sorted = Object.entries(scores)
        .sort(([, a], [, b]) => b - a);

    if (sorted[0][1] == sorted[1][1]) return FileCategory.all;

    return $enum(FileCategory).getValueOrDefault(sorted[0][0], FileCategory.application)
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
        return (res != undefined) ? res.category : null;
    }

    static initList() {
        OverritedCategory.addFormat([".mp4", "application/mp4"], FileCategory.video);
        OverritedCategory.addFormat([".ogx"], FileCategory.video);
        OverritedCategory.addFormat([".mkv", "application/x-matroska"], FileCategory.video);
        OverritedCategory.addFormat([".webm", "application/webm"], FileCategory.video);
    }
}