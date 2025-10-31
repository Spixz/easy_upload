/**
 * ext-send-chunked-message
 * A library enabling the transmission of large messages via chrome.runtime in Chrome Extensions (Manifest V3).
 * This version has been modified to support targeted messaging via chrome.runtime.Port objects.
 *
 * Original Author: Alexey Belozerov – WellDoneCode.com
 * Source: https://github.com/abelozerov/ext-send-chunked-message
 * Version: 1.2.0 (Modified, Channels Removed)
 */

if (typeof chrome === "undefined" || !chrome.runtime) {
  throw new Error(
    "ext-send-chunked-message package can be used in a Chrome Extension context only.",
  );
}

// --- CONSTANTS AND TYPES ---

export const CHUNKED_MESSAGE_FLAG = "CHUNKED_MESSAGE_FLAG";
export const MAX_CHUNK_SIZE: number = 32 * 1024 * 1024; // 32MB per chunk

export interface ChunkedMessage {
  [CHUNKED_MESSAGE_FLAG]?: boolean;
  requestId: string;
  chunk?: string;
  done?: boolean;
  status?: string;
}

export type SendMessageFn = (message: any) => Promise<any>;

// --- INTERNAL STATE ---

const requestsStorage: Record<string, string[]> = {};

// --- SENDING FUNCTIONS ---

/**
 * Default sender function using global broadcast (chrome.runtime.sendMessage).
 * Use this for messages intended for any part of the extension.
 */
function sendMessageDefaultFn(message: any): Promise<any> {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(message, (response) => {
      // Ignore errors, as the recipient might not be available.
      if (chrome.runtime.lastError) {
        /* Ignored */
      }
      resolve(response);
    });
  });
}

/**
 * Creates a sender function that targets a specific tab (chrome.tabs.sendMessage).
 * @param tabId The ID of the tab to send the message to.
 */
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

/**
 * Creates a sender function that uses a persistent connection port.
 * This is the recommended method for reliable, targeted communication between two specific contexts.
 * @param port The chrome.runtime.Port object to use for sending.
 */
function createPortSendMessageFn(port: chrome.runtime.Port): SendMessageFn {
  return (message: any): Promise<any> => {
    try {
      port.postMessage(message);
      // port.postMessage is fire-and-forget, it doesn't return a promise.
      // We resolve immediately to allow the chunking loop to continue.
      return Promise.resolve();
    } catch (error) {
      // Catch errors if the port has been disconnected.
      console.error("ext-send-chunked-message: Port disconnected.", error);
      return Promise.reject(error);
    }
  };
}

/**
 * Sends a large message by splitting it into manageable chunks.
 * It can use different transport methods: global broadcast, a specific tab, or a persistent port.
 *
 * @param message The large JSON-serializable object to send.
 * @param options Configuration for sending the message.
 *   - port: The `chrome.runtime.Port` to use for direct communication (highest priority).
 *   - tabId: The ID of the tab to target.
 *   - requestId: An optional ID to override the auto-generated one.
 *   - sendMessageFn: A completely custom sending function.
 */
export async function sendChunkedMessage(
  message: any,
  options: {
    port?: chrome.runtime.Port;
    tabId?: number;
    requestId?: string;
    sendMessageFn?: SendMessageFn;
  } = {},
): Promise<void> {
  const { sendMessageFn, requestId: requestIdOverriden, tabId, port } =
    options;

  // Select the sending strategy with port having the highest priority.
  const sendMessage =
    sendMessageFn ||
    (port
      ? createPortSendMessageFn(port)
      : tabId
        ? createTabSendMessageFn(tabId)
        : sendMessageDefaultFn);

  const requestId = requestIdOverriden || crypto.randomUUID();
  const messageSerialized = JSON.stringify(message);
  const len = messageSerialized.length;

  // Send the message in chunks
  for (let i = 0; i < len; i += MAX_CHUNK_SIZE) {
    const chunk = messageSerialized.substring(i, i + MAX_CHUNK_SIZE);
    await sendMessage({
      [CHUNKED_MESSAGE_FLAG]: true,
      requestId,
      chunk,
    });
  }

  // Send the final "done" signal
  await sendMessage({
    [CHUNKED_MESSAGE_FLAG]: true,
    requestId,
    done: true,
  });
}

// --- LISTENING FUNCTIONS ---

/**
 * The internal logic that reassembles chunks into a complete message.
 * This function is not exported and serves as the core for the listener wrappers.
 */
function onChunkedMessageHandlerInternal(
  handler: (
    fullMessage: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void,
  ) => void | boolean,
) {
  return function (
    request: ChunkedMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void,
  ): boolean | void {
    // Ignore messages that are not part of the chunking system
    if (!request || !request[CHUNKED_MESSAGE_FLAG] || !request.requestId) {
      return false;
    }

    const { requestId } = request;

    if (request.done) {
      const fullMessageSerialized = requestsStorage[requestId]?.join("") ?? "";
      // Clean up memory immediately
      delete requestsStorage[requestId];

      if (!fullMessageSerialized) {
        console.error(
          `Received 'done' signal for requestId ${requestId}, but no chunks were found.`,
        );
        return;
      }

      const fullMessage = JSON.parse(fullMessageSerialized);
      // Await the handler's response if it's asynchronous
      return handler(fullMessage, sender, sendResponse);
    } else if (request.chunk) {
      if (!requestsStorage[requestId]) {
        requestsStorage[requestId] = [];
      }
      requestsStorage[requestId].push(request.chunk);
      // Keep the message channel open for a potential response later
      return true;
    }
  };
}

/**
 * Attaches a chunked message listener directly to a specific port.
 * This is the recommended way to receive messages sent via a port.
 *
 * @param port The port on which to listen for messages.
 * @param handler The function to execute with the fully reassembled message.
 * @returns A function to call to remove the listener and clean up.
 */
export function addChunkedListenerOnPort(
  port: chrome.runtime.Port,
  handler: (fullMessage: any, sender: chrome.runtime.MessageSender) => void,
): () => void {
  const listener = onChunkedMessageHandlerInternal((fullMessage, sender) => {
    handler(fullMessage, sender);
  });

  // The 'sender' object on port listeners might be different, but we keep the signature consistent.
  // The port itself already contains sender information.
  const portListener = (message: any) =>
    listener(message, port.sender!, () => {});

  port.onMessage.addListener(portListener);

  // Return a cleanup function
  return () => {
    port.onMessage.removeListener(portListener);
  };
}

/**
 * Attaches a global listener for chunked messages.
 * Use this when you expect messages from any context, not through a specific port.
 *
 * @param handler The function to execute with the fully reassembled message.
 * @returns The listener function that was added, so it can be removed later.
 */
export function addOnChunkedMessageListener(
  handler: (
    fullMessage: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: any) => void,
  ) => void | boolean,
): (
  message: any,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response?: any) => void,
) => void | boolean {
  const newListener = onChunkedMessageHandlerInternal(handler);
  chrome.runtime.onMessage.addListener(newListener);
  return newListener;
}

/**
 * Removes a global listener that was added with `addOnChunkedMessageListener`.
 * @param listener The listener function to remove.
 */
export function removeOnChunkedMessageListener(
  listener: Parameters<typeof chrome.runtime.onMessage.addListener>[0],
): void {
  chrome.runtime.onMessage.removeListener(listener);
}