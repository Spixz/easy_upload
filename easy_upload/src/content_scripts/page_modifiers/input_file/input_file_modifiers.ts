import inputOnClickListener from "./onClick/update_on_click";
import inputOnChangeListener from "./update_on_change";

console.log("LOADED : input modifiers");

(function monitorFileInputs() {
  function checkFileInputs() {
    const inputs = document.querySelectorAll('input[type="file"]');
    if (inputs.length > 0) {
      console.log(`✅ ${inputs.length} input[type="file"] trouvés sur la page`);
      inputs.forEach((elem) => {
        inputOnChangeListener(elem as HTMLInputElement);
        inputOnClickListener(elem as HTMLInputElement);
      });
    } else {
      console.log("❌ Aucun input[type='file'] trouvé pour le moment");
    }
  }

  // Vérifie immédiatement une première fois
  checkFileInputs();

  // Mets en place un observer pour détecter les ajouts/retraits d'éléments
  const observer = new MutationObserver(() => {
    checkFileInputs();
  });

  observer.observe(document.body, {
    childList: true,       // écoute l’ajout/suppression d’éléments
    subtree: true          // écoute tout le DOM, pas seulement body
  });

  console.log("👀 Surveillance des input[type='file'] activée !");
})();