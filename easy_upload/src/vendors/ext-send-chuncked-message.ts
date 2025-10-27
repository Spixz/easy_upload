/**
 * ext-send-chunked-message
 * A library enabling the transmission of large messages via chrome.runtime in Chrome Extensions (Manifest V3).
 *
 * © 2024-2025 Alexey Belozerov – WellDoneCode.com
 * Licensed under MIT (see LICENSE file for details).
 *
 * Source: https://github.com/abelozerov/ext-send-chunked-message
 * Version: 1.0.0
 */

if (typeof chrome === "undefined") {
  throw new Error(
    "ext-send-chunked-message package can be used in Chrome Extension context only",
  );
}

export const CHUNKED_MESSAGE_FLAG = "CHUNKED_MESSAGE_FLAG";
export const MAX_CHUNK_SIZE: number =
  32 * 1024 * 1024 ||
  Number(process.env.EXT_SEND_CHUNKED_MESSAGE_MAX_CHUNK_SIZE);

export interface ChunkedMessage {
  [CHUNKED_MESSAGE_FLAG]?: boolean;
  requestId: string;
  chunk?: string;
  done?: boolean;
  status?: string;
  channel?: string;
}

export type SendMessageFn = (message: any) => Promise<any>;

const requestsStorage: Record<string, string[]> = {};

// Fonction d'envoi par défaut (diffusion générale)
export function sendMessageDefaultFn(message: any): Promise<any> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        /* Ignore */
      }
      resolve(response);
    });
  });
}

function createTabSendMessageFn(tabId: number): SendMessageFn {
  return (message: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          return reject(new Error(chrome.runtime.lastError.message));
        }
        resolve(response);
      });
    });
  };
}

export function sendChunkedResponse(
  options: { sendMessageFn?: SendMessageFn } = {},
) {
  const { sendMessageFn } = options;
  return function (
    response: any,
    sendResponse: (response?: any) => void,
  ): void {
    const requestId = self.crypto.randomUUID();
    sendResponse({ [CHUNKED_MESSAGE_FLAG]: true, requestId });
    sendChunkedMessage(response, {
      sendMessageFn: sendMessageFn || sendMessageDefaultFn,
      requestId,
    });
  };
}

/**
 * Envoie un message de grande taille en plusieurs morceaux.
 * MODIFIÉ : Ajout de l'option `tabId` en plus de `channel`.
 */
export async function sendChunkedMessage(
  message: any,
  options: {
    sendMessageFn?: SendMessageFn;
    requestId?: string;
    channel?: string;
    tabId?: number; // NOUVEAU : L'ID de l'onglet à cibler
  } = {},
): Promise<any> {
  const {
    sendMessageFn,
    requestId: requestIdOverriden,
    channel,
    tabId,
  } = options;

  // MODIFIÉ : Logique de sélection de la fonction d'envoi avec priorité
  const sendMessage =
    sendMessageFn || // 1. Priorité à la fonction custom
    (tabId ? createTabSendMessageFn(tabId) : sendMessageDefaultFn); // 2. Sinon, cibler le tabId, ou diffusion par défaut

  const requestId = requestIdOverriden || self.crypto.randomUUID();
  const messageSerialized = JSON.stringify(message);
  const len = messageSerialized.length;
  const step = MAX_CHUNK_SIZE;

  for (let ii = 0; ii < len; ii += step) {
    const nextIndex = Math.min(ii + step, len);
    const substr = messageSerialized.substring(ii, nextIndex);
    await sendMessage({
      [CHUNKED_MESSAGE_FLAG]: true,
      requestId,
      chunk: substr,
      channel, // Le canal est toujours inclus dans le message
    });
  }

  const response = await sendMessage({
    [CHUNKED_MESSAGE_FLAG]: true,
    requestId,
    done: true,
    channel,
  });

  // Le reste de la fonction est inchangé...
  if (response && response[CHUNKED_MESSAGE_FLAG]) {
    let listener: ((...args: any[]) => void) | undefined;
    try {
      const fullResponse = await new Promise<any>((resolve) => {
        listener = addOnChunkedMessageListener(
          (fullResponseFromListener, _sender, sendResponse) => {
            sendResponse();
            resolve(fullResponseFromListener);
          },
          { requestIdToMonitor: response.requestId },
        );
      });
      return fullResponse;
    } finally {
      if (listener) {
        removeOnChunkedMessageListener(listener);
      }
    }
  } else {
    return response;
  }
}

/**
 * Ajoute un listener qui gère les messages découpés.
 * L'option `channel` est conservée pour le filtrage.
 */
export function addOnChunkedMessageListener(
  handler: (
    fullMessage: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void,
  ) => void | boolean,
  options?: {
    requestIdToMonitor?: string;
    channel?: string;
  },
): (
  message: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void,
) => void | boolean {
  const newListener = onChunkedMessageHandlerInternal(handler, options);
  chrome.runtime.onMessage.addListener(newListener);
  return newListener;
}

export function removeOnChunkedMessageListener(
  listener: Parameters<typeof chrome.runtime.onMessage.addListener>[0],
): void {
  chrome.runtime.onMessage.removeListener(listener);
}

/**
 * Handler interne pour la réception des chunks.
 * La logique de filtrage par canal est conservée et fonctionne parfaitement
 * que le message vienne d'une diffusion ou d'un envoi ciblé.
 */
function onChunkedMessageHandlerInternal(
  handler: (
    fullMessage: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void,
  ) => void | boolean,
  options: { requestIdToMonitor?: string; channel?: string } = {},
) {
  const { requestIdToMonitor, channel: listenerChannel } = options;

  return function (
    request: ChunkedMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void,
  ): boolean | void {
    if (!request || !request[CHUNKED_MESSAGE_FLAG] || !request.requestId) {
      return false;
    }

    if (listenerChannel && request.channel !== listenerChannel) {
      return false; // Ignore si le canal ne correspond pas
    }

    const requestId = request.requestId;

    if (requestIdToMonitor && requestId !== requestIdToMonitor) {
      return false;
    }

    if (request.done) {
      const fullMessageSerialized = requestsStorage[requestId]?.join("") ?? "";
      delete requestsStorage[requestId];
      const fullMessage = JSON.parse(fullMessageSerialized);
      return handler(fullMessage, sender, sendResponse);
    } else {
      if (!requestsStorage[requestId]) {
        requestsStorage[requestId] = [];
      }
      requestsStorage[requestId].push(request.chunk ?? "");
      sendResponse({ status: "PENDING" });
      return true; // Garde le port ouvert
    }
  };
}
