# Extension Monitoring Chrome Extension

## Overview
This Chrome extension monitors the status of specific extensions installed in the browser. It provides real-time notifications if any monitored extension is disabled. The extension also displays a status message indicating whether all monitored extensions are active or if any are disabled.

## Installation Guide
1. **Download the Source Code**: Clone or download the extension source files to your local machine.
2. **Open Chrome Extensions Page**:
   - Open Google Chrome.
   - Type `chrome://extensions/` in the address bar and press Enter.
3. **Enable Developer Mode**:
   - Toggle the switch in the top right corner to enable Developer Mode.
4. **Load the Extension**:
   - Click on "Load unpacked".
   - Select the folder where the extension files are located.
5. **Extension is Ready**:
   - The extension will now appear in the extensions list and be available for use.

## Usage Guide
1. **Open the Extension**:
   - Click on the extension icon in the Chrome toolbar.
2. **Adding Extensions to Monitor**:
   - Click on the settings icon (⚙️) in the top right corner.
   - Enter the extension IDs of the extensions you want to monitor (one per line).
   - Click the "Save" button.
   - A success message will confirm that the settings are saved.
3. **Viewing Status**:
   - If there are no monitored extensions, a message will indicate that the list is empty.
   - If all monitored extensions are active, a green message will indicate this.
   - If any monitored extensions are disabled, a red message will display their names.
4. **Modifying the List**:
   - Open the settings screen.
   - Edit or remove extension IDs as needed.
   - Click "Save" to update the list.
5. **Real-time Monitoring**:
   - The extension continuously checks the status of the monitored extensions.
   - If an extension is disabled, a browser notification (if enabled) and a red badge on the extension icon will alert you.
   - If all monitored extensions are enabled, the red badge disappears.

The extension ensures you are always aware of the status of your critical browser extensions!

## Troubleshooting & Possible Issues

### 1. System Notifications Are Not Displayed
If system notifications do not appear when an extension is disabled, ensure your operating system allows Chrome to display notifications.

#### macOS:
1. Open **System Settings**.
2. Go to **Notifications & Focus**.
3. Scroll down to find **Google Chrome**.
4. Ensure that **Allow Notifications** is enabled.

#### Windows:
1. Open **Settings**.
2. Navigate to **System > Notifications & actions**.
3. Find **Google Chrome** in the list.
4. Make sure notifications are turned on.

### 2. How to Find Extension IDs
To add an extension to the monitoring list, you need its unique ID:
1. Open `chrome://extensions/`.
2. Enable **Developer Mode** (top-right toggle).
3. Find the extension you want to monitor.
4. Copy the **ID** (a long alphanumeric string under the extension name).
5. Paste it into the monitoring list in the extension settings.

### 3. The Extension Badge Shows an Error Even When Everything Is Enabled
If the red error badge remains on the extension icon after enabling all monitored extensions:
- Try reopening the extension popup to refresh the status.
- Go to settings, verify the monitored extensions list, and re-save.
- Disable and re-enable the extension from `chrome://extensions/`.

### 4. Changes Do Not Reflect Immediately
If the popup does not update correctly after modifying settings:
- Close and reopen the popup.
- Ensure Chrome's storage is updating correctly by refreshing `chrome://extensions/`.