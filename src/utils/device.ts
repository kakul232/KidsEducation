export interface DeviceInfo {
  deviceId: string;
  ip: string;
  userAgent: string;
  browser: string;
  deviceType: string;
}

export async function getClientDetails(): Promise<DeviceInfo> {
  // 1. Device ID (stored persistently in localStorage)
  let deviceId = localStorage.getItem("device_id");
  if (!deviceId) {
    deviceId = "dev_" + Math.random().toString(36).substr(2, 9) + "_" + Date.now().toString(36);
    localStorage.setItem("device_id", deviceId);
  }

  // 2. IP Address (Fetched with 3-second timeout limit to avoid blocking offline play)
  let ip = "";
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const res = await fetch("https://api.ipify.org?format=json", { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      ip = data.ip || "";
    }
  } catch (e) {
    console.warn("Could not retrieve IP address:", e);
  }

  // 3. User Agent
  const ua = navigator.userAgent;

  // 4. Browser detection
  let browser = "Unknown Browser";
  if (ua.indexOf("Firefox") > -1) browser = "Firefox";
  else if (ua.indexOf("SamsungBrowser") > -1) browser = "Samsung Browser";
  else if (ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1) browser = "Opera";
  else if (ua.indexOf("Trident") > -1) browser = "Internet Explorer";
  else if (ua.indexOf("Edge") > -1 || ua.indexOf("Edg") > -1) browser = "Edge";
  else if (ua.indexOf("Chrome") > -1) browser = "Chrome";
  else if (ua.indexOf("Safari") > -1) browser = "Safari";

  // 5. Device Type detection
  let deviceType = "Desktop";
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    deviceType = "Tablet";
  } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Opera Mini/i.test(ua)) {
    deviceType = "Mobile";
  }

  return {
    deviceId,
    ip,
    userAgent: ua,
    browser,
    deviceType
  };
}
