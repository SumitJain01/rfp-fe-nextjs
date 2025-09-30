export interface User {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: 'buyer' | 'supplier';
  company_name?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RFP {
  id: string;
  title: string;
  description: string;
  category: string;
  budget_min?: number;
  budget_max?: number;
  deadline: string;
  requirements: string[];
  evaluation_criteria: string[];
  terms_and_conditions?: string;
  status: 'draft' | 'published' | 'closed' | 'cancelled';
  created_by: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
  response_count: number;
  document_ids: string[];
  creator?: {
    id: string;
    username: string;
    full_name: string;
    company_name?: string;
  };
}

export interface Response {
  id: string;
  rfp_id: string;
  submitted_by: string;
  proposal: string;
  proposed_budget?: number;
  timeline?: string;
  methodology?: string;
  team_details?: string;
  additional_notes?: string;
  status: 'draft' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  submitted_at?: string;
  reviewed_at?: string;
  reviewer_notes?: string;
  created_at: string;
  updated_at: string;
  document_ids: string[];
  rfp?: {
    id: string;
    title: string;
    status: string;
    deadline: string;
  };
  submitter?: {
    id: string;
    username: string;
    full_name: string;
    company_name?: string;
  };
}

export interface Document {
  id: string;
  filename: string;
  original_filename: string;
  file_size: number;
  content_type: string;
  document_type: 'rfp_document' | 'response_document' | 'attachment';
  description?: string;
  rfp_id?: string;
  response_id?: string;
  uploaded_by: string;
  file_path: string;
  content?: string;
  created_at: string;
  updated_at: string;
  uploader?: {
    id: string;
    username: string;
    full_name: string;
    company_name?: string;
  };
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  full_name: string;
  role: 'buyer' | 'supplier';
  company_name?: string;
  phone?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface ApiError {
  detail: string;
}
