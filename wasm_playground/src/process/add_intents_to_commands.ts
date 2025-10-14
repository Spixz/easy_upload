import fs from "fs/promises"
import OpenAI from "openai"

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // ⚠️ exporte ta clé avant: export OPENAI_API_KEY="ta_cle"
})

const INPUT_FILE = "../../public/imagemagick_commands_doc_fr.json"
const OUTPUT_FILE = "../../public/imagemagick_commands_doc_fr_intents.json"
const BATCH_SIZE = 10

// 🧠 Prompt constant utilisé pour chaque lot
const BASE_PROMPT = `
Ton rôle est d’ajouter une propriété "intent" à chaque commande ImageMagick d’un fichier JSON.

L’objectif est de créer une phrase naturelle, en français, qui décrit ce que l’utilisateur final voudrait faire avec cette commande (comme s’il disait "Je veux...").
Cette phrase doit refléter la manière dont un utilisateur non technique exprimerait son besoin.

Règles :
- Écris toujours la valeur de "intent" sous la forme : "Je veux ..." suivie de l’action.
- Utilise un langage naturel, simple, et compréhensible.
- Ajoute des synonymes ou formulations alternatives avec des "/" quand c’est utile.
- Si la commande est très technique, reformule-la en expliquant l’effet visible ou l’usage concret.
- N’invente pas de comportements inexistants. Base-toi uniquement sur la description fournie.

Réponds uniquement en JSON valide correspondant à la liste d’entrée, chaque objet ayant maintenant la propriété "intent".
`

async function main() {
    // 1️⃣ Lire le fichier source
    const file = await fs.readFile(INPUT_FILE, "utf8")
    const data = JSON.parse(file)

    const results = []
    let index = 0

    // 2️⃣ Parcourir les données par batch de 10
    while (index < data.length) {
        const batch = data.slice(index, index + BATCH_SIZE)
        console.log(`🧩 Traitement du lot ${index / BATCH_SIZE + 1} (${batch.length} éléments)`)

        // 3️⃣ Créer le message pour le modèle
        const prompt = `${BASE_PROMPT}\n\nVoici le JSON à enrichir :\n${JSON.stringify(batch, null, 2)}`
        console.log(prompt);

        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-5-mini", // ⚙️ modèle rapide et économique
                messages: [
                    { role: "system", content: "Tu es un assistant spécialisé en documentation utilisateur." },
                    { role: "user", content: prompt },
                ],
                // response_format: { type: "json_object" },
            })

            const content = completion.choices[0].message?.content
            if (!content) throw new Error("Réponse vide du modèle")
            console.log("Model response");
            console.log(completion);

            const json = JSON.parse(content)
            if (Array.isArray(json)) {
                results.push(...json)
            } else {
                console.warn("⚠️ Réponse inattendue, format non tableau :", content)
            }

            // Sauvegarde incrémentale
            await fs.writeFile(OUTPUT_FILE, JSON.stringify(results, null, 2), "utf8")

            console.log(`✅ Lot ${index / BATCH_SIZE + 1} terminé`)
        } catch (err) {
            console.error(`❌ Erreur sur le lot ${index / BATCH_SIZE + 1}:`)
            console.log(err);
        }

        index += BATCH_SIZE
        await new Promise((r) => setTimeout(r, 1000)) // petit délai entre les lots
    }

    console.log(`🎉 Terminé ! ${results.length} commandes traitées.`)
}

main().catch((err) => console.error("Erreur principale :", err))