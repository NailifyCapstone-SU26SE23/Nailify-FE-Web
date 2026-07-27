import * as signalR from "@microsoft/signalr";

let connection = null;
let currentToken = null;

export const startSignalR = async (token) => {
    // If same token and connection already exists, reuse it
    if (connection && token === currentToken) return connection;

    // Token changed (e.g. re-login) — tear down old connection first
    if (connection && token !== currentToken) {
        try {
            await connection.stop();
        } catch (_) { /* ignore */ }
        connection = null;
        currentToken = null;
    }

    currentToken = token;

    // Extract base URL without the /api suffix (assuming VITE_API_BASE_URL ends with /api)
    const baseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '');
    const hubUrl = `${baseUrl}/notifications`;

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