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
  const notificationFrequencyInput = document.getElementById(
    "notificationFrequency"
  );

  // Показываем/скрываем поле ввода частоты уведомлений
  enableNotificationsCheckbox.addEventListener("change", () => {
    if (enableNotificationsCheckbox.checked) {
      notificationFrequencyContainer.style.display = "block";
    } else {
      notificationFrequencyContainer.style.display = "none";
    }
  });

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
        "notificationFrequency",
      ],
      (data) => {
        let monitoredExtensions = data.monitoredExtensions || [];
        let disabledExtensions = data.disabledExtensions || [];
        let enableSystemNotifications = data.enableSystemNotifications || false;
        let notificationFrequency = data.notificationFrequency || 15; // Дефолтное значение: 15 секунд

        document.getElementById("extensionsList").value =
          monitoredExtensions.join("\n");
        document.getElementById("enableNotifications").checked =
          enableSystemNotifications;
        document.getElementById("notificationFrequency").value =
          notificationFrequency;

        // Показываем/скрываем поле ввода частоты уведомлений
        if (enableSystemNotifications) {
          notificationFrequencyContainer.style.display = "block";
        } else {
          notificationFrequencyContainer.style.display = "none";
        }

        updateStatusMessage(disabledExtensions, monitoredExtensions);
      }
    );
  }

  document.getElementById("save").addEventListener("click", () => {
    let extensions = document
      .getElementById("extensionsList")
      .value.split("\n")
      .map((id) => id.trim())
      .filter((id) => id); // Удалена валидация на правильность ввода ID
    let enableNotifications = document.getElementById(
      "enableNotifications"
    ).checked;
    let notificationFrequency = parseInt(
      document.getElementById("notificationFrequency").value,
      10
    );

    // Проверка ввода частоты уведомлений
    if (
      isNaN(notificationFrequency) ||
      notificationFrequency < 10 ||
      notificationFrequency > 3600
    ) {
      notificationFrequency = 15; // Дефолтное значение, если введено некорректное значение
    }

    chrome.storage.local.set(
      {
        monitoredExtensions: extensions,
        enableSystemNotifications: enableNotifications,
        notificationFrequency: notificationFrequency,
      },
      () => {
        successMessage.style.display = "inline"; // Показываем сообщение об успехе
        setTimeout(() => {
          successMessage.style.display = "none";
        }, 2000);

        // После сохранения настроек проверяем состояние расширений
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

  // Обработчик сообщений из background.js
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "updateStatus") {
      updateStatusMessage(
        message.disabledExtensions,
        message.monitoredExtensions
      );
      sendResponse({ success: true }); // Отправляем ответ, чтобы избежать ошибки
    }
  });

  loadSettings();
});
