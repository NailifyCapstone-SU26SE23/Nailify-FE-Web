import * as signalR from "@microsoft/signalr";

let connection = null;
let currentToken = null;
// Lock to prevent concurrent startSignalR calls from racing each other.
// If a start is already in progress, new callers await the same promise.
let startingPromise = null;

export const startSignalR = async (token, salonId = null) => {
    // If same token and connection is already connected, reuse it
    if (connection && token === currentToken &&
        connection.state === signalR.HubConnectionState.Connected) {
        return connection;
    }

    // If a connection attempt is already in flight, await that same promise
    // instead of starting a second one. This prevents the StrictMode double-invoke
    // race condition ("stopped during negotiation") and general concurrent-start bugs.
    if (startingPromise) {
        return startingPromise;
    }

    startingPromise = _doStartSignalR(token, salonId);
    try {
        return await startingPromise;
    } finally {
        startingPromise = null;
    }
};

const _doStartSignalR = async (token, salonId) => {
    // Token changed (e.g. re-login) — tear down old connection first
    if (connection && token !== currentToken) {
        try {
            await connection.stop();
        } catch (_) { /* ignore */ }
        connection = null;
        currentToken = null;
    }

    // If the same token connection already exists (may be reconnecting), reuse it
    if (connection && token === currentToken) {
        return connection;
    }

    currentToken = token;

    // Extract base URL without the /api suffix
    const baseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '');
    
    // Append salonId so the backend can add this connection to the correct salon group
    let hubUrl = `${baseUrl}/notifications`;
    if (salonId) {
        hubUrl = `${hubUrl}?salonId=${salonId}`;
    }

    console.log("SignalR: Connecting to Hub URL:", hubUrl);

    connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
            // Lazy getter — always returns the LATEST token, even after token refresh
            accessTokenFactory: () => currentToken,
        })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Information)
        .build();

    try {
        await connection.start();
        console.log("✅ SignalR Connected to:", hubUrl);
    } catch (err) {
        console.error("SignalR Error:", err);
        connection = null;
        currentToken = null;
    }

    return connection;
};

export const getSignalR = () => connection;

export const stopSignalR = async () => {
    if (connection) {
        try {
            await connection.stop();
        } catch (_) { /* ignore */ }
        connection = null;
        currentToken = null;
        console.log("🛑 SignalR Disconnected");
    }
};