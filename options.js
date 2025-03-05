document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get(
    ["monitoredExtensions", "enableSystemNotifications"],
    (data) => {
      document.getElementById("extensionsList").value = (
        data.monitoredExtensions || []
      ).join("\n");
      document.getElementById("enableNotifications").checked =
        data.enableSystemNotifications || false;
    }
  );

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
        alert("Настройки сохранены!");
      }
    );
  });
});
