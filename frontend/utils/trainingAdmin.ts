import { supabase } from '../lib/supabaseClient';
import { TrainingItem } from '../types';

export const fetchAdminTrainings = async (): Promise<TrainingItem[]> => {
    if (!supabase) {
        console.warn('Supabase disabled; returning empty training list for admin.');
        return [];
    }

    const { data, error } = await supabase
        .from('trainings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

    if (error) {
        console.error('Failed to fetch trainings for admin', error);
        return [];
    }

    return (data ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        fullContent: row.fullContent, // Schema matches: "fullContent"
        syllabus: row.syllabus,
        startDate: row.startDate,     // Schema matches: "startDate"
        duration: row.duration,
        level: row.level,
        image: row.image,
        status: row.status,
        certLabel: row.certLabel,
        infoTitle: row.infoTitle,
        aboutTitle: row.aboutTitle,
        syllabusTitle: row.syllabusTitle,
        durationLabel: row.durationLabel,
        startLabel: row.startLabel,
        statusLabel: row.statusLabel,
        sidebarNote: row.sidebarNote,
        highlightWord: row.highlightWord
    }));
};

export const upsertTraining = async (training: TrainingItem): Promise<{ data: TrainingItem | null; error: any }> => {
    if (!supabase) {
        const error = new Error('Supabase is not configured');
        console.warn('Unable to save training; Supabase credentials are missing.');
        return { data: null, error };
    }

    // Ensure payload strictly matches DB schema (CamelCase columns)
    const dbPayload = {
        id: training.id,
        title: training.title,
        description: training.description,
        fullContent: training.fullContent,
        syllabus: training.syllabus,
        startDate: training.startDate,
        duration: training.duration,
        level: training.level,
        image: training.image,
        status: training.status,
        certLabel: training.certLabel,
        infoTitle: training.infoTitle,
        aboutTitle: training.aboutTitle,
        syllabusTitle: training.syllabusTitle,
        durationLabel: training.durationLabel,
        startLabel: training.startLabel,
        statusLabel: training.statusLabel,
        sidebarNote: training.sidebarNote,
        highlightWord: training.highlightWord
    };

    const { data, error } = await supabase
        .from('trainings')
        .upsert(dbPayload, { onConflict: 'id' })
        .select('*')
        .single();

    return { data, error };
};

export const deleteTraining = async (id: string) => {
    if (!supabase) {
        const error = new Error('Supabase is not configured');
        console.warn('Unable to delete training; Supabase credentials are missing.');
        return error;
    }

    const { error } = await supabase.from('trainings').delete().eq('id', id);
    return error;
};
