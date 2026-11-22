/* Native bridge: bundled with esbuild into www/native.js and exposed as window.Native. */
import { Capacitor, CapacitorHttp, SystemBars, SystemBarsStyle, SystemBarType, registerPlugin } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Clipboard } from "@capacitor/clipboard";
import { Filesystem, Directory, Encoding } from "@capacitor/filesystem";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Share } from "@capacitor/share";

// HoldPoint's own Android plugin (UpdaterPlugin.java): downloads a new APK and opens the installer
const Updater = registerPlugin("Updater");

window.Native = {
  isNative: Capacitor.isNativePlatform(),
  platform: Capacitor.getPlatform(),
  Http: CapacitorHttp,
  SystemBars, SystemBarsStyle, SystemBarType,
  App, Browser, Clipboard, Filesystem, Directory, Encoding, LocalNotifications, Share, Updater
};
