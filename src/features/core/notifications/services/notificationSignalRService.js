import { HubConnectionBuilder, HttpTransportType } from "@microsoft/signalr";
import { loadAuthSession } from "../../auth/model/authStorage";

// Resolve hub URL from API base URL
const baseURL = import.meta.env.VITE_API_BASE_URL?.trim() || "";
const hubUrl = baseURL 
  ? baseURL.replace(/\/api\/?$/, "/notifications") 
  : "https://nailify.onrender.com/notifications";

export const notificationSignalRService = {
  connection: null,

  /**
   * Initializes and starts a new SignalR Hub Connection.
   * @param {Object} callbacks callbacks for handling events
   * @param {Function} callbacks.onNotificationReceived called when a notification is received
   * @param {Function} callbacks.onReconnected called when connection is restored
   * @param {Function} callbacks.onDisconnected called when connection is lost
   */
  startConnection(callbacks = {}) {
    const session = loadAuthSession();
    const token = session?.accessToken || session?.token;

    if (!token) {
      console.warn("SignalR: No access token found. Postponing connection.");
      return null;
    }

    if (this.connection) {
      console.log("SignalR: Connection already exists. Re-using connection.");
      return this.connection;
    }

    console.log(`SignalR: Connecting to hub at ${hubUrl}`);

    // Build the connection
    const connectionBuilder = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => {
          // Re-load the session just in case it has been refreshed/updated
          const currentSession = loadAuthSession();
          return currentSession?.accessToken || currentSession?.token || "";
        },
        skipNegotiation: true,
        transport: HttpTransportType.WebSockets,
      })
      .withAutomaticReconnect();

    this.connection = connectionBuilder.build();

    // Listeners
    this.connection.on("ReceiveNotification", (notification) => {
      console.log("SignalR: Notification received via ReceiveNotification:", notification);
      callbacks.onNotificationReceived?.(notification);
    });

    this.connection.on("NotificationReceived", (notification) => {
      console.log("SignalR: Notification received via NotificationReceived:", notification);
      callbacks.onNotificationReceived?.(notification);
    });

    this.connection.on("NextStepReady", (notification) => {
      console.log("SignalR: Notification received via NextStepReady:", notification);
      callbacks.onNotificationReceived?.({
        ...notification,
        title: "Bước tiếp theo đã sẵn sàng",
      });
    });

    this.connection.onreconnected(() => {
      console.log("SignalR: Connection restored successfully.");
      callbacks.onReconnected?.();
    });

    this.connection.onclose((error) => {
      console.log("SignalR: Connection closed.", error);
      callbacks.onDisconnected?.(error);
    });

    // Start connection
    this.connection
      .start()
      .then(() => {
        console.log("SignalR: Connected successfully to /notifications");
      })
      .catch((err) => {
        console.error("SignalR: Error establishing connection:", err);
        
        // If WebSocket negotiation was skipped but fails due to config, try default negotiation
        if (err.toString().includes("WebSocket")) {
          console.log("SignalR: Retrying with standard negotiation fallback...");
          this.retryWithNegotiation(callbacks);
        }
      });

    return this.connection;
  },

  retryWithNegotiation(callbacks) {
    this.stopConnection();

    const session = loadAuthSession();
    const token = session?.accessToken || session?.token;

    this.connection = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => token || "",
      })
      .withAutomaticReconnect()
      .build();

    this.connection.on("ReceiveNotification", (notification) => {
      callbacks.onNotificationReceived?.(notification);
    });

    this.connection.on("NotificationReceived", (notification) => {
      callbacks.onNotificationReceived?.(notification);
    });

    this.connection.on("NextStepReady", (notification) => {
      callbacks.onNotificationReceived?.({
        ...notification,
        title: "Bước tiếp theo đã sẵn sàng",
      });
    });

    this.connection
      .start()
      .then(() => {
        console.log("SignalR: Fallback connected successfully.");
      })
      .catch((err) => {
        console.error("SignalR: Fallback connection also failed:", err);
      });
  },

  /**
   * Stop the active SignalR connection and clean up.
   */
  stopConnection() {
    if (this.connection) {
      console.log("SignalR: Stopping connection...");
      this.connection.off("ReceiveNotification");
      this.connection.off("NotificationReceived");
      this.connection.stop();
      this.connection = null;
    }
  },
};
