document.addEventListener("DOMContentLoaded", () => {
  const mainScreen = document.getElementById("main-screen");
  const settingsScreen = document.getElementById("settings-screen");
  const notification = document.getElementById("notification");
  const successMessage = document.getElementById("success-message");
  const enableNotificationsCheckbox = document.getElementById(
    "enableNotifications"
  );
  const notificationFrequencyContainer = document.getElementById(
    "notificationFrequencyContainer"
  );

  // Show/hide notification frequency input based on checkbox state
  enableNotificationsCheckbox.addEventListener("change", () => {
    if (enableNotificationsCheckbox.checked) {
      notificationFrequencyContainer.style.display = "block";
    } else {
      notificationFrequencyContainer.style.display = "none";
    }
  });

  // Open settings screen
  document.getElementById("open-settings").addEventListener("click", () => {
    mainScreen.classList.add("hidden");
    settingsScreen.classList.remove("hidden");
  });

  // Go back to main screen
  document.getElementById("back").addEventListener("click", () => {
    settingsScreen.classList.add("hidden");
    mainScreen.classList.remove("hidden");
    successMessage.style.display = "none";
    loadSettings();
  });

  // Load settings from storage
  function loadSettings() {
    chrome.storage.local.get(
      [
        "disabledExtensions",
        "monitoredExtensions",
        "enableSystemNotifications",
        "notificationFrequency",
      ],
      (data) => {
        let monitoredExtensions = data.monitoredExtensions || [];
        let disabledExtensions = data.disabledExtensions || [];
        let enableSystemNotifications = data.enableSystemNotifications || false;
        let notificationFrequency = data.notificationFrequency || 15; // Default: 15 seconds

        document.getElementById("extensionsList").value =
          monitoredExtensions.join("\n");
        document.getElementById("enableNotifications").checked =
          enableSystemNotifications;
        document.getElementById("notificationFrequency").value =
          notificationFrequency;

        // Show/hide frequency input based on checkbox state
        if (enableSystemNotifications) {
          notificationFrequencyContainer.style.display = "block";
        } else {
          notificationFrequencyContainer.style.display = "none";
        }

        updateStatusMessage(disabledExtensions, monitoredExtensions);
      }
    );
  }

  // Save settings
  document.getElementById("save").addEventListener("click", () => {
    let extensions = document
      .getElementById("extensionsList")
      .value.split("\n")
      .map((id) => id.trim())
      .filter((id) => id); // Remove empty lines
    let enableNotifications = document.getElementById(
      "enableNotifications"
    ).checked;
    let notificationFrequency = parseInt(
      document.getElementById("notificationFrequency").value,
      10
    );

    // Validate notification frequency input
    if (
      isNaN(notificationFrequency) ||
      notificationFrequency < 10 ||
      notificationFrequency > 3600
    ) {
      notificationFrequency = 15; // Default: 15 seconds
    }

    // Save settings to storage
    chrome.storage.local.set(
      {
        monitoredExtensions: extensions,
        enableSystemNotifications: enableNotifications,
        notificationFrequency: notificationFrequency,
      },
      () => {
        successMessage.style.display = "inline"; // Show success message
        setTimeout(() => {
          successMessage.style.display = "none";
        }, 2000);

        // Check extensions after saving settings
        chrome.runtime.sendMessage(
          { action: "checkExtensions" },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error(
                "Error sending message to background.js:",
                chrome.runtime.lastError
              );
            } else {
              console.log("Message sent to background.js successfully.");
            }
          }
        );
      }
    );
  });

  // Update the status message in the popup
  function updateStatusMessage(disabledExtensions, monitoredExtensions) {
    if (!monitoredExtensions.length) {
      notification.innerText = "⚠ No monitored extensions.";
      notification.style.color = "#cc0000";
    } else if (!disabledExtensions.length) {
      notification.innerText = "✅ All monitored extensions are active.";
      notification.style.color = "#28a745";
    } else {
      notification.innerText = "❌ Disabled: " + disabledExtensions.join(", ");
      notification.style.color = "#cc0000";
    }
  }

  // Listener for messages from background.js
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "updateStatus") {
      updateStatusMessage(
        message.disabledExtensions,
        message.monitoredExtensions
      );
      sendResponse({ success: true });
    }
  });

  // Load settings when the popup opens
  loadSettings();
});
