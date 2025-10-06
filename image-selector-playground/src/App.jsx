import React, { useState, useRef, useEffect } from 'react';

function App() {
  const [accept, setAccept] = useState('image/*, video/*, audio/*, .pdf');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleAcceptChange = (event) => {
    setAccept(event.target.value);
  };

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Nettoyage de l'URL objet pour éviter les fuites de mémoire
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const renderPreview = () => {
    if (!previewUrl) {
      return <p>Aucun fichier sélectionné.</p>;
    }

    const fileType = file.type;

    if (fileType.startsWith('image/')) {
      return <img src={previewUrl} alt="Aperçu" />;
    } else if (fileType.startsWith('video/')) {
      return <video src={previewUrl} controls />; 
    } else if (fileType.startsWith('audio/')) {
      return <audio src={previewUrl} controls />;
    } else if (fileType === 'application/pdf') {
      return <iframe src={previewUrl} title="Aperçu PDF"></iframe>;
    } else {
      return <p>Type de fichier non supporté pour l'aperçu.</p>;
    }
  };

  return (
    <div className="App">
      <header>
        <h1>Prévisualisation de Fichier</h1>
      </header>
      <main>
        <div className="controls">
          <div className="input-group">
            <label htmlFor="accept-input">Attribut `accept` :</label>
            <input 
              id="accept-input"
              type="text" 
              value={accept} 
              onChange={handleAcceptChange} 
              placeholder="ex: image/png, image/jpeg"
            />
          </div>
          <input 
            type="file" 
            accept= {accept} 
            onChange={handleFileChange} 
            ref={fileInputRef}
            style={{ display: 'none' }} 
          />
          <button onClick={triggerFileSelect}>Sélectionner un fichier</button>
        </div>

        <div className="preview-container">
          {renderPreview()}
        </div>
      </main>
    </div>
  );
}

export default App;
