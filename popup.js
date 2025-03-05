document.addEventListener("DOMContentLoaded", () => {
  const mainScreen = document.getElementById("main-screen");
  const settingsScreen = document.getElementById("settings-screen");
  const notification = document.getElementById("notification");
  const saveMessage = document.getElementById("saveMessage");

  // Open settings screen
  document.getElementById("open-settings").addEventListener("click", () => {
    mainScreen.classList.add("hidden");
    settingsScreen.classList.remove("hidden");
  });

  // Return to the main screen
  document.getElementById("back").addEventListener("click", () => {
    settingsScreen.classList.add("hidden");
    mainScreen.classList.remove("hidden");
  });

  // Load saved settings
  chrome.storage.local.get(
    ["disabledExtensions", "monitoredExtensions", "enableSystemNotifications"],
    (data) => {
      if (data.disabledExtensions && data.disabledExtensions.length > 0) {
        notification.style.display = "block";
        notification.innerHTML =
          "Disabled extensions:<br>" + data.disabledExtensions.join("<br>");
      } else {
        notification.style.display = "none";
      }

      document.getElementById("extensionsList").value = (
        data.monitoredExtensions || []
      ).join("\n");
      document.getElementById("enableNotifications").checked =
        data.enableSystemNotifications || false;
    }
  );

  // Save settings
  document.getElementById("save").addEventListener("click", () => {
    let extensions = document
      .getElementById("extensionsList")
      .value.split("\n")
      .map((id) => id.trim())
      .filter((id) => id);
    let enableNotifications = document.getElementById(
      "enableNotifications"
    ).checked;

    chrome.storage.local.set(
      {
        monitoredExtensions: extensions,
        enableSystemNotifications: enableNotifications,
      },
      () => {
        console.log("✅ Settings saved.");

        // Remove deleted extensions from the disabled list
        chrome.storage.local.get("disabledExtensions", (data) => {
          let disabled = data.disabledExtensions || [];
          let updatedDisabled = disabled.filter((name) =>
            extensions.includes(name)
          );

          chrome.storage.local.set(
            { disabledExtensions: updatedDisabled },
            () => {
              console.log("🔄 Disabled extensions list updated.");
              updatePopupDisplay();

              // Show "Settings saved" message
              saveMessage.style.display = "block";
              setTimeout(() => (saveMessage.style.display = "none"), 2000);
            }
          );
        });
      }
    );
  });

  // Function to update the popup display
  function updatePopupDisplay() {
    chrome.storage.local.get("disabledExtensions", (data) => {
      if (data.disabledExtensions && data.disabledExtensions.length > 0) {
        notification.style.display = "block";
        notification.innerHTML =
          "Disabled extensions:<br>" + data.disabledExtensions.join("<br>");
      } else {
        notification.style.display = "none";
      }
    });
  }
});
