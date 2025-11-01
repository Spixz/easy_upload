interface CustomMatchers {
  numbers: RegExp,
  extensions: RegExp,
  units: RegExp,
}

function buildMatchers({ extensions, units }: { extensions: string[], units: string[] }): CustomMatchers {
  return {
    numbers: new RegExp('\\d'),
    extensions: new RegExp(extensions.map(ext => `\\b${ext}\\b`).join('|'), "i"),
    units: new RegExp(units.map(unit => `\\b${unit}\\b`).join('|'), "i"),
  };
}

function matcheCriteres(line: string, matchers: CustomMatchers) {
  if (matchers.numbers.test(line)) return true;
  if (matchers.extensions.test(line)) return true;
  if (matchers.units.test(line)) return true;
  return false;
}

function containeUrl(line: string) {
  return /(https?:\/\/|www\.)\S+/i.test(line);
}

function extractPageVisibleText(): string[] {
  const raw = document.body.innerText || "";
  return raw.split(/\n+/).map(s => s.trim()).filter(Boolean);
}

/// Extract visible text + hidden text without code
function extractPageFullText(): string[] {
  const selectedTexts: string[] = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node: Node) {
      const parent = node.parentElement;
      if (parent) {
        const tag = parent!.nodeName.toLowerCase();
        if (["script", "style", "noscript", "template"].includes(tag)) {
          return NodeFilter.FILTER_REJECT;
        }
      };
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  let node: Node | null = null;
  while (node = walker.nextNode()) {
    if (node == null) continue;
    const t: string = ((node as Node).textContent ?? "").trim();
    if (t) selectedTexts.push(t);
  }
  return selectedTexts;
}

export default function extractPotentialRequirementsFromPage({
  maxLength = 100,  // valeur par défaut modifiée
  visibleOnly = true,
  dedupe = true,
  debug = true,
  extensions = [
    "jpg", "jpeg", "png", "gif", "bmp", "svg", "webp", "heic", "heif",
    "mp4", "mov", "avi", "mkv", "webm", "m4v",
    "mp3", "wav", "flac", "aac", "ogg", "m4a",
    "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv",
    "zip", "rar", "7z", "tar", "gz"
  ],
  units = [
    "px", "pixels", "dpi",
    "kb", "ko", "mb", "mo", "gb", "go", "tb",
    "%", "ratio"
  ]
}): string[] {

  const pageText: string[] = visibleOnly ? extractPageVisibleText() : extractPageFullText();
  const truncatedPageText: string[] = pageText.map(s => s.slice(0, maxLength));
  let filteredLines: string[] = truncatedPageText.filter(line => !containeUrl(line));
  filteredLines = filteredLines.map((line) => line.toLocaleLowerCase());

  const matchers = buildMatchers({ extensions: extensions, units: units });
  let candidates = filteredLines.filter(line => {
    if (line.length <= 2) return false;
    return matcheCriteres(line, matchers);
  });
  // console.log(candidates);

  // if (dedupe) {
  //   const seen = new Set();
  //   candidates = candidates.filter(s => {
  //     const key = s.toLowerCase();
  //     if (seen.has(key)) return false;
  //     seen.add(key);
  //     return true;
  //   });
  // }

  if (debug) {
    console.log("===== Résultats filtrés =====");
    console.log(candidates.join("\n"));
    console.log("===== Résumé =====");
    console.log("Nombre de lignes :", candidates.length);
    console.log("Total caractères :", candidates.join("\n").length);
  }

  return candidates;
}