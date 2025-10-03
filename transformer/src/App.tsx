// src/App.tsx
import React, { useState } from "react";
import { embedTexts, cosineSimilarity } from "./embeddingService";

function App() {
  const [input, setInput] = useState("");
  const [requirementsText, setRequirementsText] = useState(
    "L'image doit faire au moins 500 x 500 pixels\nLe fichier doit être au format PDF\nLa taille doit être inférieure à 2 Mo"
  );
  const [requirements, setRequirements] = useState<string[]>(requirementsText.split("\n"));
  const [results, setResults] = useState<string[]>([]);

  const handleUpdateRequirements = () => {
    const reqs = requirementsText.split("\n").map(r => r.trim()).filter(Boolean);
    setRequirements(reqs);
  };

  const handleCheck = async () => {
    const lines = input.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    const [reqEmbeddings, lineEmbeddings] = await Promise.all([
      embedTexts(requirements),
      embedTexts(lines)
    ]);

    const matches: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      let bestScore = 0;
      for (let j = 0; j < requirements.length; j++) {
        const sim = cosineSimilarity(lineEmbeddings[i], reqEmbeddings[j]);
        if (sim > bestScore) bestScore = sim;
      }
      if (bestScore > 0.7) {
        matches.push(lines[i]);
      }
    }
    setResults(matches);
    console.log("rechecherche terminées");
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Requirement Checker</h1>

      <h2>⚙️ Requirements actifs</h2>
      <textarea
        rows={5}
        cols={60}
        value={requirementsText}
        onChange={e => setRequirementsText(e.target.value)}
      />
      <br />
      <button onClick={handleUpdateRequirements}>Mettre à jour les requirements</button>

      <h2>📝 Texte à vérifier</h2>
      <textarea
        rows={10}
        cols={60}
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder="Colle ton texte ici (1 phrase par ligne)..."
      />
      <br />
      <button onClick={handleCheck}>Vérifier</button>

      <h2>✅ Résultats</h2>
      <ul>
        {results.map((line, i) => (
          <li key={i} style={{ color: "green" }}>{line}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;