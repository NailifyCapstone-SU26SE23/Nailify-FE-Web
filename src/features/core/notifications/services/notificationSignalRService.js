import { loadAuthSession } from "../../auth/model/authStorage";
import { startSignalR, getSignalR, stopSignalR } from "../../../../lib/signalr";

// Module-level listener registry for components to subscribe to raw SignalR events
const listeners = [];

// Track which connection instance we have already attached handlers to.
// If startConnection is called again on the SAME connection object (same token -> startSignalR
// returns the cached connection), we skip re-registering handlers to prevent accumulation.
let handlerConnectionId = null;

// Flag to distinguish intentional stop (stopConnection) vs unexpected disconnect (server closed)
let isStoppingIntentionally = false;

// Callbacks reference stored so they can be refreshed if startConnection is called again
// while the connection is already alive (e.g. after page re-mount).
// Using a mutable ref avoids stale closures in registered handlers.
let storedCallbacks = {};

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
    const salonId = session?.user?.salonId || session?.salonId;

    if (!token) {
      console.warn("SignalR: No access token found. Postponing connection.");
      return null;
    }

    // Always update callbacks reference so the latest callbacks are used
    // even when the connection is reused (avoids stale closures in handlers)
    storedCallbacks = callbacks;

    try {
      const connection = await startSignalR(token, salonId);

      if (!connection) {
        console.error("SignalR: startSignalR returned null — connection failed.");
        return null;
      }

      // Determine the unique identity of this connection instance.
      const connId = connection.connectionId || connection._connectionId || "pending";

      // If we already attached handlers to this exact connection object, skip re-registration.
      // This prevents handler accumulation when startConnection is called multiple times
      // while the underlying HubConnection is still the same object (same token).
      if (handlerConnectionId !== null && handlerConnectionId === connId) {
        console.log("SignalR: Handlers already registered on this connection — skipping.");
        return connection;
      }

      console.log("SignalR: Registering handlers on connection:", connId);
      handlerConnectionId = connId;

      // --- Try to explicitly join the salon-specific group ---
      // Backend sends staff notifications via Clients.Group(salonId).
      // The manager's JWT has no salonId claim so OnConnectedAsync cannot auto-add them.
      // We proactively invoke the hub's join method (try common naming conventions).
      if (salonId) {
        const joinMethods = ["JoinSalonGroup", "JoinGroup", "JoinSalon"];
        let joined = false;
        for (const method of joinMethods) {
          try {
            await connection.invoke(method, salonId);
            console.log(`SignalR: Joined salon group via hub method '${method}':`, salonId);
            joined = true;
            break;
          } catch (_) {
            // method doesn't exist on this hub — try next
          }
        }
        if (!joined) {
          console.warn(
            "SignalR: Hub does not expose a group-join method (tried JoinSalonGroup / JoinGroup / JoinSalon).",
            "Ensure the backend's OnConnectedAsync adds the manager to the salon group via query-string salonId."
          );
        }
      }

      // --- Message handlers (accumulated with .on, guarded by handlerConnectionId) ---

      connection.on("ReceiveNotification", (arg1, arg2) => {
        console.log("SignalR: ReceiveNotification ->", arg1, arg2);

        // Forward to all registered page-level listeners
        listeners.forEach((listener) => {
          try {
            listener(arg1, arg2);
          } catch (err) {
            console.error("SignalR: Error in custom listener:", err);
          }
        });

        // Also fire the global toast/notification callback via the LATEST storedCallbacks ref
        const { onNotificationReceived } = storedCallbacks;
        if (arg1 === "NextStepReady" && arg2 && arg2.message) {
          onNotificationReceived && onNotificationReceived({
            title: "Cập nhật tiến độ",
            message: arg2.message,
          });
        } else if (arg2 && typeof arg2 === "object") {
          let title = "Thông báo mới";
          if (arg1 === "BookingRescheduleRequested") title = "Yêu cầu đổi lịch mới";
          else if (arg1 === "BookingRescheduleDeclined") title = "Yêu cầu đổi lịch bị từ chối";
          else if (arg1 === "BookingRescheduleAccepted") title = "Yêu cầu đổi lịch được đồng ý";
          else if (arg1 === "DelayETA") title = "Cập nhật thời gian chờ";

          onNotificationReceived && onNotificationReceived({
            title,
            message: arg2.Message || arg2.message || "Đã có cập nhật từ hệ thống",
            ...arg2,
          });
        } else {
          onNotificationReceived && onNotificationReceived(arg2 || arg1);
        }
      });

      connection.on("NotificationReceived", (notification) => {
        console.log("SignalR: NotificationReceived ->", notification);
        storedCallbacks.onNotificationReceived && storedCallbacks.onNotificationReceived(notification);
      });

      connection.on("ReceiveMessage", (message) => {
        console.log("SignalR: ReceiveMessage ->", message);
        storedCallbacks.onNotificationReceived && storedCallbacks.onNotificationReceived(message);
      });

      // --- Lifecycle handlers ---
      // Clear the internal arrays BEFORE adding new handlers so that if this connection
      // was previously configured (e.g. old component mount), stale closures are removed.
      // Internal array names from @microsoft/signalr HubConnection source:
      //   _closedCallbacks      <- populated by connection.onclose(fn)
      //   _reconnectedCallbacks <- populated by connection.onreconnected(fn)
      if (Array.isArray(connection._closedCallbacks)) {
        connection._closedCallbacks.length = 0;
      }
      if (Array.isArray(connection._reconnectedCallbacks)) {
        connection._reconnectedCallbacks.length = 0;
      }

      connection.onreconnected((newConnectionId) => {
        console.log("SignalR: Connection restored. New ID:", newConnectionId);
        // Update tracked ID to the new connection ID after reconnect
        handlerConnectionId = newConnectionId || handlerConnectionId;
        storedCallbacks.onReconnected && storedCallbacks.onReconnected();
      });

      connection.onclose((error) => {
        console.log("SignalR: Connection closed.", error);
        // Clear the tracked ID so next startConnection re-registers handlers on the new connection
        handlerConnectionId = null;

        if (!isStoppingIntentionally) {
          console.warn("SignalR: Unexpected disconnect — triggering reconnect.");
          storedCallbacks.onDisconnected && storedCallbacks.onDisconnected(error);
        } else {
          console.log("SignalR: Intentional stop — suppressing onDisconnected callback.");
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
   */
  async stopConnection() {
    const connection = getSignalR();
    if (connection) {
      console.log("SignalR: Stopping connection...");
      isStoppingIntentionally = true;
      handlerConnectionId = null;
      await stopSignalR();
      isStoppingIntentionally = false;
    }
  },
};
