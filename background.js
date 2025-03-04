chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension monitoring started");
  checkExtensions();
  setInterval(checkExtensions, 60000);
});

// Список ID отслеживаемых расширений
const monitoredExtensions = ["EXTENSION_ID_1", "EXTENSION_ID_2"];

function checkExtensions() {
  chrome.management.getAll((extensions) => {
    let disabledExtensions = [];

    monitoredExtensions.forEach((extId) => {
      const extension = extensions.find((e) => e.id === extId);
      if (!extension) return;

      if (!extension.enabled) {
        console.log(`⚠️ Расширение ${extension.name} отключено!`);
        disabledExtensions.push(extension.name);
      }
    });

    chrome.storage.local.set({ disabledExtensions: disabledExtensions });
    updateBadge(disabledExtensions.length);
  });
}

// Показываем значок на иконке
function updateBadge(count) {
  if (count > 0) {
    chrome.action.setBadgeText({ text: count.toString() });
    chrome.action.setBadgeBackgroundColor({ color: "#FF0000" });
  } else {
    chrome.action.setBadgeText({ text: "" });
  }
}

// Когда расширение отключено
chrome.management.onDisabled.addListener((extension) => {
  if (monitoredExtensions.includes(extension.id)) {
    console.log(`🔴 Расширение ${extension.name} было отключено!`);
    chrome.storage.local.get("disabledExtensions", (data) => {
      let disabled = data.disabledExtensions || [];
      if (!disabled.includes(extension.name)) {
        disabled.push(extension.name);
        chrome.storage.local.set({ disabledExtensions: disabled });
        updateBadge(disabled.length);
      }
    });
  }
});

// Когда расширение включено
chrome.management.onEnabled.addListener((extension) => {
  if (monitoredExtensions.includes(extension.id)) {
    console.log(`🟢 Расширение ${extension.name} включено!`);
    chrome.storage.local.get("disabledExtensions", (data) => {
      let disabled = data.disabledExtensions || [];
      let index = disabled.indexOf(extension.name);
      if (index !== -1) {
        disabled.splice(index, 1);
        chrome.storage.local.set({ disabledExtensions: disabled });
        updateBadge(disabled.length);
      }
    });
  }
});
