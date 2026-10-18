package com.stockflow.app;

import android.os.Bundle;
import android.view.View;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Ensure Android 3-button navigation, gesture bar, and status bar do not overlap webview content
        View contentView = findViewById(android.R.id.content);
        if (contentView != null) {
            ViewCompat.setOnApplyWindowInsetsListener(contentView, (view, windowInsets) -> {
                Insets insets = windowInsets.getInsets(
                    WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
                );
                boolean keyboardVisible = windowInsets.isVisible(WindowInsetsCompat.Type.ime());
                int bottomPadding = keyboardVisible ? 0 : insets.bottom;
                view.setPadding(insets.left, insets.top, insets.right, bottomPadding);
                return windowInsets;
            });
            ViewCompat.requestApplyInsets(contentView);
        }
    }
}

