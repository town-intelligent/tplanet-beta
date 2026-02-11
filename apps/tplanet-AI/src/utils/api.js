/**
 * API Response Handler - Normalizes backend responses to consistent format
 *
 * Supports both old format:
 *   { result: true, content: {...} }
 *   { result: true, token: "...", username: "..." }
 *
 * And new format:
 *   { success: true, data: {...} }
 *   { success: false, error: { code: "...", message: "..." } }
 *
 * Usage:
 *   import { apiCall, normalizeResponse } from './api';
 *
 *   const response = await apiCall('/accounts/signin', { method: 'POST', body: formData });
 *   if (response.success) {
 *     console.log(response.data);
 *   } else {
 *     console.error(response.error);
 *   }
 */

const API_BASE = import.meta.env.VITE_HOST_URL_TPLANET;

/**
 * Normalize API response to standard format
 * @param {object} rawResponse - Raw response from backend
 * @returns {object} Normalized response: { success, data, error }
 */
export function normalizeResponse(rawResponse) {
  // New format (success/data/error)
  if ('success' in rawResponse) {
    return {
      success: rawResponse.success,
      data: rawResponse.data || null,
      message: rawResponse.message || null,
      error: rawResponse.error || null,
    };
  }

  // Old format (result/content)
  if ('result' in rawResponse) {
    const success = rawResponse.result === true || rawResponse.result === 'true';

    // Handle different old response patterns
    let data = null;

    if (rawResponse.content !== undefined) {
      data = rawResponse.content;
    } else if (rawResponse.token !== undefined) {
      data = { token: rawResponse.token, username: rawResponse.username };
    } else if (rawResponse.accounts !== undefined) {
      data = { accounts: rawResponse.accounts };
    } else if (rawResponse.user_list !== undefined) {
      data = { users: rawResponse.user_list };
    } else if (rawResponse.stats !== undefined) {
      data = { stats: rawResponse.stats };
    } else if (rawResponse.login_records !== undefined) {
      data = { login_records: rawResponse.login_records, total_count: rawResponse.total_count };
    } else {
      // Collect remaining data
      const { result, ...rest } = rawResponse;
      data = Object.keys(rest).length > 0 ? rest : null;
    }

    return {
      success,
      data,
      message: null,
      error: success ? null : { message: rawResponse.content || rawResponse.error || 'Unknown error' },
    };
  }

  // Handle responses without result/success (direct data)
  if (rawResponse.token !== undefined) {
    return {
      success: true,
      data: { token: rawResponse.token, username: rawResponse.username },
      message: null,
      error: null,
    };
  }

  // Fallback - return as-is wrapped in data
  return {
    success: true,
    data: rawResponse,
    message: null,
    error: null,
  };
}

/**
 * Make an API call with normalized response
 * @param {string} endpoint - API endpoint (e.g., '/accounts/signin')
 * @param {object} options - Fetch options
 * @returns {Promise<object>} Normalized response
 */
export async function apiCall(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}/api${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      redirect: 'follow',
    });

    // Handle non-OK responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        data: null,
        message: null,
        error: {
          code: `HTTP_${response.status}`,
          message: errorData.error?.message || errorData.message || `HTTP Error ${response.status}`,
          status: response.status,
        },
      };
    }

    const rawData = await response.json();
    return normalizeResponse(rawData);

  } catch (error) {
    return {
      success: false,
      data: null,
      message: null,
      error: {
        code: 'NETWORK_ERROR',
        message: error.message || 'Network error',
      },
    };
  }
}

/**
 * POST request with FormData
 */
export async function apiPost(endpoint, formData) {
  return apiCall(endpoint, {
    method: 'POST',
    body: formData,
  });
}

/**
 * POST request with JSON body
 */
export async function apiPostJson(endpoint, data) {
  return apiCall(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

/**
 * GET request
 */
export async function apiGet(endpoint) {
  return apiCall(endpoint, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
}

export default { apiCall, apiPost, apiPostJson, apiGet, normalizeResponse };
