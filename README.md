# 🧠 EasyUpload  
> **"Fini de galérer pour uploader un fichier sur un site."**  

![Demo GIF](./assets/demo.gif)  

---

## 🚀 What it does  
**EasyUpload** is a conversational Chrome extension that automatically prepares your files before uploading them.  
It can **convert, compress, and edit** your media directly in the browser — no external tools or websites required.  
Everything runs **locally**, powered by **Chrome’s built-in AI model**.  
No files are ever sent to external servers.  

---

## ✨ Features  
- 🤖 **An assistant that edits your files for you** using:
  - 🧩 [ImageMagick (+200 commands)](./src/tools/imagemagick_commands.ts)  
  - 🎬 [FFmpeg (8 commands)](./src/tools/ffmpeg_commands.ts)  
  - 🖼️ [Visual image editor (react-filerobot-image-editor)](https://github.com/scaleflex/filerobot-image-editor)  
- 🔁 **Reinjection of the processed file** directly into the web page’s upload form  
- 💾 **Edit your local file** — everything runs in your browser  
- ⚡ **Powered by** [Google Chrome built-in AI model](https://developer.chrome.com/docs/ai/built-in)  

---

## 🧩 How it works  
The assistant receives your request in natural language (e.g., *“convert my image to PDF and reduce its size”*).  
It then generates the corresponding **command lines** for tools like FFmpeg or ImageMagick.  
Since the local model is small and doesn’t store all commands in memory, **MiniSearch** is used to query a **local database of valid examples**, ensuring accurate, non-hallucinated commands.  

---

## 💡 Inspiration  
When I had to upload files to websites, I was often frustrated by the need to use an external tool, software, or website just to modify, compress, or convert my files to the right format.  
To solve this problem, I decided to create a browser extension capable of editing and converting audio and video files directly before upload — injecting them straight into the page’s upload form.  
Now, I no longer need any third-party software to prepare my files for upload.  

---

## 🛠️ How I built it  
Built with:  
- **TypeScript**, **React**  
- **Zustand** for state management  
- **CRXJS** for Chrome extension bundling  
- **MiniSearch** for local command search  
- **ImageMagick**, **FFmpeg**, **ChatUI**, and **react-filerobot-image-editor**  

---

## 🧗 Challenges I ran into  
The tools used for processing images and videos — such as **ImageMagick** and **FFmpeg** — are command-line based.  
To make them work, the assistant must generate valid command lines. However, since the local model is relatively small, it often **hallucinates** when asked to produce them directly.  

After many tests, I chose **MiniSearch** as the most reliable solution. It allows the model to search a **local database of commands** and retrieve the right one based on the user’s goal, ensuring accuracy.  

Another challenge was **extracting upload requirements** from websites (file format, max size, resolution, duration, etc.).  
I tested several methods and implemented **automated tests with Puppeteer** to verify both the prompts and the extraction logic across multiple websites.  

---

## 🏆 Accomplishments I’m proud of  
- Built a **tool execution system** with **very low token usage**, making it efficient and lightweight for local inference.  
- This was the biggest challenge of the project, and I’m really happy I got it working 🎉.  

---

## 📚 What I learned  
I learned how to **use Chrome’s built-in AI models** and how to **enable communication between the different parts of a Chrome extension** — including the service worker, content scripts, offscreen document, and side panel.  
Now it’s time to clean up and **standardize the communication system**, since it’s the end of the challenge 😄.  

---

## 🔮 What’s next for EasyUpload  
The **upload requirement extraction** and **tool execution** systems are the two main building blocks for a **fully autonomous extension** — one capable of analyzing whether a user’s file meets a website’s requirements and automatically modifying it if needed.  

With these foundations in place, **the goal of a fully autonomous system is now achievable.**

```bash
npm run dev
```

## Tests

```bash
pnpm vitest run youtube
pnpm vitest run -t "test big_prompt_shorter youtube thumbnail"
```