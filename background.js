let notificationInterval = null;

chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension monitoring started");
  checkExtensions();
  startPeriodicNotifications(); // Запускаем периодические уведомления
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
        updatePopupStatus(disabledExtensions, monitoredExtensions); // Обновляем статус в popup
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
      message: `Extension ${extensionName} is turned off!`,
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

// Функция для обновления статуса в popup
function updatePopupStatus(disabledExtensions, monitoredExtensions) {
  chrome.runtime.sendMessage(
    {
      action: "updateStatus",
      disabledExtensions: disabledExtensions,
      monitoredExtensions: monitoredExtensions,
    },
    (response) => {
      if (chrome.runtime.lastError) {
        // Ошибка возникает, если popup закрыт
        console.log("Popup is closed, message not sent.");
      } else {
        console.log("Popup status updated.");
      }
    }
  );
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
            updatePopupStatus(disabled, data.monitoredExtensions || []); // Обновляем статус в popup
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
          updatePopupStatus(disabled, data.monitoredExtensions || []); // Обновляем статус в popup
        }
      }
    }
  );
});

// Периодические уведомления
function startPeriodicNotifications() {
  chrome.storage.local.get(
    ["enableSystemNotifications", "notificationFrequency"],
    (data) => {
      if (data.enableSystemNotifications) {
        const frequency = data.notificationFrequency || 15; // Дефолтное значение: 15 секунд
        if (notificationInterval) {
          clearInterval(notificationInterval); // Очищаем предыдущий интервал
        }
        notificationInterval = setInterval(() => {
          checkExtensions(); // Проверяем состояние расширений и показываем уведомления
        }, frequency * 1000); // Преобразуем секунды в миллисекунды
      }
    }
  );
}

// Запускаем периодические уведомления при старте
startPeriodicNotifications();

// Обновляем интервал при изменении настроек
chrome.storage.onChanged.addListener((changes) => {
  if (changes.enableSystemNotifications || changes.notificationFrequency) {
    startPeriodicNotifications(); // Перезапускаем интервал при изменении настроек
  }
});

// Обработчик сообщений из popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "checkExtensions") {
    checkExtensions(); // Проверяем состояние расширений
    sendResponse({ success: true }); // Отправляем ответ, чтобы избежать ошибки
  }
});
