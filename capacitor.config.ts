import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'dev.micio.ponto',
  appName: 'Ponto',
  webDir: 'dist',
  android: {
    backgroundColor: '#12110E',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#12110E',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_ponto',
      iconColor: '#FFB020',
    },
  },
}

export default config
