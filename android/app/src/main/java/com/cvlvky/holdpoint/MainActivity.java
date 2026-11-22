package com.cvlvky.holdpoint;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // HoldPoint's own plugin: in-app updates
        registerPlugin(UpdaterPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
