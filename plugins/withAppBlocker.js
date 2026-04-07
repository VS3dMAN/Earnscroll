const { withDangerousMod, withAndroidManifest, withStringsXml, AndroidConfig } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const withAppBlocker = (config) => {
    // 1. Copy Native Files (Service & XML)
    config = withDangerousMod(config, [
        'android',
        async (config) => {
            const projectRoot = config.modRequest.projectRoot;
            const androidAppDir = path.join(projectRoot, 'android', 'app', 'src', 'main');

            // Paths
            const sourceService = path.join(projectRoot, 'native-src', 'android', 'AppBlockerService.kt');
            const sourceModule = path.join(projectRoot, 'native-src', 'android', 'EarnScrollModule.kt');
            const sourcePackage = path.join(projectRoot, 'native-src', 'android', 'EarnScrollPackage.kt');
            const sourceXml = path.join(projectRoot, 'native-src', 'android', 'accessibility_service_config.xml');

            const destServiceDir = path.join(androidAppDir, 'java', 'com', 'earnscroll', 'app');
            const destXmlDir = path.join(androidAppDir, 'res', 'xml');

            const destService = path.join(destServiceDir, 'AppBlockerService.kt');
            const destModule = path.join(destServiceDir, 'EarnScrollModule.kt');
            const destPackage = path.join(destServiceDir, 'EarnScrollPackage.kt');
            const destXml = path.join(destXmlDir, 'accessibility_service_config.xml');

            // Ensure directories exist
            fs.mkdirSync(destServiceDir, { recursive: true });
            fs.mkdirSync(destXmlDir, { recursive: true });

            // Copy files
            const copyFile = (src, dest, name) => {
                if (fs.existsSync(src)) {
                    fs.copyFileSync(src, dest);
                    console.log(`✅ Copied ${name}`);
                } else {
                    console.warn(`⚠️ ${name} not found in native-src/android`);
                }
            };

            copyFile(sourceService, destService, 'AppBlockerService.kt');
            copyFile(sourceModule, destModule, 'EarnScrollModule.kt');
            copyFile(sourcePackage, destPackage, 'EarnScrollPackage.kt');
            copyFile(sourceXml, destXml, 'accessibility_service_config.xml');

            return config;
        },
    ]);

    // 2. Update Android Manifest
    config = withAndroidManifest(config, async (config) => {
        const androidManifest = config.modResults;
        const mainApplication = androidManifest.manifest.application[0];

        // Add Service
        if (!mainApplication.service) {
            mainApplication.service = [];
        }

        const serviceName = '.AppBlockerService';

        // Remove existing if present to avoid dupes (primitive check)
        mainApplication.service = mainApplication.service.filter(
            (s) => s['$']['android:name'] !== serviceName
        );

        mainApplication.service.push({
            $: {
                'android:name': serviceName,
                'android:permission': 'android.permission.BIND_ACCESSIBILITY_SERVICE',
                'android:exported': 'false', // Important for security
            },
            'intent-filter': [
                {
                    action: [{ $: { 'android:name': 'android.accessibilityservice.AccessibilityService' } }],
                },
            ],
            'meta-data': [
                {
                    $: {
                        'android:name': 'android.accessibilityservice',
                        'android:resource': '@xml/accessibility_service_config',
                    },
                },
            ],
        });

        return config;
    });

    // 3. Add String Resource for Description
    config = withStringsXml(config, (config) => {
        const strings = config.modResults;

        // Initialize if missing
        if (!strings.resources) strings.resources = {};
        if (!strings.resources.string) strings.resources.string = [];

        const stringName = 'accessibility_service_description';
        const stringValue = 'EarnScroll uses this service to block distracting apps while you workout.';

        // Remove existing if present
        strings.resources.string = strings.resources.string.filter(
            (s) => !s.$ || s.$.name !== stringName
        );

        // Add new
        strings.resources.string.push({
            $: { name: stringName },
            _: stringValue,
        });

        return config;
    });

    return config;
};

module.exports = withAppBlocker;

