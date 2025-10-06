import { beforeAll, afterAll, test, expect } from 'vitest'
import puppeteer from 'puppeteer-core'
import { spawn } from 'node:child_process'
import fs from 'fs'

let chromeProc: ReturnType<typeof spawn> | null = null
let browser: Awaited<ReturnType<typeof puppeteer.connect>>

beforeAll(async () => {
  // Lance Chrome une seule fois
  // chromeProc = spawn(
  //   '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  //   [
  //     '--remote-debugging-port=9222',
  //     '--user-data-dir=./chrome_profile_tests',
  //     '--no-first-run',
  //     '--no-default-browser-check',
  //   ],
  //   { stdio: 'inherit' }
  // )

  // // attendre que Chrome ait démarré
  await new Promise((r) => setTimeout(r, 4000))

  // se connecter à Chrome
  browser = await puppeteer.connect({
    browserURL: 'http://127.0.0.1:9222',
  })
}, 60_000)

// afterAll(async () => {
//   if (browser) {
//     await browser.disconnect()
//   }
//   if (chromeProc) {
//     chromeProc.kill()
//   }
// })



// test('LanguageModel API disponible', async () => {
//   const page = await browser.newPage()
//   await page.goto('https://example.com')

//   const avail = await page.evaluate(() => LanguageModel.availability())
//   console.log('Availability:', avail)
//   page.close()

//   expect(['available', 'downloadable', 'downloading', 'unavailable']).toContain(avail)
// })


// ! Launch chrome with remote debugging before launching tests
// "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
//   --remote-debugging-port=9222 \        
//   --user-data-dir="chrome_profile_tests"


test('test very_short_prompt youtube thumbnail', async () => {
  const browser = await puppeteer.connect({
    browserURL: 'http://127.0.0.1:9222',
  })
  const page = await browser.newPage()
  await page.goto('https://example.com')

  const prompt = fs.readFileSync('tests/extract_requirements_prompts/prompts/very_short_prompt.txt', 'utf8');
  const pageContent = fs.readFileSync('tests/extract_requirements_prompts/sources/youtube_studio.txt', 'utf8');
  const outputSchema = JSON.parse(fs.readFileSync('tests/extract_requirements_prompts/prompts/output_schema_images.txt', 'utf8'));

  const { res, duration } = await page.evaluate(
    async (prompt, pageContent, outputSchema) => {
      const session = await LanguageModel.create({
        expectedOutputs: [{ type: 'text', languages: ['en'] }],
        initialPrompts: [{ role: 'user', content: prompt }],
      })

      const start = Date.now()
      const res = await session.prompt(pageContent, { responseConstraint: outputSchema })
      const end = Date.now()

      session.destroy()
      return { res, duration: (end - start) / 1000 }
    },
    prompt,
    pageContent,
    outputSchema
  )

  console.log(`⏱️ session.prompt exécuté en ${duration}s`)
  console.log('Résultats:', res)
  const resObj = JSON.parse(res);

  expect(resObj["accepted_source"]).toMatch(/jpeg/i)
  expect(resObj["accepted_source"]).toMatch(/png/i)
  expect(resObj["accepted_source"]).toMatch(/gif/i)

  expect(resObj["file_size_limit"]).toMatch(/2\s*mo/i)

  expect(resObj["height_width"]).toMatch(/1280/)
  expect(resObj["height_width"]).toMatch(/720/)

  expect(resObj["aspect_ratio"]).toMatch(/16:9/)
  page.close()
} )

test('test big_prompt_shorter youtube thumbnail', async () => {
  const browser = await puppeteer.connect({
    browserURL: 'http://127.0.0.1:9222',
  })
  const page = await browser.newPage()
  await page.goto('https://example.com')

  const prompt = fs.readFileSync('tests/extract_requirements_prompts/prompts/big_prompt_1_shorted_1.txt', 'utf8');
  const pageContent = fs.readFileSync('tests/extract_requirements_prompts/sources/youtube_studio.txt', 'utf8');
  const outputSchema = JSON.parse(fs.readFileSync('tests/extract_requirements_prompts/prompts/output_schema_images.txt', 'utf8'));

  const { res, duration } = await page.evaluate(
    async (prompt, pageContent, outputSchema) => {
      const session = await LanguageModel.create({
        expectedOutputs: [{ type: 'text', languages: ['en'] }],
        initialPrompts: [{ role: 'user', content: prompt }],
      })

      const start = Date.now()
      const res = await session.prompt(pageContent, { responseConstraint: outputSchema })
      const end = Date.now()

      session.destroy()
      return { res, duration: (end - start) / 1000 }
    },
    prompt,
    pageContent,
    outputSchema
  )

  console.log(`⏱️ session.prompt exécuté en ${duration}s`)
  console.log('Résultats:', res)
  const resObj = JSON.parse(res);

  expect(resObj["accepted_source"]).toMatch(/jpeg/i)
  expect(resObj["accepted_source"]).toMatch(/png/i)
  expect(resObj["accepted_source"]).toMatch(/gif/i)

  expect(resObj["file_size_limit"]).toMatch(/2\s*mo/i)

  expect(resObj["height_width"]).toMatch(/1280/)
  expect(resObj["height_width"]).toMatch(/720/)

  expect(resObj["aspect_ratio"]).toMatch(/16:9/)
  page.close()
} )



test('test big_prompt_1 youtube thumbnail', async () => {
  const browser = await puppeteer.connect({
    browserURL: 'http://127.0.0.1:9222',
  })
  const page = await browser.newPage()
  await page.goto('https://example.com')

  const prompt = fs.readFileSync('tests/extract_requirements_prompts/prompts/big_prompt_1.txt', 'utf8');
  const pageContent = fs.readFileSync('tests/extract_requirements_prompts/sources/youtube_studio.txt', 'utf8');
  const outputSchema = JSON.parse(fs.readFileSync('tests/extract_requirements_prompts/prompts/output_schema_images.txt', 'utf8'));

  const { res, duration } = await page.evaluate(
    async (prompt, pageContent, outputSchema) => {
      const session = await LanguageModel.create({
        expectedOutputs: [{ type: 'text', languages: ['en'] }],
        initialPrompts: [{ role: 'user', content: prompt }],
      })

      const start = Date.now()
      const res = await session.prompt(pageContent, { responseConstraint: outputSchema })
      const end = Date.now()

      session.destroy()
      return { res, duration: (end - start) / 1000 }
    },
    prompt,
    pageContent,
    outputSchema
  )

  console.log(`⏱️ session.prompt exécuté en ${duration}s`)
  console.log('Résultats:', res)
  const resObj = JSON.parse(res);

  expect(resObj["accepted_source"]).toMatch(/jpeg/i)
  expect(resObj["accepted_source"]).toMatch(/png/i)
  expect(resObj["accepted_source"]).toMatch(/gif/i)

  expect(resObj["file_size_limit"]).toMatch(/2\s*mo/i)

  expect(resObj["height_width"]).toMatch(/1280/)
  expect(resObj["height_width"]).toMatch(/720/)

  expect(resObj["aspect_ratio"]).toMatch(/16:9/)
  page.close()
} )