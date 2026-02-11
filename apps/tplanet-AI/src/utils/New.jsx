// src/utils/New.js

// 獲取新聞列表
const API_BASE = import.meta.env.VITE_HOST_URL_TPLANET;

// 取得新聞 UUID 清單
export async function news_list(email) {
  try {
    // 確保 email 有值
    if (!email) {
      console.error("news_list: email parameter is required");
      return { result: false, error: "Email parameter is required" };
    }

    // 後端範例用 multipart/form-data，所以用 FormData 傳 email
    const form = new FormData();
    form.append("email", email);

    const res = await fetch(`${API_BASE}/api/news/news_list`, {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      return { result: false, error: `HTTP ${res.status}` };
    }
    
    const data = await res.json();
    console.log("news_list API response:", data);
    return data;
  } catch (error) {
    console.error("news_list error:", error);
    return { result: false, error: error.message };
  }
}

// 刪除新聞
export async function news_delete(uuid, email) {
  const API_BASE = import.meta.env.VITE_HOST_URL_TPLANET;

  try {
    const form = new FormData();
    form.append("email", (email ?? localStorage.getItem("email") ?? "").trim());
    form.append("uuid", (uuid ?? "").toString().trim());

    const res = await fetch(`${API_BASE}/api/news/news_delete`, {
      method: "POST", 
      body: form,
    });

    if (!res.ok) {
      return { result: false, error: `HTTP ${res.status}` };
    }

    const data = await res.json();
    console.log("news_delete API response:", data);
    return data;
  } catch (error) {
    console.error("news_delete error:", error);
    return { result: false, error: error.message };
  }
}

// 獲取單個新聞
export async function news_get(uuid) {
  try {
    if (!uuid) {
      console.error("news_get: uuid parameter is required");
      return { result: false, error: "UUID parameter is required" };
    }

    const params = new URLSearchParams();
    params.append("uuid", uuid);

    const response = await fetch(
      `${API_BASE}/api/news/news_get?${params}`,
      {
        method: "GET",
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.text();
    const result = JSON.parse(data);
    console.log(`news_get API response for ${uuid}:`, result);
    return result;
  } catch (error) {
    console.error("news_get error:", error);
    return { result: false, error: error.message };
  }
}

// 新增新聞
export async function news_add(form) {
  try {
    if (!form || !(form instanceof FormData)) {
      throw new Error("Form data is required");
    }

    console.log("Submitting news_add with form data");
    
    const response = await fetch(
      `${API_BASE}/api/news/news_create`,
      {
        method: "POST",
        body: form,
      }
    );

    if (!response.ok) {
      if (response.status === 413) {
        throw new Error("FILE_TOO_LARGE");
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.text();
    const result = JSON.parse(data);
    console.log("news_add API response:", result);
    return result;
  } catch (error) {
    console.error("news_add error:", error);
    throw error;
  }
}

// 新增：更新新聞（如果後端有提供的話）
export async function news_update(uuid, form) {
  try {
    if (!uuid) {
      throw new Error("UUID parameter is required");
    }
    
    if (!form || !(form instanceof FormData)) {
      throw new Error("Form data is required");
    }

    console.log(`Updating news ${uuid} with form data`);
    
    const response = await fetch(
      `${API_BASE}/api/news/news_update?uuid=${encodeURIComponent(uuid)}`,
      {
        method: "POST", // 或 PUT，根據你的後端設計
        body: form,
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.text();
    const result = JSON.parse(data);
    console.log("news_update API response:", result);
    return result;
  } catch (error) {
    console.error("news_update error:", error);
    throw error;
  }
}

// 輔助函數：驗證 email 是否為授權的網站管理員
// 注意：hosters 應從 useHosters() hook 取得並傳入
export function isAuthorizedSiteHoster(email, hosters = []) {
  return hosters.includes(email);
}

// 輔助函數：格式化新聞數據
export function formatNewsData(newsItem) {
  if (!newsItem || !newsItem.content) {
    return null;
  }

  const { content } = newsItem;
  return {
    uuid: content.uuid,
    title: content.title || '',
    description: content.description || '',
    period: content.period || '',
    static: {
      banner: content.static?.banner || '',
      img_0: content.static?.img_0 || '',
      img_1: content.static?.img_1 || '',
      img_2: content.static?.img_2 || '',
    },
    attachments_data: content.attachments_data || null,
    hasAttachment: !!content.attachments_data
  };
}

// 輔助函數：從新聞數據中提取日期
export function extractNewsDate(newsItem) {
  if (!newsItem || !newsItem.content || !newsItem.content.period) {
    return null;
  }

  const periodStr = newsItem.content.period;
  const regex = /\b\d{2}\/\d{2}\/\d{4}\b/g;
  const matches = periodStr.match(regex);
  
  if (matches && matches.length > 0) {
    return new Date(matches[0]);
  }
  
  return null;
}

// 輔助函數：驗證新聞數據完整性
export function validateNewsData(newsData) {
  const errors = [];
  
  if (!newsData.title || newsData.title.trim() === '') {
    errors.push('標題為必填欄位');
  }
  
  if (!newsData.description || newsData.description.trim() === '') {
    errors.push('描述為必填欄位');
  }
  
  // 可以添加更多驗證規則
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export default {
  news_list,
  news_get,
  news_delete,
  news_add,
  news_update,
  isAuthorizedSiteHoster,
  formatNewsData,
  extractNewsDate,
  validateNewsData,
};