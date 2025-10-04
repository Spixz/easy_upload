import inputOnChangeListener from "./update_on_change";

console.log("LOADED : input modifiers");

document.arrive('input[type="file"]', function (newElem) {
  inputOnChangeListener(newElem as HTMLInputElement);
});