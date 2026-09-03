package com.nocontacttracker.app;

import android.app.Activity;
import android.view.View;
import android.view.Window;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * System-bar appearance bridge built on the modern AndroidX WindowInsets APIs.
 *
 * The app's light/dark preference lives in the web layer and is independent of
 * the OS setting, so the native theme qualifiers (values / values-night) can
 * only provide the correct icon contrast at cold start. Once the web layer
 * boots it calls setAppearance() to keep the status/navigation bar icons in
 * sync with the in-app theme.
 *
 * Uses WindowInsetsControllerCompat only — no deprecated statusBarColor,
 * navigationBarColor or SYSTEM_UI_FLAG_* APIs. The bars themselves stay
 * transparent (edge-to-edge); only the icon tint is controlled here.
 */
@CapacitorPlugin(name = "SystemBars")
public class SystemBarsPlugin extends Plugin {

    @PluginMethod
    public void setAppearance(final PluginCall call) {
        final boolean dark = Boolean.TRUE.equals(call.getBoolean("dark", false));
        final Activity activity = getActivity();
        if (activity == null) {
            call.reject("No activity");
            return;
        }
        activity.runOnUiThread(() -> {
            applyAppearance(activity, dark);
            call.resolve();
        });
    }

    /**
     * Dark UI -> light (white) system-bar icons; light UI -> dark icons.
     */
    static void applyAppearance(Activity activity, boolean dark) {
        Window window = activity.getWindow();
        if (window == null) return;
        View decor = window.getDecorView();
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(window, decor);
        controller.setAppearanceLightStatusBars(!dark);
        controller.setAppearanceLightNavigationBars(!dark);
    }
}
