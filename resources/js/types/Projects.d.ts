export interface Project {
    id: string;
    reference: string;
    name: string;
    description?: string | null;
    metadata?: Record<string, string | number | boolean | null> | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    deleted_at?: string | null;
    trashed?: boolean;
    documents?: {
        file_name: string;
        size: number; 
        url: string;  
        original_url: string;
    }[]; 
}