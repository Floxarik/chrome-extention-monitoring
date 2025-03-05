document.addEventListener("DOMContentLoaded", () => {
  const mainScreen = document.getElementById("main-screen");
  const settingsScreen = document.getElementById("settings-screen");
  const notification = document.getElementById("notification");
  const successMessage = document.getElementById("success-message");

  document.getElementById("open-settings").addEventListener("click", () => {
    mainScreen.classList.add("hidden");
    settingsScreen.classList.remove("hidden");
  });

  document.getElementById("back").addEventListener("click", () => {
    settingsScreen.classList.add("hidden");
    mainScreen.classList.remove("hidden");
    successMessage.style.display = "none";
    loadSettings(); // Загружаем актуальные данные при возврате
  });

  function loadSettings() {
    chrome.storage.local.get(
      [
        "disabledExtensions",
        "monitoredExtensions",
        "enableSystemNotifications",
      ],
      (data) => {
        let monitoredExtensions = data.monitoredExtensions || [];
        let disabledExtensions = data.disabledExtensions || [];

        document.getElementById("extensionsList").value =
          monitoredExtensions.join("\n");
        document.getElementById("enableNotifications").checked =
          data.enableSystemNotifications || false;

        updateStatusMessage(disabledExtensions, monitoredExtensions);
      }
    );
  }

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
        successMessage.style.display = "inline";
        setTimeout(() => {
          successMessage.style.display = "none";
        }, 2000);
        updateStatusMessage([], extensions);
      }
    );
  });

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

  loadSettings();
});
