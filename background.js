chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension monitoring started");
  checkExtensions();
  setInterval(checkExtensions, 60000); // Проверка каждую минуту
});

// Список ID расширений, за которыми следим
const monitoredExtensions = [
  "EXTENSION_ID_1", // Заменить на реальные ID расширений
  "EXTENSION_ID_2",
];

function checkExtensions() {
  chrome.management.getAll((extensions) => {
    monitoredExtensions.forEach((extId) => {
      const extension = extensions.find((e) => e.id === extId);
      if (!extension) {
        console.log(`❌ Расширение с ID ${extId} не найдено.`);
        return;
      }
      if (!extension.enabled) {
        console.log(`⚠️ Расширение ${extension.name} отключено!`);
        notifyDisabled(extension.name);
      } else {
        console.log(`✅ Расширение ${extension.name} активно.`);
      }
    });
  });
}

// Функция отправки уведомлений
function notifyDisabled(extName) {
  chrome.notifications.create(
    {
      type: "basic",
      iconUrl: "icon.png",
      title: "Расширение отключено",
      message: `Расширение '${extName}' отключено! Включите его в настройках.`,
      priority: 2,
    },
    (notificationId) => {
      if (chrome.runtime.lastError) {
        console.error("Ошибка создания уведомления:", chrome.runtime.lastError);
      } else {
        console.log(`🔔 Уведомление отправлено: ${notificationId}`);
      }
    }
  );
}

// Реагируем на отключение расширения
chrome.management.onDisabled.addListener((extension) => {
  if (monitoredExtensions.includes(extension.id)) {
    console.log(`🔴 Расширение ${extension.name} было отключено!`);
    notifyDisabled(extension.name);
  }
});
