import React, { useState } from "react";
import { Radio, RadioGroup, RadioValue } from "@chatui/core";

const options = [
  { label: "Pas encore", value: "a" },
  { label: "Succès de l'envoie", value: "b" },
  { label: "Échec de l'envoie", value: "c" },
];

export default function IsUploadSuccessful() {
  const [value, setValue] = useState<string>("a");

  function handleChange(value: RadioValue) {
    setValue(value?.toString() ?? "a");
  }

  return (
    <div>
      <h3>Votre fichier à il été uploadé ?</h3>
      <RadioGroup value={value} options={options} onChange={handleChange} />
    </div>
  );
}
