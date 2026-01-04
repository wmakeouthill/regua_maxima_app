import type { CapacitorConfig } from '@capacitor/cli';

const isDev = process.env.NODE_ENV !== 'production';

const config: CapacitorConfig = {
    appId: 'com.reguamaxima.app',
    appName: 'Régua Máxima',
    webDir: 'www',

    server: {
        androidScheme: 'https',
        iosScheme: 'ionic',
        // Em desenvolvimento, conecta ao servidor Angular com hot-reload
        ...(isDev && {
            url: 'http://10.0.2.2:4200', // 10.0.2.2 é o IP do host no emulador Android
            cleartext: true
        })
    },

    plugins: {
        SplashScreen: {
            launchShowDuration: 2000,
            launchAutoHide: true,
            backgroundColor: '#5D4037',
            androidScaleType: 'CENTER_CROP',
            showSpinner: false
        },
        Keyboard: {
            resize: 'body',
            resizeOnFullScreen: true
        },
        StatusBar: {
            style: 'light',
            backgroundColor: '#5D4037'
        },
        PushNotifications: {
            presentationOptions: ['badge', 'sound', 'alert']
        }
    },

    android: {
        allowMixedContent: isDev, // Permite conteúdo misto em dev para conectar ao localhost
        captureInput: true,
        webContentsDebuggingEnabled: isDev // Debug Chrome DevTools em dev
    },

    ios: {
        contentInset: 'automatic'
    }
};

export default config;
