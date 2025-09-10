const { withAndroidManifest } = require("@expo/config-plugins");
export default ({ config }) => {
  const profile = process.env.EXPO_PROFILE || "default";

  // Base configuration
  // const baseConfig = {

  return {
    ...config,
    plugins: [
      ...(config.plugins || []),
      [
        withAndroidManifest,
        (config) => {
          config.modResults.manifest.application[0].$[
            "android:usesCleartextTraffic"
          ] = "true";
          return config;
        },
      ],
    ],
    extra: {
      ...config.extra,
      profile,
    },
  };

  // Profile-specific configurations
  // switch (profile) {
  //   case "staging":
  //     return {
  //       ...baseConfig,
  //       name: "Pocket Pixie (Staging)",
  //       slug: "pocket-pixie",
  //       scheme: "pocket-pixie",
  //       extra: {
  //         ...baseConfig.extra,
  //         environment: "staging",
  //       },
  //     };
  //
  //   case "production":
  //     return {
  //       ...baseConfig,
  //       name: "Pocket Pixie",
  //       slug: "pocket-pixie",
  //       scheme: "pocket-pixie",
  //       extra: {
  //         ...baseConfig.extra,
  //         environment: "production",
  //       },
  //     };
  //
  //   default:
  //     return {
  //       ...baseConfig,
  //       name: "Pocket Pixie (Dev)",
  //       slug: "pocket-pixie",
  //       scheme: "pocket-pixie",
  //       extra: {
  //         ...baseConfig.extra,
  //         environment: "development",
  //       },
  //     };
  // }
};
