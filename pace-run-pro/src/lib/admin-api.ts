export class AdminApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
  }
}

type ApiErrorBody = {
  error?: string;
  message?: string;
};

export async function fetchAdminJson<T>(url: string): Promise<T> {
  const response = await fetch(url);

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorBody;
    const detail = body.message ?? body.error ?? response.statusText;
    throw new AdminApiError(`Falha ao carregar dados administrativos (${response.status}): ${detail}`, response.status);
  }

  return response.json() as Promise<T>;
}
