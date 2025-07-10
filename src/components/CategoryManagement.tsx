// Component: CategoryManagement
// Description: Allows users to manage their custom categories in settings
// Provides CRUD operations for user-specific categories with proper validation

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, Edit2, Trash2, Circle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCategories } from '@/hooks/useCategories';
import { Category } from '@/types/categories';
import IconSelector, { getIconComponent, iconNameMap } from '@/components/shared/IconSelector';

// Helper function to normalize icon names for compatibility
const normalizeIconName = (iconName: string): string => {
  // Convert PascalCase to kebab-case if needed
  return iconNameMap[iconName] || iconName || 'circle';
};

// Available colors for categories
const availableColors = [
  '#EF4444', '#F97316', '#F59E0B', '#EAB308',
  '#84CC16', '#22C55E', '#10B981', '#14B8A6',
  '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
  '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
  '#F43F5E', '#6B7280', '#374151', '#1F2937'
];

interface CategoryFormData {
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
}

interface CategoryFormProps {
  formData: CategoryFormData;
  setFormData: (data: CategoryFormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isLoading: boolean;
  submitText: string;
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  formData,
  setFormData,
  onSubmit,
  onCancel,
  isLoading,
  submitText
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-foreground">Nama Kategori</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Masukkan nama kategori"
          className="bg-input text-foreground border-border"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-foreground">Jenis Kategori</Label>
        <Select
          value={formData.type}
          onValueChange={(value: 'income' | 'expense') => setFormData({ ...formData, type: value })}
        >
          <SelectTrigger className="bg-input text-foreground border-border">
            <SelectValue placeholder="Pilih jenis kategori" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            <SelectItem value="income" className="text-base py-3">
              Pemasukan
            </SelectItem>
            <SelectItem value="expense" className="text-base py-3">
              Pengeluaran
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <IconSelector
        selectedIcon={normalizeIconName(formData.icon)}
        onIconChange={(iconName) => setFormData({ ...formData, icon: iconName })}
        variant="grid"
        label="Ikon"
      />

      <div className="space-y-2">
        <Label className="text-foreground">Warna</Label>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {availableColors.map((color) => (
            <Button
              key={color}
              type="button"
              className={`h-8 w-8 p-0 rounded-full border-2 ${
                formData.color === color ? 'border-primary' : 'border-border'
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setFormData({ ...formData, color })}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2 sm:justify-end pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="w-full sm:w-auto bg-card text-card-foreground border-border hover:bg-muted-foreground hover:text-primary"
        >
          {t('common.cancel')}
        </Button>
        <Button
          type="button"
          onClick={onSubmit}
          disabled={!formData.name.trim() || isLoading}
          className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {submitText}
        </Button>
      </div>
    </div>
  );
};

const CategoryManagement: React.FC = () => {
  const { t } = useTranslation();
  const {
    categories,
    getCustomCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    isCreating,
    isUpdating,
    isDeleting,
  } = useCategories();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    type: 'expense',
    icon: 'circle',
    color: '#6B7280'
  });

  const customCategories = getCustomCategories();
  const incomeCategories = customCategories.filter(cat => cat.type === 'income');
  const expenseCategories = customCategories.filter(cat => cat.type === 'expense');

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'expense',
      icon: 'circle',
      color: '#6B7280'
    });
  };

  const handleCreateCategory = async () => {
    if (!formData.name.trim()) return;

    try {
      await createCategory({
        name: formData.name.trim(),
        type: formData.type,
        icon: formData.icon,
        color: formData.color
      });
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creating category:', error);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.en_name,
      type: category.type as 'income' | 'expense',
      icon: normalizeIconName(category.icon || 'circle'),
      color: category.color || '#6B7280'
    });
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !formData.name.trim()) return;

    try {
      await updateCategory({
        id: editingCategory.id,
        name: formData.name.trim(),
        icon: formData.icon,
        color: formData.color
      });
      setEditingCategory(null);
      resetForm();
    } catch (error) {
      console.error('Error updating category:', error);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await deleteCategory(categoryId);
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const openDeleteDialog = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (categoryToDelete) {
      await handleDeleteCategory(categoryToDelete.id);
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    }
  };

  // Use the shared getIconComponent function
  const getCategoryIconComponent = (iconName: string) => {
    return getIconComponent(normalizeIconName(iconName));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6">
        <h2 className="text-2xl font-bold text-foreground">Manajemen Kategori</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Baru
        </Button>
      </div>

      {/* Create Category Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Buat Kategori Baru</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Buat kategori kustom untuk mengorganisir transaksi Anda dengan lebih baik.
            </DialogDescription>
          </DialogHeader>
          <CategoryForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleCreateCategory}
            onCancel={() => {
              setIsCreateDialogOpen(false);
              resetForm();
            }}
            isLoading={isCreating}
            submitText={isCreating ? t('common.creating') : t('common.create')}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={(open) => {
        if (!open) {
          setEditingCategory(null);
          resetForm();
        }
      }}>
        <DialogContent className="bg-card text-card-foreground border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Kategori</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Ubah detail kategori yang sudah ada.
            </DialogDescription>
          </DialogHeader>
          <CategoryForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleUpdateCategory}
            onCancel={() => {
              setEditingCategory(null);
              resetForm();
            }}
            isLoading={isUpdating}
            submitText={isUpdating ? t('common.updating') : t('common.update')}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card text-card-foreground border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Hapus Kategori</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
                Apakah Anda yakin ingin menghapus kategori "{categoryToDelete?.en_name || ''}"? Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-card text-card-foreground border-border hover:bg-muted-foreground hover:text-primary">
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? t('common.deleting') : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Categories Lists */}
      <div className="space-y-8">
        {/* Expense Categories */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground">Kategori Pengeluaran</h3>
          {expenseCategories.length > 0 ? (
            <div className="space-y-2">
              {expenseCategories.map((category) => {
                const IconComponent = getCategoryIconComponent(category.icon || 'circle');
                return (
                  <div
                    key={category.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-card rounded-lg border border-border space-y-3 sm:space-y-0"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: category.color || '#6B7280' }}
                      >
                        <IconComponent className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-card-foreground font-medium truncate">{category.en_name}</span>
                    </div>
                    <div className="flex space-x-1 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditCategory(category)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(category)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">{t('categories.noExpenseCategories')}</p>
          )}
        </div>

        {/* Income Categories */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-foreground">Kategori Pemasukan</h3>
          {incomeCategories.length > 0 ? (
            <div className="space-y-2">
              {incomeCategories.map((category) => {
                  const IconComponent = getCategoryIconComponent(category.icon || 'circle');
                return (
                  <div
                    key={category.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-card rounded-lg border border-border space-y-3 sm:space-y-0"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: category.color || '#6B7280' }}
                      >
                        <IconComponent className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-card-foreground font-medium truncate">{category.en_name}</span>
                    </div>
                    <div className="flex space-x-1 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditCategory(category)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeleteDialog(category)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Belum ada kategori pemasukan kustom.</p>
          )}
        </div>
      </div>

      {/* Empty State */}
      {customCategories.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <Plus className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Belum Ada Kategori Kustom</h3>
          <p className="text-muted-foreground mb-4">Anda belum membuat kategori kustom. Buat kategori pertama Anda untuk mengorganisir transaksi dengan lebih baik.</p>
          <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
            Buat Kategori Pertama
          </Button>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;