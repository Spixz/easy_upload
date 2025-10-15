import { test, expect } from 'vitest'
import puppeteer from 'puppeteer-core'
import fs from 'fs'


// ! Launch chrome with remote debugging before launching tests
// /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \ --remote-debugging-port=9222 --user-data-dir="chrome_profile_tests"

test('canva.com - short prompt', async () => {
  const browser = await puppeteer.connect({
    browserURL: 'http://127.0.0.1:9222',
  })
  const page = await browser.newPage()
  await page.goto('https://example.com')

  const prompt = fs.readFileSync('tests/extract_requirements_prompts/prompts/short_prompt.txt', 'utf8');
  const pageContent = fs.readFileSync('tests/extract_requirements_prompts/sources/canva.com.txt', 'utf8');
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

  expect(resObj["accepted_source"]).toMatch(/^image\/\*$|not found/i)

  expect(resObj["file_size_limit"]).toMatch(/not found/)

  expect(resObj["height_width"]).toMatch(/not found/)
  expect(resObj["height_width"]).toMatch(/not found/)

  expect(resObj["aspect_ratio"]).toMatch(/not found/)
  page.close()
})

test('canva.com - medium prompt', async () => {
  const browser = await puppeteer.connect({
    browserURL: 'http://127.0.0.1:9222',
  })
  const page = await browser.newPage()
  await page.goto('https://example.com')

  const prompt = fs.readFileSync('tests/extract_requirements_prompts/prompts/medium_prompt.txt', 'utf8');
  const pageContent = fs.readFileSync('tests/extract_requirements_prompts/sources/canva.com.txt', 'utf8');
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

  expect(resObj["accepted_source"]).toMatch(/^image\/\*$|not found/i)

  expect(resObj["file_size_limit"]).toMatch(/not found/)

  expect(resObj["height_width"]).toMatch(/not found/)
  expect(resObj["height_width"]).toMatch(/not found/)

  expect(resObj["aspect_ratio"]).toMatch(/not found/)
  page.close()
})



test('canva.com - large prompt', async () => {
  const browser = await puppeteer.connect({
    browserURL: 'http://127.0.0.1:9222',
  })
  const page = await browser.newPage()
  await page.goto('https://example.com')

  const prompt = fs.readFileSync('tests/extract_requirements_prompts/prompts/large_prompt.txt', 'utf8');
  const pageContent = fs.readFileSync('tests/extract_requirements_prompts/sources/canva.com.txt', 'utf8');
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

  expect(resObj["accepted_source"]).toMatch(/^image\/\*$|not found/i)

  expect(resObj["file_size_limit"]).toMatch(/not found/)

  expect(resObj["height_width"]).toMatch(/not found/)
  expect(resObj["height_width"]).toMatch(/not found/)

  expect(resObj["aspect_ratio"]).toMatch(/not found/)
  page.close()
})


test('canva.com - large prompt v2', async () => {
  const browser = await puppeteer.connect({
    browserURL: 'http://127.0.0.1:9222',
  })
  const page = await browser.newPage()
  await page.goto('https://example.com')

  const prompt = fs.readFileSync('tests/extract_requirements_prompts/prompts/large_prompt_v2.txt', 'utf8');
  const pageContent = fs.readFileSync('tests/extract_requirements_prompts/sources/canva.com.txt', 'utf8');
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

  expect(resObj["accepted_source"]).toMatch(/^image\/\*$|not found/i)

  expect(resObj["file_size_limit"]).toMatch(/not found/)

  expect(resObj["height_width"]).toMatch(/not found/)
  expect(resObj["height_width"]).toMatch(/not found/)

  expect(resObj["aspect_ratio"]).toMatch(/not found/)
  page.close()
})
