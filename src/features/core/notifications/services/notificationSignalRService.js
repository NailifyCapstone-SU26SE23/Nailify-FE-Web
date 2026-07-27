import { loadAuthSession } from "../../auth/model/authStorage";
import { startSignalR, getSignalR, stopSignalR } from "../../../../lib/signalr";

// Module-level listener registry for components to subscribe to raw SignalR events
const listeners = [];

// Keep references to registered handlers so we can correctly remove them later
// (connection.off(event) without handler ref removes ALL handlers — which is a bug)
let registeredHandlers = null;

// Flag to distinguish intentional stop (stopConnection) vs unexpected disconnect (server closed)
// When true, the onclose callback will NOT fire onDisconnected to prevent reconnect loops
let isStoppingIntentionally = false;

export const notificationSignalRService = {
  /**
   * Register a custom callback to receive raw SignalR events.
   * @param {Function} callback - Callback receiving (arg1, arg2) on ReceiveNotification
   * @returns {Function} Unregister function
   */
  registerListener(callback) {
    if (typeof callback === "function") {
      listeners.push(callback);
    }
    return () => {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    };
  },

  /**
   * Initializes and starts a new SignalR Hub Connection.
   * @param {Object} callbacks
   * @param {Function} callbacks.onNotificationReceived
   * @param {Function} callbacks.onReconnected
   * @param {Function} callbacks.onDisconnected
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

      if (!connection) {
        console.error("SignalR: startSignalR returned null — connection failed.");
        return null;
      }

      // --- Build named handler references so we can correctly remove them later ---

      const onReceiveNotification = (arg1, arg2) => {
        console.log("SignalR: ReceiveNotification →", arg1, arg2);

        // Forward to all registered page-level listeners
        listeners.forEach((listener) => {
          try {
            listener(arg1, arg2);
          } catch (err) {
            console.error("SignalR: Error in custom listener:", err);
          }
        });

        // Also fire the global toast/notification callback
        if (arg1 === "NextStepReady" && arg2?.message) {
          callbacks.onNotificationReceived?.({
            title: "Cập nhật tiến độ",
            message: arg2.message,
          });
        } else if (arg2 && typeof arg2 === "object") {
          let title = "Thông báo mới";
          if (arg1 === "BookingRescheduleRequested") title = "Yêu cầu đổi lịch mới";
          else if (arg1 === "BookingRescheduleDeclined") title = "Yêu cầu đổi lịch bị từ chối";
          else if (arg1 === "BookingRescheduleAccepted") title = "Yêu cầu đổi lịch được đồng ý";

          callbacks.onNotificationReceived?.({
            title,
            message: arg2.Message || arg2.message || "Đã có cập nhật từ hệ thống",
            ...arg2,
          });
        } else {
          callbacks.onNotificationReceived?.(arg2 || arg1);
        }
      };

      const onNotificationReceived = (notification) => {
        console.log("SignalR: NotificationReceived →", notification);
        callbacks.onNotificationReceived?.(notification);
      };

      const onReceiveMessage = (message) => {
        console.log("SignalR: ReceiveMessage →", message);
        callbacks.onNotificationReceived?.(message);
      };

      // Store references so stopConnection can cleanly remove exactly these handlers
      registeredHandlers = {
        onReceiveNotification,
        onNotificationReceived,
        onReceiveMessage,
      };

      connection.on("ReceiveNotification", onReceiveNotification);
      connection.on("NotificationReceived", onNotificationReceived);
      connection.on("ReceiveMessage", onReceiveMessage);

      connection.onreconnected(() => {
        console.log("SignalR: Connection restored.");
        callbacks.onReconnected?.();
      });

      connection.onclose((error) => {
        console.log("SignalR: Connection closed.", error);
        // Only notify of disconnect if this was NOT an intentional stop.
        // If isStoppingIntentionally is true, we called stopConnection() ourselves
        // and we do NOT want to trigger the reconnect loop in NotificationContext.
        if (!isStoppingIntentionally) {
          console.warn("SignalR: Unexpected disconnect — triggering reconnect.");
          callbacks.onDisconnected?.(error);
        }
      });

      return connection;
    } catch (err) {
      console.error("SignalR: Error establishing connection:", err);
      return null;
    }
  },

  /**
   * Stop the active SignalR connection and clean up.
   * Uses stored handler references to avoid accidentally removing all listeners.
   */
  async stopConnection() {
    const connection = getSignalR();
    if (connection) {
      console.log("SignalR: Stopping connection...");

      // Signal that this is an intentional stop so onclose does NOT trigger onDisconnected
      isStoppingIntentionally = true;

      // Remove only the handlers we registered — NOT all handlers on the event
      if (registeredHandlers) {
        connection.off("ReceiveNotification", registeredHandlers.onReceiveNotification);
        connection.off("NotificationReceived", registeredHandlers.onNotificationReceived);
        connection.off("ReceiveMessage", registeredHandlers.onReceiveMessage);
        registeredHandlers = null;
      }

      await stopSignalR();

      // Reset flag after the stop completes
      isStoppingIntentionally = false;
    }
  },
};
