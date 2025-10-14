/**
 * CategoryService - Single Source of Truth for Category Operations
 * 
 * This service handles ALL category-related database operations.
 * No hardcoded categories - database is the only source.
 * 
 * Features:
 * - CRUD operations for categories
 * - Bilingual support (English/Indonesian)
 * - User custom categories
 * - Translation helpers
 */

import { supabase } from '@/lib/supabase';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '@/types/category';

class CategoryService {
  /**
   * Get all categories (default + user custom)
   * @param userId - If provided, includes user's custom categories alongside defaults
   * @returns Array of categories with BOTH en_name and id_name
   */
  async getAll(userId?: string): Promise<Category[]> {
    const query = supabase
      .from('categories')
      .select('*')
      .order('type')
      .order('en_name');

    if (userId) {
      // Get default categories (user_id IS NULL) + user's custom categories
      query.or(`user_id.is.null,user_id.eq.${userId}`);
    } else {
      // Get default categories only
      query.is('user_id', null);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Error fetching categories:', error);
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }
    
    return data || [];
  }

  /**
   * Get categories filtered by transaction type
   * @param type - 'income' or 'expense'
   * @param userId - Optional user ID to include custom categories
   */
  async getByType(type: 'income' | 'expense', userId?: string): Promise<Category[]> {
    const categories = await this.getAll(userId);
    return categories.filter(cat => cat.type === type);
  }

  /**
   * Get single category by ID
   * @param id - Category ID (integer)
   * @returns Category or null if not found
   */
  async getById(id: number): Promise<Category | null> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('category_id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found - this is expected sometimes
        return null;
      }
      console.error('Error fetching category by ID:', error);
      throw new Error(`Failed to fetch category: ${error.message}`);
    }
    
    return data;
  }

  /**
   * Create user custom category
   * For custom categories, same name is used for both languages initially
   * 
   * @param input - Category creation data
   * @param userId - User ID who owns this category
   * @returns Created category
   */
  async create(input: CreateCategoryInput, userId: string): Promise<Category> {
    const categoryName = input.name.trim();
    
    if (!categoryName) {
      throw new Error('Category name is required');
    }

    if (!['income', 'expense'].includes(input.type)) {
      throw new Error('Invalid category type. Must be "income" or "expense"');
    }

    const { data, error } = await supabase
      .from('categories')
      .insert({
        en_name: categoryName,
        id_name: categoryName, // Same name for both languages for custom categories
        type: input.type,
        category_key: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        icon: input.icon || 'circle',
        color: input.color || '#6B7280',
        user_id: userId
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating category:', error);
      
      // Check for duplicate key
      if (error.code === '23505') {
        throw new Error('A category with this name already exists');
      }
      
      throw new Error(`Failed to create category: ${error.message}`);
    }
    
    return data;
  }

  /**
   * Update category (user custom only)
   * Can only update categories owned by the user
   * 
   * @param id - Category ID to update
   * @param input - Fields to update
   * @param userId - User ID (must be owner)
   * @returns Updated category
   */
  async update(id: number, input: UpdateCategoryInput, userId: string): Promise<Category> {
    const updateData: any = {};
    
    if (input.name) {
      const trimmedName = input.name.trim();
      if (!trimmedName) {
        throw new Error('Category name cannot be empty');
      }
      // Update both language names
      updateData.en_name = trimmedName;
      updateData.id_name = trimmedName;
    }
    
    if (input.icon) {
      updateData.icon = input.icon;
    }
    
    if (input.color) {
      updateData.color = input.color;
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error('No fields to update');
    }

    const { data, error } = await supabase
      .from('categories')
      .update(updateData)
      .eq('category_id', id)
      .eq('user_id', userId) // Can only update own categories
      .select()
      .single();

    if (error) {
      console.error('Error updating category:', error);
      
      if (error.code === 'PGRST116') {
        throw new Error('Category not found or you do not have permission to update it');
      }
      
      throw new Error(`Failed to update category: ${error.message}`);
    }
    
    return data;
  }

  /**
   * Delete category (user custom only)
   * Will fail if category is in use due to FK constraint
   * 
   * @param id - Category ID to delete
   * @param userId - User ID (must be owner)
   */
  async delete(id: number, userId: string): Promise<void> {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('category_id', id)
      .eq('user_id', userId); // Can only delete own categories

    if (error) {
      console.error('Error deleting category:', error);
      
      // FK constraint violation - category is in use
      if (error.code === '23503') {
        throw new Error('Cannot delete category that is being used in transactions or budgets');
      }
      
      if (error.code === 'PGRST116') {
        throw new Error('Category not found or you do not have permission to delete it');
      }
      
      throw new Error(`Failed to delete category: ${error.message}`);
    }
  }

  /**
   * Get localized display name based on language
   * THIS IS THE METHOD to use for displaying category names
   * 
   * @param category - Category object
   * @param language - 'en' or 'id'
   * @returns Localized category name
   */
  getDisplayName(category: Category, language: 'en' | 'id'): string {
    return language === 'id' ? category.id_name : category.en_name;
  }

  /**
   * Check if category exists
   * @param id - Category ID to check
   * @returns True if exists, false otherwise
   */
  async exists(id: number): Promise<boolean> {
    try {
      const category = await this.getById(id);
      return category !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Search categories by name (searches both languages)
   * Useful for search/filter functionality
   * 
   * @param query - Search term
   * @param userId - Optional user ID to include custom categories
   * @returns Matching categories
   */
  async search(query: string, userId?: string): Promise<Category[]> {
    const categories = await this.getAll(userId);
    const searchLower = query.toLowerCase().trim();
    
    if (!searchLower) {
      return categories;
    }
    
    return categories.filter(cat => 
      cat.en_name.toLowerCase().includes(searchLower) ||
      cat.id_name.toLowerCase().includes(searchLower)
    );
  }

  /**
   * Get system transfer category
   * Used for transfer transactions
   * @returns Transfer category
   */
  async getTransferCategory(): Promise<Category> {
    const category = await this.getById(18); // system_transfer
    
    if (!category) {
      throw new Error('System transfer category not found. Database may be corrupted.');
    }
    
    return category;
  }

  /**
   * Validate category ID exists and belongs to correct type
   * @param categoryId - Category ID to validate
   * @param expectedType - Expected type ('income' or 'expense')
   * @returns True if valid, throws error otherwise
   */
  async validateCategory(categoryId: number, expectedType?: 'income' | 'expense'): Promise<boolean> {
    const category = await this.getById(categoryId);
    
    if (!category) {
      throw new Error(`Category with ID ${categoryId} not found`);
    }
    
    if (expectedType && category.type !== expectedType) {
      throw new Error(
        `Invalid category type. Expected ${expectedType}, got ${category.type}`
      );
    }
    
    return true;
  }
}

// Export singleton instance
export const categoryService = new CategoryService();
export default categoryService;
