import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'dev.micio.horas',
  appName: 'Horas',
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
      smallIcon: 'ic_stat_horas',
      iconColor: '#FFB020',
    },
  },
}

export default config
