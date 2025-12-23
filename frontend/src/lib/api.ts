const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/v1";

export type ApiError = { message: string; issues?: string[] };

const getAuthHeaders = (): Record<string, string> | undefined => {
  const token = localStorage.getItem("sms_access_token");
  return token ? { Authorization: `Bearer ${token}` } : undefined;
};

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    localStorage.removeItem("sms_access_token");
    localStorage.removeItem("sms_refresh_token");
    window.location.href = "/";
    throw new Error("Unauthorized");
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = json?.message || "Request failed";
    const err = new Error(message) as Error & ApiError;
    if (json?.issues) err.issues = json.issues;
    throw err;
  }
  return json as T;
}

export async function apiPost<TBody, TResp>(path: string, body: TBody): Promise<TResp> {
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return handleResponse<TResp>(res);
}

export async function apiGetAuth<TResp>(path: string): Promise<TResp> {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: getAuthHeaders() ? { ...getAuthHeaders() } : undefined,
  });
  return handleResponse<TResp>(res);
}

export async function apiPostAuth<TBody, TResp>(path: string, body: TBody): Promise<TResp> {
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(getAuthHeaders() || {}),
    },
    body: JSON.stringify(body),
  });
  return handleResponse<TResp>(res);
}

export async function apiPutAuth<TBody, TResp>(path: string, body: TBody): Promise<TResp> {
  const res = await fetch(`${baseUrl}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(getAuthHeaders() || {}),
    },
    body: JSON.stringify(body),
  });
  return handleResponse<TResp>(res);
}

export async function apiDeleteAuth<TResp>(path: string): Promise<TResp> {
  const res = await fetch(`${baseUrl}${path}`, {
    method: "DELETE",
    headers: getAuthHeaders() ? { ...getAuthHeaders() } : undefined,
  });
  if (res.status === 204) return {} as TResp;
  return handleResponse<TResp>(res);
}

export async function apiDownload(path: string) {
  const res = await fetch(`${baseUrl}${path}`, { headers: getAuthHeaders() ? { ...getAuthHeaders() } : undefined });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Download failed");
  }
  const blob = await res.blob();
  const disposition = res.headers.get("Content-Disposition") || "";
  const filename = disposition.split("filename=")[1]?.replace(/"/g, "") || "download";
  return { blob, filename };
}
