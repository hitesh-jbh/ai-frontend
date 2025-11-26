import Constants from "expo-constants";

const getEnv = (key: string): string => {
  const value = Constants.expoConfig?.extra?.[key] || process.env[key];
  if (!value) {
    console.warn(`Environment variable ${key} is not set`);
    return "";
  }
  return value;
};

export default getEnv;
