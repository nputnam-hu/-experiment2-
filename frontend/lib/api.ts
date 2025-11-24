export interface Citation {
  source: string;
  text: string;
  page?: number;
  score?: number;
}

export interface TextSegment {
  text: string;
  citation_index?: number;
  citation_text?: string;
}

export interface QueryResponse {
  query: string;
  response: string;
  response_segments: TextSegment[];
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
const API_KEY =
  process.env.NEXT_PUBLIC_API_KEY || 'default-api-key-change-in-production';

export async function queryLaws(
  query: string,
  k: number = 2
): Promise<ApiResponse<QueryResponse>> {
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

export interface FeedbackRequest {
  feedback: 'positive' | 'negative' | null;
  result: QueryResponse;
  timestamp: string;
}

export async function submitFeedback(
  data: FeedbackRequest
): Promise<ApiResponse<any>> {
  const response = await fetch(`${API_URL}/feedback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error: ${response.statusText}`);
  }

  return response.json();
}
