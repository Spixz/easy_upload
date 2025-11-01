import { primaryColor } from "@/commons/colors";
import { Notyf } from "notyf";

export function displayErrorMessage(message: string) {
  const notyf = new Notyf();
  notyf.error({
    message: message,
    duration: 2500,
    position: {
      x: "right",
      y: "bottom",
    },
  });
}

export function displaySuccessMessage(message: string) {
  const notyf = new Notyf();
  notyf.error({
    message: message,
    duration: 2500,
    position: {
      x: "right",
      y: "bottom",
    },
  });
}

export function displayMessage(message: string) {
  const notyf = new Notyf({
    types: [
      {
        type: "info",
        background: primaryColor,
        icon: false,
      },
    ],
  });

  notyf.open({
    type: "info",
    message: message,
    duration: 5000,
    position: {
      x: "right",
      y: "bottom",
    },
  });
}
