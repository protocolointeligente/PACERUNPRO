// Capacitor config for PACERUNPRO Android / iOS wrapper.
// Run: npm run mobile:build  →  npx cap add android  →  npx cap run android
// Install Capacitor when building native: npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios

const config = {
  appId: "com.pacerunpro.app",
  appName: "PACERUNPRO",
  webDir: "out",
  server: {
    url: "https://pacerunpro.com.br",
    cleartext: false,
  },
  ios: {
    contentInset: "always",
    backgroundColor: "#0A0C0F",
    allowsLinkPreview: false,
    scrollEnabled: true,
  },
  android: {
    backgroundColor: "#0A0C0F",
    allowMixedContent: false,
    captureInput: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#0A0C0F",
      androidSplashResourceName: "splash",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "dark",
      backgroundColor: "#0A0C0F",
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;
