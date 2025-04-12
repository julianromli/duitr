
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchCategories, Category } from '@/integrations/supabase/client';

export const useCategories = (type?: 'income' | 'expense') => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;

  useEffect(() => {
    const getCategories = async () => {
      setIsLoading(true);
      try {
        const categoriesData = await fetchCategories(type);
        setCategories(categoriesData);
        setError(null);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setError(err instanceof Error ? err : new Error('Unknown error fetching categories'));
      } finally {
        setIsLoading(false);
      }
    };

    getCategories();
  }, [type]);

  // Function to get the localized name for a category
  const getCategoryName = (categoryId: string): string => {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return '';
    
    return currentLanguage === 'id' ? category.id_name : category.en_name;
  };

  // Function to get category from ID
  const getCategoryById = (categoryId: string): Category | undefined => {
    return categories.find(cat => cat.id === categoryId);
  };

  return {
    categories,
    isLoading,
    error,
    getCategoryName,
    getCategoryById
  };
};
