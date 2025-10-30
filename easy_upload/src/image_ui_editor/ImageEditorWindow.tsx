import { useState, useEffect, useMemo } from "react";
import FilerobotImageEditor, {
  TABS,
  TOOLS,
} from "react-filerobot-image-editor";

// Fonction pour charger l'image depuis l'OPFS (à placer ici ou dans un fichier d'helpers)
async function getImageUrlFromOpfs(
  opfsFilename: string,
): Promise<string | null> {
  try {
    const root = await navigator.storage.getDirectory();
    const fileHandle = await root.getFileHandle(opfsFilename);
    const file = await fileHandle.getFile();
    return URL.createObjectURL(file);
  } catch (error) {
    console.error("Failed to load image from OPFS:", error);
    return null;
  }
}

export function ImageEditorWindow() {
  // State pour stocker l'URL de l'image une fois chargée depuis l'OPFS
  const [sourceImageUrl, setSourceImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Utilisation de useMemo pour lire les paramètres de l'URL une seule fois
  const urlParams = useMemo(
    () => new URLSearchParams(window.location.search),
    [],
  );

  const opfsFilename = urlParams.get("opfsFilename");
  const initialTab = urlParams.get("initialTab");
  const initialTool = urlParams.get("initialTool");

  // Effet pour charger l'image depuis l'OPFS au montage du composant
  useEffect(() => {
    if (!opfsFilename) {
      setError("Error: No file specified in the URL.");
      return;
    }

    getImageUrlFromOpfs(opfsFilename).then((url) => {
      if (url) {
        setSourceImageUrl(url);
      } else {
        setError("Error: Failed to load the image from storage.");
      }
    });

    // Nettoyage de l'URL de l'objet quand le composant est démonté
    return () => {
      if (sourceImageUrl) {
        URL.revokeObjectURL(sourceImageUrl);
      }
    };
  }, [opfsFilename]); // Dépendance unique pour ne s'exécuter qu'une fois

  // Gestion de la sauvegarde
  const handleSave = (editedImageObject: any) => {
    console.log("Image saved!", editedImageObject);

    // Convertit le canvas en Blob
    editedImageObject.imageCanvas.toBlob(async (blob: Blob | null) => {
      if (blob) {
        // ICI: Ta logique pour écrire le `blob` dans l'OPFS
        // await writeFileInOPFS('nom_du_fichier_modifie.png', blob);

        // Envoyer un message de succès
        // chrome.runtime.sendMessage({ action: 'image-editor-complete', success: true });

        console.log("Blob prêt à être sauvegardé dans OPFS.", blob);

        // Fermer la fenêtre
        window.close();
      } else {
        console.error("Failed to get blob from canvas.");
        // chrome.runtime.sendMessage({ action: 'image-editor-complete', success: false });
        window.close();
      }
    });
  };

  // Gestion de la fermeture
  const handleClose = () => {
    console.log("Editor closed by user.");
    // Envoyer un message d'annulation
    // chrome.runtime.sendMessage({ action: 'image-editor-closed' });
    window.close();
  };

  // Affichage en cas d'erreur ou de chargement
  if (error) {
    return <h1>{error}</h1>;
  }
  if (!sourceImageUrl) {
    return <h1>Loading image...</h1>;
  }

  return (
    <FilerobotImageEditor
      source={sourceImageUrl}
      onSave={handleSave}
      onClose={handleClose}
      // Configuration dynamique basée sur les paramètres de l'URL
      defaultTabId={
        initialTab && Object.values(TABS).includes(initialTab as any)
          ? (initialTab as any)
          : undefined
      }
      defaultToolId={
        initialTool && Object.values(TOOLS).includes(initialTool as any)
          ? (initialTool as any)
          : undefined
      }
      savingPixelRatio={0}
      previewPixelRatio={0}
      // Tu peux ajouter d'autres configurations ici
      // ...
    />
  );
}
