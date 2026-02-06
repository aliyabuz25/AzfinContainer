import React, { createContext, useContext, ReactNode } from 'react';
import { useSiteContent as useSiteContentSource, SiteContent } from '../utils/siteContent';

interface ContentContextType {
    content: SiteContent;
    loading: boolean;
    refresh: () => Promise<void>;
    settingsId: number | null;
}

const ContentContext = createContext<ContentContextType | undefined>(undefined);

export const ContentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const siteContent = useSiteContentSource();

    return (
        <ContentContext.Provider value={siteContent}>
            {children}
        </ContentContext.Provider>
    );
};

export const useContent = () => {
    const context = useContext(ContentContext);
    if (context === undefined) {
        throw new Error('useContent must be used within a ContentProvider');
    }
    return context;
};
