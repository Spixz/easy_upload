import { buildInputFile, execute, loadImageElement } from 'wasm-imagemagick'

const { outputFiles, exitCode} = await execute({
  inputFiles: [await buildInputFile('http://some-cdn.com/foo/fn.png', 'image1.png')],
  commands: [
    'convert image1.png -rotate 70 image2.gif',
    // heads up: the next command uses 'image2.gif' which was the output of previous command:
    'convert image2.gif -scale 23% image3.jpg',
  ],
})
if(exitCode !== 0)
    await loadImageElement(outputFiles[0], document.getElementById('outputImage'))