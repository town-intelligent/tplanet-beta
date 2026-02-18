// src/utils/Plan.jsx
import { formatDate } from "./Transform";

export async function plan_info(uuid) {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_HOST_URL_TPLANET}/api/projects/info/${uuid}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();
    // API 回傳格式: {success: true, data: {...}} 或直接 {...}
    return data?.data || data;
  } catch (error) {
    console.error("Error:", error);
    return {};
  }
}

export async function list_plan_tasks(uuid, parent = 0) {
  const formdata = new FormData();
  formdata.append("uuid", uuid);
  formdata.append("parent", parent);

  try {
    const response = await fetch(
      `${import.meta.env.VITE_HOST_URL_TPLANET}/api/projects/tasks`,
      {
        method: "POST",
        body: formdata,
        redirect: "follow",
      }
    );

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();
    // API 回傳格式: {success: true, data: {...}} 或直接 {...}
    return data?.data || data;
  } catch (error) {
    console.error("Error:", error);
    return {};
  }
}

export async function getProjectWeight(list_task_UUIDs) {
  // 防呆：確保有 task UUIDs
  if (!list_task_UUIDs || !Array.isArray(list_task_UUIDs) || list_task_UUIDs.length === 0) {
    return {};
  }
  const formdata = new FormData();
  formdata.append("uuid", list_task_UUIDs[0]);

  try {
    const response = await fetch(
      `${import.meta.env.VITE_HOST_URL_TPLANET}/api/projects/weight`,
      {
        method: "POST",
        body: formdata,
        redirect: "follow",
      }
    );

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();
    // API 回傳格式: {success: true, data: {...}} 或直接 {...}
    return data?.data || data;
  } catch (error) {
    console.error("Error:", error);
    return {};
  }
}

export async function list_plans(email) {
  if (!email) throw new Error("email is required");
  const base = (
    import.meta.env.VITE_HOST_URL_TPLANET ||
    (typeof window !== "undefined" ? window.location.origin : "")
  ).replace(/\/+$/, "");

  const body = new URLSearchParams({ email });
  const primaryUrl = `${base}/api/projects/projects`;
  const fallbackUrl = `${base}/projects/projects`;

  const primaryRes = await fetch(primaryUrl, {
    method: "POST",
    body,
    credentials: "omit",
  });

  if (primaryRes.ok) {
    const data = await primaryRes.json();
    return data?.data || data;
  }

  // Tenant hosters may include emails that don't have an account in this env yet.
  // Treat account-not-found as an empty project list instead of hard error.
  if (primaryRes.status === 404) {
    const contentType = (primaryRes.headers.get("content-type") || "").toLowerCase();
    if (contentType.includes("application/json")) {
      try {
        const errData = await primaryRes.json();
        const errCode = String(errData?.error?.code || errData?.code || "").toUpperCase();
        const errMsg = String(errData?.error?.message || errData?.message || "").toLowerCase();
        if (errCode === "ACCOUNT_NOT_FOUND" || errMsg.includes("account not found")) {
          return { result: "true", projects: [] };
        }
      } catch (_) {
        // ignore parse failure and continue with route-level fallback logic below
      }
    }
  }

  // Important: this endpoint can legitimately return 404 JSON (e.g. account not found).
  // Only fallback when it looks like route-level 404 (usually HTML/non-JSON from proxy).
  if (primaryRes.status === 404) {
    const contentType = (primaryRes.headers.get("content-type") || "").toLowerCase();
    const primaryBodyText = await primaryRes.text();
    const isJsonLike = contentType.includes("application/json") || primaryBodyText.trim().startsWith("{");

    if (!isJsonLike) {
      const fallbackRes = await fetch(fallbackUrl, {
        method: "POST",
        body,
        credentials: "omit",
      });
      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        return data?.data || data;
      }
      throw new Error(`HTTP ${fallbackRes.status || 500}`);
    }
  }

  throw new Error(`HTTP ${primaryRes.status || 500}`);
}


export async function plan_submit(formdata, uuid = null) {
  const url = window.location.pathname;
  const segments = url.split("/");
  const page = segments[2];

  if (page !== "cms_agent" && uuid == null) {
    try {
      const nameValue = formdata.get("name");
      if (
        nameValue === "" ||
        nameValue === null ||
        typeof nameValue === "undefined"
      ) {
        return {};
      }
    } catch (e) {
      return { e };
    }
  }

  formdata.append("email", localStorage.getItem("email"));
  if (uuid != null) {
    formdata.append("uuid", uuid);
  }

  formdata.append("project_type", "0"); // 0 = 一般專案");
  formdata.append("list_project_type", 0);

  try {
    const response = await fetch(
      `${import.meta.env.VITE_HOST_URL_TPLANET}/api/projects/upload`,
      {
        method: "POST",
        body: formdata,
        redirect: "follow",
      }
    );

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();
    // API 回傳格式: {success: true, data: {...}} 或直接 {...}
    return data?.data || data;
  } catch (error) {
    console.error("Error:", error);
    return {};
  }
}

export async function plan_delete(uuid) {
  const formdata = new FormData();
  //formdata.append("email", localStorage.getItem("email"));
  formdata.append("uuid", uuid);

  try {
    const response = await fetch(
      `${import.meta.env.VITE_HOST_URL_TPLANET}/api/projects/del_project`,
      {
        method: "POST",
        body: formdata,
        redirect: "follow",
      }
    );

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error:", error);
    return {};
  }
}
//append_plan_submit_data待新增其他頁面的
export function createFormData(projectData) {
  const url = window.location.pathname;
  const segments = url.split("/");
  const page = segments[2];

  const formData = new FormData();

  if (page === "cms_plan_info") {
    formData.append("name", projectData.name);
    formData.append("project_a", projectData.projectA);
    formData.append("org", projectData.projectA);
    formData.append("project_b", projectData.projectB);
    formData.append("project_start_date", formatDate(projectData.startDate));
    formData.append("project_due_date", formatDate(projectData.dueDate));
    formData.append("budget", projectData.budget);
    formData.append("philosophy", projectData.philosophy);
    formData.append("is_budget_revealed", projectData.isBudgetRevealed);
  } else if (page === "cms_sdgs_setting") {
    const list_sdg = projectData.flatMap((weight) =>
      weight.categories.map((category) => (category.isChecked ? 1 : 0))
    );
    formData.append("list_sdg", list_sdg);
  } else if (page === "cms_impact") {
    formData.append("weight_description", projectData.weightComment);
  } else if (page === "cms_contact_person") {
    formData.append("hoster", projectData.hoster);
    formData.append("org", projectData.org);
    formData.append("hoster_email", projectData.email);
    formData.append("tel", projectData.tel);

    //const list_location = Object.values(projectData.locations ?? {}).map(l => (l ? 1 : 0));
    formData.append("list_location", projectData.list_location || "");
  }

  return formData;
}
