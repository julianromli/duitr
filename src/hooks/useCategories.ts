/**
 * useCategories Hook
 * 
 * Simplified React Query wrapper around CategoryService.
 * Provides translation-aware category management.
 * 
 * Key Features:
 * - Automatic caching with React Query
 * - Translation helpers (getDisplayName)
 * - CRUD operations with optimistic updates
 * - No hardcoded fallbacks - database is the only source
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import categoryService from '@/services/categoryService';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '@/types/category';

/**
 * useCategories Hook
 * Simplified React Query wrapper around CategoryService
 */
export const useCategories = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();

  // Current language from i18n
  const currentLanguage = i18n.language as 'en' | 'id';

  // Fetch all categories (returns BOTH language names)
  const {
    data: categories = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['categories', user?.id],
    queryFn: () => categoryService.getAll(user?.id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000 // 10 minutes
  });

  // Helper: Get display name for a category based on current language
  const getDisplayName = (category: Category): string => {
    return categoryService.getDisplayName(category, currentLanguage);
  };

  // Helper: Filter by type
  const getByType = (type: 'income' | 'expense'): Category[] => {
    return categories.filter(cat => cat.type === type);
  };

  // Helper: Get custom categories only
  const getCustomCategories = (): Category[] => {
    return categories.filter(cat => cat.user_id === user?.id);
  };

  // Helper: Get default categories only
  const getDefaultCategories = (): Category[] => {
    return categories.filter(cat => !cat.user_id);
  };

  // Helper: Find category by ID
  const findById = (id: number): Category | undefined => {
    return categories.find(cat => cat.category_id === id);
  };

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (input: CreateCategoryInput) => 
      categoryService.create(input, user!.id),
    onSuccess: (newCategory) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({ 
        title: t('categories.created'),
        description: t('categories.createSuccess', { 
          name: getDisplayName(newCategory) 
        })
      });
    },
    onError: (error: Error) => {
      toast({ 
        variant: 'destructive', 
        title: t('categories.createError'),
        description: error.message
      });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateCategoryInput }) =>
      categoryService.update(id, input, user!.id),
    onSuccess: (updatedCategory) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({ 
        title: t('categories.updated'),
        description: t('categories.updateSuccess', { 
          name: getDisplayName(updatedCategory) 
        })
      });
    },
    onError: (error: Error) => {
      toast({ 
        variant: 'destructive',
        title: t('categories.updateError'),
        description: error.message
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => categoryService.delete(id, user!.id),
    onSuccess: (_, deletedId) => {
      const deletedCategory = categories.find(cat => cat.category_id === deletedId);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({ 
        title: t('categories.deleted'),
        description: t('categories.deleteSuccess', { 
          name: deletedCategory ? getDisplayName(deletedCategory) : 'Category' 
        })
      });
    },
    onError: (error: Error) => {
      toast({
        variant: 'destructive',
        title: t('categories.deleteError'),
        description: error.message
      });
    }
  });

  return {
    // Data
    categories,
    isLoading,
    error,
    currentLanguage,
    
    // Helpers
    getDisplayName,
    getByType,
    getCustomCategories,
    getDefaultCategories,
    findById,
    
    // Actions
    createCategory: createMutation.mutate,
    updateCategory: updateMutation.mutate,
    deleteCategory: deleteMutation.mutate,
    refetch, // Refetch categories from database
    
    // Loading states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  };
};

export default useCategories;