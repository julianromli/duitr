/**
 * EditCategoryPage - Refactored to use CategoryService
 * 
 * Improvements:
 * - Uses useCategories hook (single source of truth)
 * - Simplified form (single name field, auto category_key)
 * - Added color picker
 * - Shows only user's custom categories
 * - Consistent with Quick Create UX
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  ChevronLeft, 
  Edit, 
  Trash2,
  Plus,
  Check,
  X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import IconSelector, { getIconComponent } from '@/components/shared/IconSelector';
import { useCategories } from '@/hooks/useCategories';
import type { Category } from '@/types/category';

// Color options (same as CategorySelector for consistency)
const CATEGORY_COLORS = [
  '#EF4444', // red
  '#F97316', // orange  
  '#F59E0B', // amber
  '#22C55E', // green
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#EC4899', // pink
  '#6B7280'  // gray
];

// Form data interface
interface CategoryFormData {
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
}

const EditCategoryPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // Use Categories Hook
  const {
    getCustomCategories,
    getDisplayName,
    createCategory,
    updateCategory,
    deleteCategory: deleteCategoryHook,
    isCreating,
    isUpdating,
    isDeleting
  } = useCategories();

  // Get only custom categories (user's own)
  const customCategories = getCustomCategories();
  
  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [isNewCategory, setIsNewCategory] = useState(false);
  
  // Form state - simplified!
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    type: 'expense',
    icon: 'circle',
    color: '#6B7280'
  });
  
  // Function to render an icon by its name
  const renderIcon = (iconName: string) => {
    const IconComponent = getIconComponent(iconName);
    return <IconComponent className="h-4 w-4" />;
  };
  
  // Handle adding a new category
  const handleAddCategory = () => {
    setIsNewCategory(true);
    setCurrentCategory(null);
    setFormData({
      name: '',
      type: 'expense',
      icon: 'circle',
      color: '#6B7280'
    });
    setEditDialogOpen(true);
  };
  
  // Handle editing an existing category
  const handleEditCategory = (category: Category) => {
    setIsNewCategory(false);
    setCurrentCategory(category);
    setFormData({
      name: getDisplayName(category),
      type: category.type,
      icon: category.icon || 'circle',
      color: category.color || '#6B7280'
    });
    setEditDialogOpen(true);
  };
  
  // Handle deleting a category
  const handleDeleteCategory = (category: Category) => {
    setCurrentCategory(category);
    setDeleteDialogOpen(true);
  };
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };
  
  // Save category (add or update)
  const handleSave = () => {
    // Validate
    if (!formData.name.trim()) {
      return;
    }
    
    if (isNewCategory) {
      // Create new category
      createCategory({
        name: formData.name.trim(),
        type: formData.type,
        icon: formData.icon,
        color: formData.color
      });
    } else if (currentCategory) {
      // Update existing category
      updateCategory({
        id: currentCategory.category_id,
        input: {
          name: formData.name.trim(),
          icon: formData.icon,
          color: formData.color
        }
      });
    }
    
    setEditDialogOpen(false);
  };
  
  // Delete category
  const handleDelete = () => {
    if (!currentCategory) return;
    
    deleteCategoryHook(currentCategory.category_id);
    setDeleteDialogOpen(false);
  };
  
  return (
    <div className="max-w-md mx-auto bg-[#1C2526] min-h-screen pb-24 text-white px-2">
      <div className="p-6 pt-12">
        <div className="flex items-center mb-6">
          <button onClick={() => navigate('/')} className="mr-4">
            <ChevronLeft size={24} className="text-white" />
          </button>
          <h1 className="text-white text-xl font-bold">
            {t('categories.management', 'Category Management')}
          </h1>
        </div>
        
        <div className="mb-4">
          <Button 
            onClick={handleAddCategory}
            className="bg-[#C6FE1E] text-black hover:bg-[#B0E018]"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('categories.addNew', 'Add New')}
          </Button>
        </div>
        
        {/* Custom Categories Table */}
        <div className="rounded-md border border-[#2A3435] overflow-hidden">
          <Table>
            <TableHeader className="bg-[#2A3435]">
              <TableRow>
                <TableHead className="text-white">{t('categories.name', 'Name')}</TableHead>
                <TableHead className="text-white">{t('categories.type', 'Type')}</TableHead>
                <TableHead className="text-white">{t('categories.icon', 'Icon')}</TableHead>
                <TableHead className="text-white">{t('common.edit', 'Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-400 py-8">
                    <div className="flex flex-col items-center gap-2">
                      <p>{t('categories.noCustomCategories', 'No Custom Categories Yet')}</p>
                      <p className="text-sm text-gray-500">
                        {t('categories.noCustomCategoriesDescription', 'Create your first category to better organize your transactions.')}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                customCategories.map((category) => (
                  <TableRow key={category.category_id} className="border-b border-[#2A3435]">
                    <TableCell className="text-white">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 flex items-center justify-center rounded-full"
                          style={{ backgroundColor: category.color || '#6B7280' }}
                        >
                          {renderIcon(category.icon || 'circle')}
                        </div>
                        <span>{getDisplayName(category)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-white">
                      <span className="capitalize">
                        {t(`categories.${category.type}`, category.type)}
                      </span>
                    </TableCell>
                    <TableCell className="text-white">
                      <div className="flex items-center justify-center w-8 h-8 bg-white/10 rounded-full">
                        {renderIcon(category.icon || 'circle')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditCategory(category)}
                          className="text-white hover:bg-[#2A3435]"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteCategory(category)}
                          className="text-red-500 hover:bg-[#2A3435] hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Edit/Add Category Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="bg-[#1C2526] text-white border-[#2A3435] max-w-md">
            <DialogHeader>
              <DialogTitle>
                {isNewCategory 
                  ? t('categories.createNew', 'Create New Category') 
                  : t('categories.editCategory', 'Edit Category')}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Category Name */}
              <div className="space-y-2">
                <Label htmlFor="name">{t('categories.name', 'Category Name')}</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="bg-[#2A3435] border-[#2A3435] text-white"
                  placeholder={t('categories.namePlaceholder', 'e.g., Groceries, Salary, Investment')}
                  maxLength={50}
                  autoFocus
                />
              </div>
              
              {/* Category Type */}
              <div className="space-y-2">
                <Label htmlFor="type">{t('categories.type', 'Type')}</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'income' | 'expense') => setFormData({ ...formData, type: value })}
                  disabled={!isNewCategory} // Can't change type when editing
                >
                  <SelectTrigger className="bg-[#2A3435] border-[#2A3435] text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2A3435] border-[#2A3435] text-white">
                    <SelectItem value="expense" className="text-white">
                      {t('categories.expense', 'Expense')}
                    </SelectItem>
                    <SelectItem value="income" className="text-white">
                      {t('categories.income', 'Income')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Icon Selector */}
              <div className="space-y-2">
                <IconSelector
                  selectedIcon={formData.icon}
                  onIconChange={(iconName) => setFormData({ ...formData, icon: iconName })}
                  variant="dropdown"
                  label={t('categories.icon', 'Icon')}
                />
              </div>
              
              {/* Color Picker */}
              <div className="space-y-2">
                <Label>{t('categories.color', 'Color')}</Label>
                <div className="grid grid-cols-4 gap-2">
                  {CATEGORY_COLORS.map((color) => (
                    <Button
                      key={color}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData({ ...formData, color })}
                      className="h-10 w-full p-0 border-2 hover:scale-105 transition-transform"
                      style={{ 
                        backgroundColor: formData.color === color ? color : 'transparent',
                        borderColor: formData.color === color ? color : '#2A3435'
                      }}
                    >
                      <div 
                        className="h-6 w-6 rounded-full" 
                        style={{ backgroundColor: color }}
                      />
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                className="border-[#2A3435] text-white hover:bg-[#2A3435]"
                disabled={isCreating || isUpdating}
              >
                <X className="h-4 w-4 mr-2" />
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button
                onClick={handleSave}
                className="bg-[#C6FE1E] text-black hover:bg-[#B0E018]"
                disabled={!formData.name.trim() || isCreating || isUpdating}
              >
                <Check className="h-4 w-4 mr-2" />
                {isCreating || isUpdating 
                  ? t('common.saving', 'Saving...') 
                  : t('common.save', 'Save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className="bg-[#1C2526] text-white border-[#2A3435]">
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t('categories.deleteConfirmTitle', 'Delete Category')}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                {currentCategory && t('categories.deleteConfirmDescription', {
                  name: getDisplayName(currentCategory),
                  defaultValue: `Are you sure you want to delete the category '${getDisplayName(currentCategory)}'? This action cannot be undone.`
                })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel 
                className="bg-[#2A3435] text-white border-[#2A3435] hover:bg-[#3A4445] hover:text-white"
                disabled={isDeleting}
              >
                {t('common.cancel', 'Cancel')}
              </AlertDialogCancel>
              <AlertDialogAction 
                className="bg-red-600 text-white hover:bg-red-700"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? t('common.deleting', 'Deleting...') : t('common.delete', 'Delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default EditCategoryPage;
