export const getItem = (key: string): string | null => {
    const cookies = document.cookie.split("; ");
    for (const cookie of cookies) {
      const [cookieKey, cookieValue] = cookie.split("=");
      if (cookieKey === key) return decodeURIComponent(cookieValue);
    }
    return null;
  };
  
  export const setItem = (key: string, value: string, days = 7) => {
    const expires = new Date();
    expires.setDate(expires.getDate() + days);
    document.cookie = `${key}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/;`;
  };
  
  export const removeItem = (key: string) => {
    document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  };
  
  export const clear = () => {
    const cookies = document.cookie.split("; ");
    for (const cookie of cookies) {
      const key = cookie.split("=")[0];
      removeItem(key);
    }
  };
  
  export const getAll = (): { [key: string]: string } => {
    const data: { [key: string]: string } = {};
    const cookies = document.cookie.split("; ");
    for (const cookie of cookies) {
      const [key, value] = cookie.split("=");
      if (key) data[key] = decodeURIComponent(value || "");
    }
    return data;
  };
  