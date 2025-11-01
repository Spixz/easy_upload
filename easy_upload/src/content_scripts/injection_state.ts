export var isAwaitingTarget = false;
export var pendingFile: File | null = null;

export function startInjectionMode(file: File): void {
  console.log("State change: AWAITING INJECTION TARGET");
  isAwaitingTarget = true;
  pendingFile = file;
}

export function resetInjectionState(): void {
  console.log("State change: RESETTING TO NORMAL");
  isAwaitingTarget = false;
  pendingFile = null;
}