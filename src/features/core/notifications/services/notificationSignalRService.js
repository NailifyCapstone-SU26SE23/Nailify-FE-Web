import { loadAuthSession } from "../../auth/model/authStorage";
import { startSignalR, getSignalR, stopSignalR } from "../../../../lib/signalr";

export const notificationSignalRService = {
  /**
   * Initializes and starts a new SignalR Hub Connection by delegating to the shared startSignalR function.
   * @param {Object} callbacks callbacks for handling events
   * @param {Function} callbacks.onNotificationReceived called when a notification is received
   * @param {Function} callbacks.onReconnected called when connection is restored
   * @param {Function} callbacks.onDisconnected called when connection is lost
   */
  async startConnection(callbacks = {}) {
    const session = loadAuthSession();
    const token = session?.accessToken || session?.token;

    if (!token) {
      console.warn("SignalR: No access token found. Postponing connection.");
      return null;
    }

    try {
      const connection = await startSignalR(token);

      connection.on("ReceiveNotification", (arg1, arg2) => {
        console.log("SignalR: Notification received via ReceiveNotification:", arg1, arg2);
        
        if (arg1 === "NextStepReady" && arg2?.message) {
          callbacks.onNotificationReceived?.({
            title: "Cập nhật tiến độ",
            message: arg2.message,
          });
        } else {
          // Fallback if the payload is different
          callbacks.onNotificationReceived?.(arg2 || arg1);
        }
      });

      connection.on("NotificationReceived", (notification) => {
        console.log("SignalR: Notification received via NotificationReceived:", notification);
        callbacks.onNotificationReceived?.(notification);
      });

      connection.on("ReceiveMessage", (message) => {
        console.log("SignalR: Notification received via ReceiveMessage:", message);
        callbacks.onNotificationReceived?.(message);
      });

      connection.onreconnected(() => {
        console.log("SignalR: Connection restored successfully.");
        callbacks.onReconnected?.();
      });

      connection.onclose((error) => {
        console.log("SignalR: Connection closed.", error);
        callbacks.onDisconnected?.(error);
      });

      return connection;
    } catch (err) {
      console.error("SignalR: Error establishing connection:", err);
      // Removed the old fallback logic since signalr.js should handle connection specifics centrally
      return null;
    }
  },

  /**
   * Stop the active SignalR connection and clean up.
   */
  async stopConnection() {
    const connection = getSignalR();
    if (connection) {
      console.log("SignalR: Stopping connection...");
      connection.off("ReceiveNotification");
      connection.off("NotificationReceived");
      connection.off("ReceiveMessage");
      
      await stopSignalR();
    }
  },
};
