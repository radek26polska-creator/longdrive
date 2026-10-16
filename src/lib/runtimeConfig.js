const runtimeApiUrl = globalThis.longDriveRuntime?.apiBaseUrl;
const configuredApiUrl = runtimeApiUrl || import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';

export const API_BASE_URL = configuredApiUrl.replace(/\/+$/, '');
