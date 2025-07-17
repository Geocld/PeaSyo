package com.peasyo;

import android.app.Application;
import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint;
import com.facebook.react.defaults.DefaultReactNativeHost;
import com.facebook.soloader.SoLoader;
import com.peasyo.session.HolepunchPackage;
import com.peasyo.stream.StreamTextureViewPackage;
import com.peasyo.stream.StreamViewPackage;
import com.umeng.commonsdk.UMConfigure;

import com.peasyo.touchcontrols.AnalogStickPackage;
import com.peasyo.touchcontrols.ButtonViewPackage;

import android.util.Log;

import com.peasyo.registry.RegistryPackage;

import java.util.HashMap;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost =
      new DefaultReactNativeHost(this) {
        @Override
        public boolean getUseDeveloperSupport() {
          return BuildConfig.DEBUG;
        }

        @Override
        protected List<ReactPackage> getPackages() {
          @SuppressWarnings("UnnecessaryLocalVariable")
          List<ReactPackage> packages = new PackageList(this).getPackages();
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // packages.add(new MyReactNativePackage());
            packages.add(new RegistryPackage());
            packages.add(new FullScreenPackage());
            packages.add(new PipPackage());
            packages.add(new GamepadPackage());
            packages.add(new UsbRumblePackage());
            packages.add(new StreamViewPackage());
            packages.add(new BatteryPackage());
            packages.add(new StreamTextureViewPackage());
            packages.add(new SensorPackage());
            packages.add(new GamepadSensorPackage());
            packages.add(new HolepunchPackage());
            packages.add(new LogsPackage());
            packages.add(new AnalogStickPackage());
            packages.add(new ButtonViewPackage());
          return packages;
        }

        @Override
        protected String getJSMainModuleName() {
          return "index";
        }

        @Override
        protected boolean isNewArchEnabled() {
          return BuildConfig.IS_NEW_ARCHITECTURE_ENABLED;
        }

        @Override
        protected Boolean isHermesEnabled() {
          return BuildConfig.IS_HERMES_ENABLED;
        }
      };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
    UMConfigure.preInit(this,"678a1c1a9a16fe6dcd306942","PeaSyo");
    UMConfigure.init(this, "678a1c1a9a16fe6dcd306942", "PeaSyo", UMConfigure.DEVICE_TYPE_PHONE, "");
    ReactNativeFlipper.initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
  }
}
