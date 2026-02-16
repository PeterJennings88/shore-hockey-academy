(function configureSite() {
  window.SHA_CONFIG = Object.assign(
    {
      siteUrl: 'https://shorehockeyacademy.com',
      gaMeasurementId: '',
      analyticsDebug: false,
      calendlyUrl: '',
      socialInstagramUrl: '',
      socialXUrl: '',
      socialFacebookUrl: '',
      publicScheduleStatus: 'provisional'
    },
    window.SHA_CONFIG || {}
  );
})();
