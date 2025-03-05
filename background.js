chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension monitoring started");
  checkExtensions();
  setInterval(checkExtensions, 60000);
});

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
            console.log(`⚠️ Extension ${extension.name} is disabled!`);
            disabledExtensions.push(extension.name);

            if (enableSystemNotifications) {
              chrome.notifications.create(
                {
                  type: "basic",
                  iconUrl: "icon.png",
                  title: "Extension Disabled!",
                  message: `Extension ${extension.name} is turned off!`,
                  priority: 2,
                },
                (notificationId) => {
                  console.log(`🔔 Notification sent: ${notificationId}`);
                }
              );
            }
          }
        });

        chrome.storage.local.set(
          { disabledExtensions: disabledExtensions },
          () => {
            updateBadge(disabledExtensions.length);
          }
        );
      });
    }
  );
}

// 🔄 **Function to update the extension icon badge**
function updateBadge(disabledCount) {
  if (disabledCount > 0) {
    chrome.action.setBadgeText({ text: disabledCount.toString() });
    chrome.action.setBadgeBackgroundColor({ color: "#FF0000" });
  } else {
    chrome.action.setBadgeText({ text: "" });
  }
}

// 📌 **When an extension is disabled**
chrome.management.onDisabled.addListener((extension) => {
  chrome.storage.local.get(
    ["monitoredExtensions", "enableSystemNotifications"],
    (data) => {
      if ((data.monitoredExtensions || []).includes(extension.id)) {
        console.log(`🔴 Extension ${extension.name} was disabled!`);

        if (data.enableSystemNotifications) {
          chrome.notifications.create(
            {
              type: "basic",
              iconUrl: "icon.png",
              title: "Extension Disabled!",
              message: `Extension ${extension.name} is turned off!`,
              priority: 2,
            },
            (notificationId) => {
              console.log(`🔔 Notification sent: ${notificationId}`);
            }
          );
        }

        chrome.storage.local.get("disabledExtensions", (data) => {
          let disabled = data.disabledExtensions || [];
          if (!disabled.includes(extension.name)) {
            disabled.push(extension.name);
            chrome.storage.local.set({ disabledExtensions: disabled }, () => {
              updateBadge(disabled.length);
            });
          }
        });
      }
    }
  );
});

// ✅ **When an extension is enabled**
chrome.management.onEnabled.addListener((extension) => {
  chrome.storage.local.get(
    ["monitoredExtensions", "disabledExtensions"],
    (data) => {
      let monitoredExtensions = data.monitoredExtensions || [];
      let disabled = data.disabledExtensions || [];

      if (monitoredExtensions.includes(extension.id)) {
        console.log(`🟢 Extension ${extension.name} is enabled!`);
        let index = disabled.indexOf(extension.name);
        if (index !== -1) {
          disabled.splice(index, 1);
          chrome.storage.local.set({ disabledExtensions: disabled }, () => {
            updateBadge(disabled.length);
          });
        }
      }
    }
  );
});

// 🚀 **Update badge when settings change**
chrome.storage.onChanged.addListener((changes, area) => {
  if (
    area === "local" &&
    (changes.monitoredExtensions || changes.disabledExtensions)
  ) {
    checkExtensions();
  }
});
