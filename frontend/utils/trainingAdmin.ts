import { apiClient } from '../lib/apiClient';
import { TrainingItem } from '../types';
import { normalizeStatus } from './fetchData';

export const fetchAdminTrainings = async (): Promise<TrainingItem[]> => {
    try {
        const data = await apiClient.get('/trainings');
        return (data ?? []).map((row: any) => ({
            id: row.id,
            title: row.title,
            description: row.description,
            fullContent: row.fullContent,
            syllabus: typeof row.syllabus === 'string' ? JSON.parse(row.syllabus) : row.syllabus,
            targetAudience: typeof row.targetAudience === 'string' ? JSON.parse(row.targetAudience) : row.targetAudience,
            startDate: row.startDate,
            duration: row.duration,
            level: row.level,
            image: row.image,
            status: normalizeStatus(row.status),
            certLabel: row.certLabel,
            infoTitle: row.infoTitle,
            aboutTitle: row.aboutTitle,
            syllabusTitle: row.syllabusTitle,
            targetAudienceTitle: row.targetAudienceTitle,
            durationLabel: row.durationLabel,
            startLabel: row.startLabel,
            statusLabel: row.statusLabel,
            sidebarNote: row.sidebarNote,
            highlightWord: row.highlightWord
        }));
    } catch (error) {
        console.error('Failed to fetch trainings for admin', error);
        return [];
    }
};

export const upsertTraining = async (training: TrainingItem): Promise<{ data: TrainingItem | null; error: any }> => {
    try {
        await apiClient.post('/trainings', training);
        return { data: training, error: null };
    } catch (error) {
        console.error('Error in upsertTraining:', error);
        return { data: null, error };
    }
};

export const deleteTraining = async (id: string) => {
    try {
        await apiClient.delete(`/trainings/${id}`);
        return null;
    } catch (error) {
        console.error('Error in deleteTraining:', error);
        return error;
    }
};
