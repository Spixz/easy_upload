import { pipeline, env } from "@xenova/transformers";

env.localModelPath = "/";
env.allowRemoteModels = false;
env.backends.onnx.wasm.numThreads = 4; // CPU multithread
env.backends.onnx.webgpu = true;      // Force WebGPU si dispo

let embedder: any = null;

export async function getEmbedder() {
  if (!embedder) {
    embedder = await pipeline(
      "feature-extraction",
      "models/paraphrase-multilingual-MiniLM-L12-v2" // chemin local
    );
  }
  return embedder;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
    const emb = await (await getEmbedder())(texts, { pooling: "mean", normalize: true });
    return emb.tolist();
}

export function cosineSimilarity(a: number[], b: number[]): number {
    const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
    const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
    return dot / (normA * normB);
}