package com.anonymous.Reverse_Engineering;

import android.util.Base64;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

public class ApiKeyModule extends ReactContextBaseJavaModule {
    public ApiKeyModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "ApiKeyModule";
    }

    private String decode(String value) {
        return new String(Base64.decode(value, Base64.DEFAULT));
    }

    @ReactMethod
    public void getApiKey(Promise promise) {
        try {
            String part1 = decode("OThkZWVjNzJlZjZiNzIyZDFmOGNlNWViMWFhMGIyMWY3M2E2NDkxNTU2Yw==");
            String part2 = decode("M2JjNzc3MWMzZjUwY2Q5ZTA2MTcwY2UzZDQ3MmNlZmIwZWI3NTE0N2YyYg==");
            String part3 = decode("MzIzMjQwNDc0MzYyNDU5MWYwNDVlNzk0ZjUwMzllOTYwYzI0MmNlNzNl");

            String apiKey = part1 + part2 + part3;
            promise.resolve(apiKey);
        } catch (Exception e) {
            promise.reject("API_KEY_ERROR", "Failed to load API key");
        }
    }
}