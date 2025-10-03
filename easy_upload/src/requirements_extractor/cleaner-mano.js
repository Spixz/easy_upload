// -------------------- Helpers: critères --------------------
/** Construit les regex utiles à partir des listes. */
function buildMatchers(_a) {
    var extensions = _a.extensions, units = _a.units;
    // const reSymbols = enableSymbols ? /[%x×]/i : null;
    return {
        numbers: new RegExp("/d/"),
        extensions: new RegExp("\\.(".concat(extensions.join("|"), ")\\b"), "i"),
        units: new RegExp("\\b(".concat(units.join("|"), ")\\b"), "i"),
    };
}
/** Renvoie true si la ligne satisfait au moins 1 critère activé */
function matcheCriteres(line, matchers) {
    if (matchers.numbers.test(line))
        return true;
    if (matchers.extensions.test(line))
        return true;
    if (matchers.units.test(line))
        return true;
    // if (reSymbols && reSymbols.test(line)) return true;
    return false;
}
function containeUrl(line) {
    return /(https?:\/\/|www\.)\S+/i.test(line);
}
// -------------------- Extraction --------------------
function extractPageVisibleText() {
    var raw = document.body.innerText || "";
    return raw.split(/\n+/).map(function (s) { return s.trim(); }).filter(Boolean);
}
/// Extract visible text + hidden text without code
function extractPageFullText() {
    var _a;
    var selectedTexts = [];
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode: function (node) {
            var parent = node.parentNode;
            if (!parent)
                return NodeFilter.FILTER_REJECT;
            var tag = parent.nodeName.toLowerCase();
            if (["script", "style", "noscript", "template"].includes(tag)) {
                return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
        }
    });
    var node = null;
    while (node = walker.nextNode()) {
        if (node == null)
            continue;
        var t = ((_a = node.nodeValue) !== null && _a !== void 0 ? _a : "").trim();
        if (t)
            selectedTexts.push(t);
    }
    return selectedTexts;
}
// -------------------- Pipeline principal --------------------
/**
 * Extrait le texte de la page, tronque à maxLength, supprime les URL,
 * et renvoie UNIQUEMENT les lignes pertinentes :
 * (chiffre OR extension OR unité [OR symboles si activés]).
 */
function extractRequirementsText(_a) {
    var _b = _a === void 0 ? {} : _a, _c = _b.maxLength, maxLength = _c === void 0 ? 100 : _c, // valeur par défaut modifiée
    _d = _b.visibleOnly, // valeur par défaut modifiée
    visibleOnly = _d === void 0 ? true : _d, _e = _b.enableSymbols, enableSymbols = _e === void 0 ? false : _e, _f = _b.dedupe, dedupe = _f === void 0 ? true : _f, _g = _b.debug, debug = _g === void 0 ? true : _g, _h = _b.extensions, extensions = _h === void 0 ? [
        "jpg", "jpeg", "png", "gif", "bmp", "svg", "webp", "heic", "heif",
        "mp4", "mov", "avi", "mkv", "webm", "m4v",
        "mp3", "wav", "flac", "aac", "ogg", "m4a",
        "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv",
        "zip", "rar", "7z", "tar", "gz"
    ] : _h, _j = _b.units, units = _j === void 0 ? [
        "px", "pixels", "dpi",
        "kb", "ko", "mb", "mo", "gb", "go", "tb",
        "%", "ratio"
    ] : _j;
    var pageText = visibleOnly ? extractPageVisibleText() : extractPageFullText();
    var truncatedPageText = pageText.map(function (s) { return s.slice(0, maxLength); });
    var filteredLines = truncatedPageText.filter(function (line) { return !containeUrl(line); });
    var matchers = buildMatchers({ extensions: extensions, units: units });
    var candidates = filteredLines.filter(function (line) {
        if (line.length <= 2)
            return false;
        return matcheCriteres(line, matchers);
    });
    // 5) Dé-duplication (optionnelle)
    if (dedupe) {
        var seen_1 = new Set();
        candidates = candidates.filter(function (s) {
            var key = s.toLowerCase();
            if (seen_1.has(key))
                return false;
            seen_1.add(key);
            return true;
        });
    }
    // 6) Debug
    if (debug) {
        console.log("===== Résultats filtrés =====");
        console.log(candidates.join("\n"));
        console.log("===== Résumé =====");
        console.log("Nombre de lignes :", candidates.length);
        console.log("Total caractères :", candidates.join("\n").length);
    }
    return candidates;
}
// -------------------- Exemple --------------------
// const out = extractRequirementsText({ visibleOnly: false });
