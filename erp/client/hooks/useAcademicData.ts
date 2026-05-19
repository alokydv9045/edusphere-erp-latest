import { useState, useEffect } from 'react';
import { academicAPI, ClassItem, SectionItem, AcademicYear } from '@/lib/api/academic';

export function useAcademicData(selectedClassId?: string) {
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [sections, setSections] = useState<SectionItem[]>([]);
    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Initial fetch of classes and academic years
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const [classesRes, yearsRes] = await Promise.all([
                    academicAPI.getClasses(),
                    academicAPI.getAcademicYears()
                ]);

                setClasses(classesRes.classes || []);
                setAcademicYears(yearsRes.academicYears || []);
            } catch (err: unknown) {
                console.error("Failed to fetch initial academic data", err);
                if (err instanceof Error) {
                    setError(err.message || "Failed to load academic data");
                } else {
                    setError("Failed to load academic data");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    // Fetch sections whenever selectedClassId changes
    useEffect(() => {
        const fetchSections = async () => {
            if (!selectedClassId) {
                setSections([]);
                return;
            }

            try {
                setLoading(true);
                const sectionsRes = await academicAPI.getSections({ classId: selectedClassId });
                setSections(sectionsRes.sections || []);
            } catch (err: unknown) {
                console.error("Failed to fetch sections", err);
                if (err instanceof Error) {
                    setError(err.message || "Failed to load sections");
                } else {
                    setError("Failed to load sections");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchSections();
    }, [selectedClassId]);

    return {
        classes,
        sections,
        academicYears,
        loading,
        error
    };
}
