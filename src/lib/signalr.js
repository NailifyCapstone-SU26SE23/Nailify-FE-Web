import * as signalR from "@microsoft/signalr";

let connection = null;

export const startSignalR = async (token) => {
    if (connection) return connection;

    // Extract base URL without the /api suffix (assuming VITE_API_BASE_URL ends with /api)
    const baseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '');
    const hubUrl = `${baseUrl}/notifications`;

    connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
            accessTokenFactory: () => token,
        })
        .withAutomaticReconnect()
        .configureLogging(signalR.LogLevel.Information)
        .build();

    try {
        await connection.start();
        console.log("✅ SignalR Connected");
    } catch (err) {
        console.error("SignalR Error:", err);
    }

    return connection;
};

export const getSignalR = () => connection;

export const stopSignalR = async () => {
    if (connection) {
        await connection.stop();
        connection = null;
        console.log("🛑 SignalR Disconnected");
    }
};