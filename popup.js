document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.local.get("disabledExtensions", (data) => {
    const notification = document.getElementById("notification");
    if (data.disabledExtensions && data.disabledExtensions.length > 0) {
      notification.style.display = "block";
      notification.innerHTML =
        "Выключены: <br>" + data.disabledExtensions.join("<br>");
    } else {
      notification.style.display = "none";
    }
  });

  document.getElementById("close").addEventListener("click", () => {
    window.close();
  });
});
