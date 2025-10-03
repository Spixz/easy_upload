import { useEffect, useState } from "react";

export default function LanguageModelDownloader() {
  const [availability, setAvailability] = useState<Availability | null>(null);

  useEffect(() => {
    try {
      LanguageModel.availability().then(setAvailability);
    } catch (err) {
      console.error("Erreur en vérifiant la disponibilité :", err);
    }
  }, []);

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  };

  const modalStyle: React.CSSProperties = {
    backgroundColor: '#fff',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
    maxWidth: '500px',
    width: '90%',
    textAlign: 'center',
  };

  console.log(`Etat du modèle ${availability}`);

  if (availability == null || availability == 'available' || availability == 'downloading') return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <PopUpContent />
      </div>
    </div>
  );

}


function PopUpContent() {
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    try {
      LanguageModel.availability().then(setAvailability);
    } catch (err) {
      console.error("Erreur en vérifiant la disponibilité :", err);
    }
  }, []);

  const downloadModel = async () => {
    try {
      console.log("Téléchargement en cours...");
      await LanguageModel.create({
        monitor(m: any) {
          m.addEventListener("downloadprogress", (e: any) => {
            setProgress(Math.round(e.loaded * 100));
          });
        },
      });
    } catch (err) {
      console.error("Erreur lors du téléchargement :", err);
    }
  };

  if (availability === 'unavailable') return UnvailaibleModel();

  if (availability === "downloadable") {
    return (
      <div>
        <h1>Language Model Required</h1>
        <p>To enable advanced features, a language model needs to be downloaded (approx. 400MB).</p>
        <button onClick={downloadModel} style={buttonStyle}>
          {progress > 0 ? `Downloading... ${Math.round(progress)}%` : "Download Model"}
        </button>
      </div>
    );

    return
  }

}


function UnvailaibleModel() {
  return (
    <div>
      <h1>Language Model Required</h1>
      <p>Le modèle ne peut pas être téléchargé pour vous. Vous pouvez
        désinstaller l'extension.</p>
    </div>
  );
}



const buttonStyle: React.CSSProperties = {
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  padding: '10px 20px',
  borderRadius: '5px',
  cursor: 'pointer',
  fontSize: '1rem',
  marginTop: '1rem',
}