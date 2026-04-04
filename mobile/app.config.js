const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const apiUrl =
  process.env.EXPO_PUBLIC_API_URL ||
  process.env.API_URL ||
  'http://localhost:4004/api';

module.exports = {
  expo: {
    name: 'My Fullstack App',
    slug: 'my-fullstack-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    splash: { image: './assets/splash-icon.png', resizeMode: 'contain', backgroundColor: '#ffffff' },
    userInterfaceStyle: 'automatic',
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.myfullstackapp.mobile',
      infoPlist: {
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: true,
        },
      },
    },
    android: {
      adaptiveIcon: { foregroundImage: './assets/adaptive-icon.png', backgroundColor: '#ffffff' },
      package: 'com.myfullstackapp.mobile',
    },
    scheme: 'myfullstackapp',
    plugins: ['expo-secure-store'],
    web: {
      bundler: 'metro',
    },
    extra: {
      apiUrl: apiUrl.replace(/\/$/, ''),
    },
  },
};
