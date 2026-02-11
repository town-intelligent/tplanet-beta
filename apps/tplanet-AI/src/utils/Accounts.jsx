import { apiPost, apiPostJson, apiGet } from './api';

export async function logout() {
  const formdata = new FormData();
  formdata.append("token", localStorage.getItem("jwt"));

  try {
    await apiPost('/accounts/verify_jwt', formdata);
    localStorage.clear();
    window.location.replace("/");
  } catch (error) {
    console.error("There was a problem with the fetch operation:", error);
  }
}

export async function forgotPassword(email) {
  const formdata = new FormData();
  formdata.append("email", email);

  try {
    const response = await apiPost('/accounts/forgot_password', formdata);

    if (response.success) {
      console.log("✅ Password reset email sent successfully");
      return true;
    } else {
      console.error(`❌ Password reset failed: ${response.error?.message}`);
      return false;
    }
  } catch (error) {
    console.error("There was a problem with the forgotPassword API:", error);
    return false;
  }
}

export async function deleteAccount(email) {
  const formdata = new FormData();
  formdata.append("email", email);

  try {
    const response = await apiPost('/accounts/delete', formdata);

    if (response.success) {
      return { success: true, message: "帳號已刪除" };
    } else {
      return { success: false, message: response.error?.message || "刪除失敗" };
    }
  } catch (error) {
    console.error("There was a problem with the deleteAccount API:", error);
    return { success: false, message: error.message || "刪除帳號時發生錯誤" };
  }
}

// 取得帳號狀態（active）
export async function getAccountStatus(email) {
  const formdata = new FormData();
  formdata.append("email", email);

  try {
    const response = await apiPost('/accounts/get_user_info', formdata);

    if (response.success && response.data) {
      const userInfo = response.data;
      const active = typeof userInfo.active === 'boolean' ? userInfo.active : null;

      return {
        success: true,
        active,
        userInfo,
      };
    }

    return {
      success: false,
      active: null,
      userInfo: null,
      message: response.error?.message || "取得帳號狀態失敗",
    };
  } catch (error) {
    console.error("There was a problem with getAccountStatus:", error);
    return {
      success: false,
      active: null,
      userInfo: null,
      message: error.message || "取得帳號狀態失敗",
    };
  }
}

// 設定帳號啟用 / 停用狀態
export async function setAccountActiveStatus(email, isActive) {
  try {
    const response = await apiPostJson('/accounts/activate_user', {
      email,
      is_active: isActive ? "True" : "False",
    });

    if (response.success) {
      return {
        success: true,
        message: response.message || "User activation status updated successfully",
      };
    } else {
      return {
        success: false,
        message: response.error?.message || "更新失敗",
      };
    }
  } catch (error) {
    console.error("There was a problem with setAccountActiveStatus:", error);
    return {
      success: false,
      message: error.message || "更新帳號啟用狀態時發生錯誤",
    };
  }
}

// 新增帳號 API
export async function addAccount(payload) {
  try {
    const response = await apiPostJson('/accounts/add_user', payload);

    if (response.success && response.data) {
      return {
        success: true,
        message: `已建立使用者：${response.data.email}`,
        data: response.data,
      };
    }

    return {
      success: false,
      message: response.error?.message || "建立失敗（請確定帳號格式正確或已經存在）",
    };
  } catch (error) {
    console.error("❌ There was a problem with addAccount API:", error);
    return { success: false, message: error.message || "建立帳號時發生錯誤" };
  }
}
