console.log("Content script loaded.");

/**
 * Converts an image file to PNG format.
 * @param file The image file to convert.
 * @returns A promise that resolves with the new PNG file.
 */
function convertToPng(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          return reject(new Error('Could not get 2D context from canvas.'));
        }

        ctx.drawImage(img, 0, 0);

        canvas.toBlob((blob) => {
          if (!blob) {
            return reject(new Error('Failed to convert canvas to blob.'));
          }

          const newFileName = file.name.substring(0, file.name.lastIndexOf('.') || file.name.length) + '.png';
          const pngFile = new File([blob], newFileName, { type: 'image/png' });
          resolve(pngFile);
        }, 'image/png');
      };

      img.onerror = () => reject(new Error('Image failed to load.'));
    };

    reader.onerror = () => reject(new Error('File reader failed.'));
  });
}

/**
 * Handles the file change event on an input element.
 * If the selected file is an image but not a PNG, it converts it to PNG
 * and replaces the original file in the input.
 * @param event The change event.
 */
async function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) {
    return;
  }

  if (file.type.startsWith('image/') && file.type !== 'image/png') {
    console.log(`Converting ${file.name} to PNG...`);
    try {
      const pngFile = await convertToPng(file);
      console.log('Conversion successful.');

      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(pngFile);
      input.files = dataTransfer.files;

      input.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (error) {
      console.error('Error during file conversion:', error);
    }
  }
}

/**
 * Attaches the change event listener to a given file input.
 * @param input The HTMLInputElement to attach the listener to.
 */
function attachListenerToInput(input: HTMLInputElement) {
  if (input.dataset.pngConverterAttached) {
    return;
  }
  // Widen the accept attribute to allow selection of any image file for conversion.
  input.accept = 'image/*';
  input.addEventListener('change', handleFileChange);
  input.dataset.pngConverterAttached = 'true';
  console.log('PNG converter attached and accept attribute modified for:', input);
}

/**
 * Finds all file inputs on the page that accept PNGs and attaches the listener.
 */
function findAndAttachToInputs() {
  document.querySelectorAll('input[type="file"][accept*="png"]').forEach(input => {
    attachListenerToInput(input as HTMLInputElement);
  });
}

// --- Main execution ---

findAndAttachToInputs();

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as Element;
          if (element.matches('input[type="file"][accept*="png"]')) {
            attachListenerToInput(element as HTMLInputElement);
          }
          element.querySelectorAll('input[type="file"][accept*="png"]').forEach(input => {
            attachListenerToInput(input as HTMLInputElement);
          });
        }
      });
    } else if (mutation.type === 'attributes') {
      const element = mutation.target;
      if (
        element instanceof HTMLInputElement &&
        element.type === 'file' &&
        element.accept.includes('png')
      ) {
        attachListenerToInput(element);
      }
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true,
});