package com.cvlvky.holdpoint;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/** In-app updates: downloads a newer HoldPoint APK and hands it to Android's installer. */
@CapacitorPlugin(name = "Updater")
public class UpdaterPlugin extends Plugin {

    static File updatesDir(Context ctx) {
        File dir = new File(ctx.getCacheDir(), "updates");
        if (!dir.exists()) dir.mkdirs();
        return dir;
    }

    /** Downloads the APK (reporting "updateProgress"), then starts the install. */
    @PluginMethod
    public void downloadUpdate(final PluginCall call) {
        final String url = call.getString("url", "");
        final String name = call.getString("name", "update.apk").replaceAll("[^A-Za-z0-9._-]", "_");
        if (url == null || !url.startsWith("https://")) {
            call.reject("Bad update link");
            return;
        }
        new Thread(new Runnable() {
            @Override
            public void run() {
                HttpURLConnection c = null;
                try {
                    File dir = updatesDir(getContext());
                    File[] old = dir.listFiles();
                    if (old != null) for (File f : old) f.delete();
                    File out = new File(dir, name);
                    String link = url;
                    // follow GitHub's redirects to its download servers
                    for (int hop = 0; hop < 6; hop++) {
                        c = (HttpURLConnection) new URL(link).openConnection();
                        c.setInstanceFollowRedirects(false);
                        c.setConnectTimeout(20000);
                        c.setReadTimeout(30000);
                        c.setRequestProperty("Accept", "application/octet-stream");
                        int code = c.getResponseCode();
                        if (code >= 300 && code < 400 && c.getHeaderField("Location") != null) {
                            link = new URL(new URL(link), c.getHeaderField("Location")).toString();
                            c.disconnect();
                            c = null;
                            continue;
                        }
                        if (code != 200) throw new Exception("HTTP " + code);
                        break;
                    }
                    if (c == null) throw new Exception("Too many redirects");
                    long total = c.getContentLengthLong();
                    InputStream in = c.getInputStream();
                    FileOutputStream os = new FileOutputStream(out);
                    byte[] buf = new byte[65536];
                    long got = 0;
                    int n;
                    int last = -1;
                    while ((n = in.read(buf)) > 0) {
                        os.write(buf, 0, n);
                        got += n;
                        if (total > 0) {
                            int pct = (int) (got * 100 / total);
                            if (pct != last) {
                                last = pct;
                                JSObject p = new JSObject();
                                p.put("pct", pct);
                                notifyListeners("updateProgress", p);
                            }
                        }
                    }
                    os.close();
                    in.close();
                    if (total > 0 && got < total) throw new Exception("Download incomplete");
                    JSObject r = new JSObject();
                    r.put("name", name);
                    r.put("status", startInstall(out) ? "installing" : "permission");
                    call.resolve(r);
                } catch (Exception e) {
                    call.reject("Download failed: " + e.getMessage());
                } finally {
                    if (c != null) c.disconnect();
                }
            }
        }).start();
    }

    /** Opens the installer again for an APK that is already downloaded. */
    @PluginMethod
    public void installUpdate(PluginCall call) {
        String name = call.getString("name", "").replaceAll("[^A-Za-z0-9._-]", "_");
        File f = new File(updatesDir(getContext()), name);
        if (name.isEmpty() || !f.exists()) {
            call.reject("Not downloaded");
            return;
        }
        try {
            JSObject r = new JSObject();
            r.put("name", name);
            r.put("status", startInstall(f) ? "installing" : "permission");
            call.resolve(r);
        } catch (Exception e) {
            call.reject("Install failed");
        }
    }

    /** Android 8+: the first time, the user has to allow HoldPoint to install updates. */
    boolean startInstall(File apk) {
        Context ctx = getContext();
        if (Build.VERSION.SDK_INT >= 26 && !ctx.getPackageManager().canRequestPackageInstalls()) {
            Intent s = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + ctx.getPackageName()));
            s.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            ctx.startActivity(s);
            return false;
        }
        Uri uri = FileProvider.getUriForFile(ctx, ctx.getPackageName() + ".fileprovider", apk);
        Intent i = new Intent(Intent.ACTION_VIEW);
        i.setDataAndType(uri, "application/vnd.android.package-archive");
        i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
        ctx.startActivity(i);
        return true;
    }
}
