export const API_BASE: string | undefined = import.meta.env.VITE_API_BASE;

type ApiOptions = RequestInit & { token?: string };

async function parseJson(res: Response) {
	try {
		return await res.json();
	} catch {
		return null;
	}
}

export async function apiFetch<T = unknown>(path: string, options: ApiOptions = {}) {
	const { token, headers, ...rest } = options;
	const mergedHeaders = new Headers(headers ?? {});
	if (!mergedHeaders.has('Accept')) mergedHeaders.set('Accept', 'application/json');
	if (rest.body && !(rest.body instanceof FormData) && !mergedHeaders.has('Content-Type')) {
		mergedHeaders.set('Content-Type', 'application/json');
	}
	if (token) mergedHeaders.set('Authorization', `Bearer ${token}`);

	if (!API_BASE) {
		throw new Error('缺少 VITE_API_BASE 設定，無法呼叫後端 API');
	}

	const res = await fetch(`${API_BASE}${path}`, {
		...rest,
		headers: mergedHeaders,
	});
	const data = await parseJson(res);
	if (!res.ok) {
		const message = typeof data?.message === 'string' ? data.message : 'API Error';
		throw new Error(message);
	}
	return data as T;
}

