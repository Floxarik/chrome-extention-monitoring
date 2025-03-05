let notificationInterval = null;

// Check extension status when the browser starts
chrome.runtime.onStartup.addListener(() => {
  console.log("Browser started, checking extensions...");
  checkExtensions();
});

// Initialize extension monitoring when installed
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension monitoring started");
  checkExtensions();
  startPeriodicNotifications();
});

// Function to check the status of monitored extensions
function checkExtensions() {
  chrome.storage.local.get(
    ["monitoredExtensions", "enableSystemNotifications"],
    (data) => {
      let monitoredExtensions = data.monitoredExtensions || [];
      let enableSystemNotifications = data.enableSystemNotifications || false;
      let disabledExtensions = [];

      chrome.management.getAll((extensions) => {
        monitoredExtensions.forEach((extId) => {
          const extension = extensions.find((e) => e.id === extId);
          if (!extension) return;

          if (!extension.enabled) {
            console.log(`⚠ Extension ${extension.name} is disabled!`);
            disabledExtensions.push(extension.name);
          }
        });

        // Save disabled extensions to storage
        chrome.storage.local.set(
          { disabledExtensions: disabledExtensions },
          () => {
            if (chrome.runtime.lastError) {
              console.error(
                "Error saving disabledExtensions:",
                chrome.runtime.lastError
              );
            }
          }
        );
        updateBadge(disabledExtensions.length);
        updatePopupStatus(disabledExtensions, monitoredExtensions);

        // Send a single notification with the list of disabled extensions
        if (enableSystemNotifications && disabledExtensions.length > 0) {
          sendNotification(disabledExtensions);
        }
      });
    }
  );
}

// Function to send a system notification with a list of disabled extensions
function sendNotification(disabledExtensions) {
  if (disabledExtensions.length === 0) return; // No need to send a notification if no extensions are disabled

  const message =
    disabledExtensions.length === 1
      ? `Extension ${disabledExtensions[0]} is turned off!`
      : `Extensions turned off: ${disabledExtensions.join(", ")}`;

  chrome.notifications.create(
    {
      type: "basic",
      iconUrl: "icon.png", // Ensure icon.png exists in the extension directory
      title: "Extension Disabled!",
      message: message,
      priority: 2,
    },
    (notificationId) => {
      if (chrome.runtime.lastError) {
        console.error("Error creating notification:", chrome.runtime.lastError);
      } else {
        console.log(`🔔 Notification sent: ${notificationId}`);
      }
    }
  );
}

// Function to update the badge on the extension icon
function updateBadge(count) {
  if (count > 0) {
    chrome.action.setBadgeText({ text: count.toString() });
    chrome.action.setBadgeBackgroundColor({ color: "#FF0000" }); // Red badge
  } else {
    chrome.action.setBadgeText({ text: "" }); // Hide badge if no extensions are disabled
  }
}

// Function to update the status in the popup
function updatePopupStatus(disabledExtensions, monitoredExtensions) {
  chrome.runtime.sendMessage(
    {
      action: "updateStatus",
      disabledExtensions: disabledExtensions,
      monitoredExtensions: monitoredExtensions,
    },
    (response) => {
      if (chrome.runtime.lastError) {
        console.log("Popup is closed, message not sent.");
      } else {
        console.log("Popup status updated.");
      }
    }
  );
}

// Listener for when an extension is disabled
chrome.management.onDisabled.addListener((extension) => {
  chrome.storage.local.get(
    ["monitoredExtensions", "enableSystemNotifications"],
    (data) => {
      if ((data.monitoredExtensions || []).includes(extension.id)) {
        console.log(`🔴 Extension ${extension.name} was disabled!`);

        chrome.storage.local.get("disabledExtensions", (data) => {
          let disabled = data.disabledExtensions || [];
          if (!disabled.includes(extension.name)) {
            disabled.push(extension.name);
            chrome.storage.local.set({ disabledExtensions: disabled }, () => {
              if (chrome.runtime.lastError) {
                console.error(
                  "Error saving disabledExtensions:",
                  chrome.runtime.lastError
                );
              }
            });
            updateBadge(disabled.length);
            updatePopupStatus(disabled, data.monitoredExtensions || []);

            // Send a single notification with the updated list of disabled extensions
            if (data.enableSystemNotifications) {
              sendNotification(disabled);
            }
          }
        });
      }
    }
  );
});

// Listener for when an extension is enabled
chrome.management.onEnabled.addListener((extension) => {
  chrome.storage.local.get(
    ["monitoredExtensions", "disabledExtensions"],
    (data) => {
      if ((data.monitoredExtensions || []).includes(extension.id)) {
        console.log(`🟢 Extension ${extension.name} is enabled!`);
        let disabled = data.disabledExtensions || [];
        let index = disabled.indexOf(extension.name);
        if (index !== -1) {
          disabled.splice(index, 1);
          chrome.storage.local.set({ disabledExtensions: disabled }, () => {
            if (chrome.runtime.lastError) {
              console.error(
                "Error saving disabledExtensions:",
                chrome.runtime.lastError
              );
            }
          });
          updateBadge(disabled.length);
          updatePopupStatus(disabled, data.monitoredExtensions || []);

          // If there are still disabled extensions, send an updated notification
          if (data.enableSystemNotifications && disabled.length > 0) {
            sendNotification(disabled);
          }
        }
      }
    }
  );
});

// Function to start periodic notifications
function startPeriodicNotifications() {
  chrome.storage.local.get(
    ["enableSystemNotifications", "notificationFrequency"],
    (data) => {
      if (data.enableSystemNotifications) {
        const frequency = data.notificationFrequency || 15; // Default: 15 seconds
        if (notificationInterval) {
          clearInterval(notificationInterval);
        }
        notificationInterval = setInterval(() => {
          checkExtensions();
        }, frequency * 1000); // Convert seconds to milliseconds
      }
    }
  );
}

// Start periodic notifications on extension load
startPeriodicNotifications();

// Update notification interval when settings change
chrome.storage.onChanged.addListener((changes) => {
  if (changes.enableSystemNotifications || changes.notificationFrequency) {
    startPeriodicNotifications();
  }
});

// Listener for messages from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "checkExtensions") {
    checkExtensions();
    sendResponse({ success: true });
  }
});
