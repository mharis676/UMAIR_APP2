package com.stockflow.app;

import static org.junit.Assert.*;

import android.app.Activity;
import android.app.Instrumentation;
import android.content.Intent;
import android.content.pm.ActivityInfo;
import android.graphics.Bitmap;
import android.view.WindowInsets;
import android.webkit.WebView;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.io.File;
import java.io.FileOutputStream;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import org.json.JSONObject;
import org.json.JSONTokener;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public class SystemBarsLayoutTest {
    private final Instrumentation instrumentation = InstrumentationRegistry.getInstrumentation();

    private JSONObject evaluate(WebView webView, String expression) throws Exception {
        CountDownLatch latch = new CountDownLatch(1);
        String[] value = new String[1];
        instrumentation.runOnMainSync(() -> webView.evaluateJavascript(expression, result -> { value[0] = result; latch.countDown(); }));
        assertTrue("WebView evaluation timed out", latch.await(10, TimeUnit.SECONDS));
        Object decoded = new JSONTokener(value[0]).nextValue();
        return new JSONObject(decoded.toString());
    }

    @Test
    public void contentAndPickerStayInsideSystemBarsInBothOrientations() throws Exception {
        Intent intent = new Intent(instrumentation.getTargetContext(), MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        MainActivity activity = (MainActivity) instrumentation.startActivitySync(intent);
        try {
            WebView webView = activity.getBridge().getWebView();
            for (int orientation : new int[]{ActivityInfo.SCREEN_ORIENTATION_PORTRAIT, ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE}) {
                instrumentation.runOnMainSync(() -> activity.setRequestedOrientation(orientation));
                JSONObject layout = null;
                for (int attempt = 0; attempt < 100; attempt++) {
                    Thread.sleep(150);
                    layout = evaluate(webView, "JSON.stringify({ready:!!document.querySelector('.stock-app'),landscape:innerWidth>innerHeight})");
                    if (layout.optBoolean("ready") && layout.optBoolean("landscape") == (orientation == ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE)) break;
                }
                assertTrue("App must load", layout.getBoolean("ready"));
                assertEquals("Requested orientation must be applied", orientation == ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE, layout.getBoolean("landscape"));
                Thread.sleep(500);
                JSONObject measured = evaluate(webView, "(() => {window.scrollTo(0,0);const h=document.querySelector('header').getBoundingClientRect();return JSON.stringify({top:h.top,left:h.left,right:h.right,width:innerWidth,height:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth});})()");
                int[] position = new int[2];
                android.graphics.Insets[] bars = new android.graphics.Insets[1];
                instrumentation.runOnMainSync(() -> {
                    webView.getLocationOnScreen(position);
                    bars[0] = activity.getWindow().getDecorView().getRootWindowInsets().getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
                });
                float density = activity.getResources().getDisplayMetrics().density;
                android.util.Log.i("StockTrackLayout", "orientation=" + orientation + " bounds=" + measured + " bars=" + bars[0]);
                assertFalse("No horizontal overflow", measured.getBoolean("overflow"));
                assertTrue("Header below status bar and cutout", position[1] + measured.getDouble("top") * density >= bars[0].top - 2);
                assertTrue("Header clear of left cutout", position[0] + measured.getDouble("left") * density >= bars[0].left - 2);
                JSONObject footer = evaluate(webView, "(() => {window.scrollTo(0,document.body.scrollHeight);return JSON.stringify({bottom:document.querySelector('.device-note').getBoundingClientRect().bottom});})()");
                int screenHeight = activity.getWindow().getDecorView().getHeight();
                assertTrue("Footer clear of Android navigation", position[1] + footer.getDouble("bottom") * density <= screenHeight - bars[0].bottom + 2);
                evaluate(webView, "(() => {document.querySelector('nav button:nth-child(2)').click();return JSON.stringify({ok:true});})()");
                Thread.sleep(200);
                evaluate(webView, "(() => {document.querySelector('.batch-item .picker-trigger').click();return JSON.stringify({ok:true});})()");
                Thread.sleep(250);
                JSONObject picker = evaluate(webView, "(() => {const d=document.querySelector('dialog').getBoundingClientRect();return JSON.stringify({top:d.top,bottom:d.bottom,left:d.left,right:d.right});})()");
                assertTrue("Picker below status bar", position[1] + picker.getDouble("top") * density >= bars[0].top - 2);
                assertTrue("Picker above system navigation", position[1] + picker.getDouble("bottom") * density <= screenHeight - bars[0].bottom + 2);
                Bitmap screenshot = instrumentation.getUiAutomation().takeScreenshot();
                File output = new File(instrumentation.getTargetContext().getExternalCacheDir(), "safe-area-" + orientation + ".png");
                try (FileOutputStream stream = new FileOutputStream(output)) { screenshot.compress(Bitmap.CompressFormat.PNG, 100, stream); }
                screenshot.recycle();
                evaluate(webView, "(() => {document.querySelector('[aria-label=\"Close selection\"]').click();return JSON.stringify({ok:true});})()");
            }
        } finally { instrumentation.runOnMainSync(activity::finish); }
    }
}
