const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// This enables the AI models (.tflite) to work
config.resolver.assetExts.push("tflite");

module.exports = config;