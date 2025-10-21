import fs from "fs/promises"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // ⚠️ export OPENAI_API_KEY="ta_cle"
})

const INPUT_FILE = "public/imagemagick_commands_doc_fr_intents.json"
const OUTPUT_FILE = "public/imagemagick_commands_doc_en.json"
const BATCH_SIZE = 10

// 🧠 Prompt constant utilisé pour chaque lot
const BASE_PROMPT = `
You are an assistant specialized in technical translation for developers.

Your task is to translate the following JSON list of ImageMagick command descriptions from **French to English**.
Translate only the fields:
- "title"
- "description"
- "intent"

Also, add a new property "input_type" which is an empty object: {}

Rules:
- Keep the JSON structure identical (same keys, same order if possible).
- Keep the "command", "example" fields unchanged.
- Output valid JSON (a list of objects).
- Translate naturally, using concise and professional technical English.
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
    console.log(`🧩 Processing batch ${index / BATCH_SIZE + 1} (${batch.length} items)`)

    const prompt = `${BASE_PROMPT}\n\nJSON to translate:\n${JSON.stringify(batch, null, 2)}`
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-5-mini",
        messages: [
          { role: "system", content: "You are a precise and reliable translator specialized in developer documentation." },
          { role: "user", content: prompt },
        ],
      })

      const content = completion.choices[0].message?.content
      if (!content) throw new Error("Empty model response")

      let json
      try {
        json = JSON.parse(content)
      } catch (e) {
        console.error("⚠️ JSON parse error, raw output:\n", content)
        continue
      }

      if (Array.isArray(json)) {
        results.push(...json)
      } else {
        console.warn("⚠️ Unexpected non-array response:", content)
      }

      // Sauvegarde incrémentale
      await fs.writeFile(OUTPUT_FILE, JSON.stringify(results, null, 2), "utf8")

      console.log(`✅ Batch ${index / BATCH_SIZE + 1} done`)
    } catch (err) {
      console.error(`❌ Error in batch ${index / BATCH_SIZE + 1}:`, err)
    }

    index += BATCH_SIZE
    await new Promise((r) => setTimeout(r, 1000))
  }

  console.log(`🎉 Done! ${results.length} commands processed.`)
}

main().catch((err) => console.error("Main error:", err))