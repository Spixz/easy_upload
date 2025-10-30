export default class MessagesLibrary {
  static readonly noFileToWorkOn = `I noticed you requested to edit a file, but I don’t have any file to work with yet. You can add one in two ways:\n
- when a web page asks you to upload a file, just click the “Select file” button — I’ll automatically detect and use it.
- or simply drag and drop a file directly into this window.`;
  static readonly preaparingAPlan = "I’m preparing a plan to modify your file";
  static readonly doYouWantToExecuteTheTask =
    "Do you want to execute the tasks?";
  static readonly noToolsForThisTask =
    "I don’t have the necessary tools to perform the modification";
  static readonly noFileYet = `Select a file to get started, or pick one from a web page when it asks you to upload a file.`;
  static readonly uploadFieldNoLongerAvailaible =
    "The upload field is no longer available";
  static readonly filToReinjectIsEmpty = "The file to be re-injected is empty";
}
