export interface Citation {
  source: string;
  text: string;
  page?: number;
  score?: number;
}

export interface QueryResponse {
  query: string;
  response: string;
  citations: Citation[];
}

export interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
  meta: any;
  errors: any;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || 'default-api-key-change-in-production';

export async function queryLaws(query: string, k: number = 2): Promise<ApiResponse<QueryResponse>> {
  const response = await fetch(`${API_URL}/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
    },
    body: JSON.stringify({ query, k }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error: ${response.statusText}`);
  }

  return response.json();
}

