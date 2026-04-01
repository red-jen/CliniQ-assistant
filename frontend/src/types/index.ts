export interface User {
  id: number
  username: string
  email: string
  role: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface Source {
  source: string
  page?: string
  content?: string
}

export interface AskResponse {
  answer: string
  sources: Source[]
  response_time?: number
  metrics?: {
    answer_relevancy?: number
    faithfulness?: number
    contextual_relevancy?: number
  }
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: Source[]
  timestamp: Date
}

export interface QueryHistory {
  id: number
  query: string
  reponse: string
  created_at: string
}

export interface DashboardStats {
  total_queries: number
  avg_response_time: number
  avg_relevance: number
  avg_faithfulness: number
  total_users: number
  total_documents: number
}
