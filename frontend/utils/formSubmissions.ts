
import { supabase } from '../lib/supabaseClient';

export interface FormSubmission {
    id?: string;
    type: 'contact' | 'audit' | 'training';
    form_data: any;
    status?: 'new' | 'read' | 'archived';
    created_at?: string;
}

export const submitForm = async (type: FormSubmission['type'], data: any) => {
    if (!supabase) return { error: 'Supabase not configured' };

    const { data: result, error } = await supabase
        .from('form_submissions')
        .insert([
            {
                type,
                form_data: data,
                status: 'new',
                created_at: new Date().toISOString(),
            },
        ])
        .select();

    return { result, error };
};

export const fetchSubmissions = async (type?: FormSubmission['type']) => {
    if (!supabase) return [];

    let query = supabase
        .from('form_submissions')
        .select('*')
        .order('created_at', { ascending: false });

    if (type) {
        query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching submissions:', error);
        return [];
    }

    return data as FormSubmission[];
};

export const updateSubmissionStatus = async (id: string, status: FormSubmission['status']) => {
    if (!supabase) return { error: 'Supabase not configured' };

    const { data, error } = await supabase
        .from('form_submissions')
        .update({ status })
        .eq('id', id);

    return { data, error };
};
