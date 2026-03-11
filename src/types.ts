export interface SavedPrompt {
  id: string;
  title: string;
  description: string;
  prompt: string;
  timestamp: number;
}

export interface User {
  id: number;
  email: string;
  role: 'admin' | 'user';
  name?: string;
  company?: string;
  job_title?: string;
}
