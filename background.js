chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension monitoring started");
  checkExtensions();
  setInterval(checkExtensions, 60000); // Проверка каждую минуту
});

// Функция для проверки состояния расширений
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

            if (enableSystemNotifications) {
              sendNotification(extension.name); // Создаем уведомление, если включены системные уведомления
            }
          }
        });

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
        updateBadge(disabledExtensions.length); // Обновляем бейдж
      });
    }
  );
}

// Функция для отправки уведомлений
function sendNotification(extensionName) {
  chrome.notifications.create(
    {
      type: "basic",
      iconUrl: "icon.png", // Убедитесь, что файл icon.png существует
      title: "Extension Disabled!",
      message: `Extension ${extensionName} is turned off!`, // Используем extensionName вместо extension
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

// Функция для обновления бейджа
function updateBadge(count) {
  if (count > 0) {
    chrome.action.setBadgeText({ text: count.toString() });
    chrome.action.setBadgeBackgroundColor({ color: "#FF0000" }); // Красный цвет бейджа
  } else {
    chrome.action.setBadgeText({ text: "" }); // Скрываем бейдж, если нет отключенных расширений
  }
}

// Слушатель для события отключения расширения
chrome.management.onDisabled.addListener((extension) => {
  chrome.storage.local.get(
    ["monitoredExtensions", "enableSystemNotifications"],
    (data) => {
      if ((data.monitoredExtensions || []).includes(extension.id)) {
        console.log(`🔴 Extension ${extension.name} was disabled!`);

        if (data.enableSystemNotifications) {
          sendNotification(extension.name); // Создаем уведомление, если включены системные уведомления
        }

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
            updateBadge(disabled.length); // Обновляем бейдж
          }
        });
      }
    }
  );
});

// Слушатель для события включения расширения
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
          updateBadge(disabled.length); // Обновляем бейдж
        }
      }
    }
  );
});

// Обработчик сообщений из popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "updateBadge") {
    updateBadge(message.count); // Обновляем бейдж
  } else if (message.action === "checkExtensions") {
    checkExtensions(); // Проверяем состояние расширений
  }
});

// Периодические уведомления
function startPeriodicNotifications() {
  setInterval(() => {
    chrome.storage.local.get(
      ["monitoredExtensions", "enableSystemNotifications"],
      (data) => {
        if (data.enableSystemNotifications) {
          checkExtensions(); // Проверяем состояние расширений и показываем уведомления
        }
      }
    );
  }, 3600000); // Уведомления каждые 60 минут (3600000 мс)
}

startPeriodicNotifications(); // Запускаем периодические уведомления
