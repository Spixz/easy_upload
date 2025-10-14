import { onMessage } from "webext-bridge/popup";

onMessage('input_unprocess_requirements', ({ data }) => {
  const requirements = data;
  console.log('Données reçues dans le side panel :', requirements);
});


// ! creer une conversation (l'exposer avec l'autre zustand)
// ! lancer la recup des requirements