import React, { useState, useEffect } from 'react';
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
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeftRight, 
  ChevronLeft, 
  Circle, 
  Edit, 
  ShoppingCart, 
  Trash2,
  Utensils,
  Plus,
  Check,
  X,
  Home, 
  Coffee, 
  Car, 
  Briefcase, 
  DollarSign,
  Gift, 
  Package, 
  Heart, 
  Plane, 
  Film,
  Settings, 
  Book, 
  Monitor, 
  Smartphone, 
  CreditCard,
  HelpCircle, 
  ShoppingBag, 
  Zap, 
  User, 
  Music,
  Pill, 
  Baby, 
  BusFront, 
  Shirt, 
  ArrowUpDown,
  Coins, 
  Building2, 
  LineChart, 
  Wallet
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

// Define a map for icons
const iconMap: Record<string, React.ComponentType> = {
  ShoppingCart,
  Utensils,
  ArrowLeftRight,
  Circle,
  Home, 
  Coffee, 
  Car, 
  Briefcase, 
  DollarSign,
  Gift, 
  Package, 
  Heart, 
  Plane, 
  Film,
  Settings, 
  Book, 
  Monitor, 
  Smartphone, 
  CreditCard,
  HelpCircle, 
  ShoppingBag, 
  Zap, 
  User, 
  Music,
  Pill, 
  Baby, 
  BusFront, 
  Shirt, 
  ArrowUpDown,
  Coins, 
  Building2, 
  LineChart, 
  Wallet
};

// Define a category interface
interface Category {
  id: string;
  category_key: string;
  en_name: string;
  id_name: string;
  type: 'expense' | 'income' | 'system';
  icon: string | null;
  created_at: string | null;
}

const EditCategoryPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [isNewCategory, setIsNewCategory] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    category_key: '',
    en_name: '',
    id_name: '',
    type: 'expense' as 'expense' | 'income' | 'system',
    icon: 'Circle'
  });
  
  // Available icons for categories
  const availableIcons = Object.keys(iconMap);
  
  // Function to render an icon by its name
  const renderIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName] || Circle;
    return <IconComponent className="h-5 w-5" />;
  };
  
  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories();
  }, []);
  
  // Fetch all categories from Supabase
  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('type')
        .order('en_name');
      
      if (error) throw error;
      
      if (data) {
        setCategories(data as Category[]);
      } else {
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: t('common.error'),
        description: t('categories.error.load', 'Failed to load categories'),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle adding a new category
  const handleAddCategory = () => {
    setIsNewCategory(true);
    setCurrentCategory(null);
    setFormData({
      category_key: '',
      en_name: '',
      id_name: '',
      type: 'expense',
      icon: 'Circle'
    });
    setEditDialogOpen(true);
  };
  
  // Handle editing an existing category
  const handleEditCategory = (category: Category) => {
    setIsNewCategory(false);
    setCurrentCategory(category);
    setFormData({
      category_key: category.category_key,
      en_name: category.en_name,
      id_name: category.id_name,
      type: category.type,
      icon: category.icon || 'Circle'
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
  
  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    if (name === 'type' && value === 'system') {
      // Auto-populate for system type
      setFormData({
        ...formData,
        [name]: value as any,
        category_key: 'system_custom',
        en_name: 'System',
        id_name: 'Sistem'
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };
  
  // Save category (add or update)
  const saveCategory = async () => {
    // Validate form data
    if (!formData.category_key || !formData.en_name || !formData.id_name || !formData.type) {
      toast({
        title: t('common.error'),
        description: t('categories.error.requiredFields', 'All fields are required'),
        variant: 'destructive'
      });
      return;
    }
    
    // Ensure category_key follows the pattern type_name (e.g., expense_groceries)
    if (!formData.category_key.includes('_')) {
      const prefix = formData.type === 'system' ? 'system_' : 
                    formData.type === 'income' ? 'income_' : 'expense_';
      setFormData({ ...formData, category_key: `${prefix}${formData.category_key}` });
    }
    
    try {
      if (isNewCategory) {
        // Add new category
        const { data, error } = await supabase
          .from('categories')
          .insert([
            { 
              category_key: formData.category_key,
              en_name: formData.en_name,
              id_name: formData.id_name,
              type: formData.type,
              icon: formData.icon
            }
          ])
          .select();
        
        if (error) throw error;
        
        toast({
          title: t('common.success'),
          description: t('categories.successAdd', 'Category added successfully')
        });
      } else if (currentCategory) {
        // Update existing category
        const { error } = await supabase
          .from('categories')
          .update({ 
            category_key: formData.category_key,
            en_name: formData.en_name,
            id_name: formData.id_name,
            type: formData.type,
            icon: formData.icon
          })
          .eq('id', currentCategory.id);
        
        if (error) throw error;
        
        toast({
          title: t('common.success'),
          description: t('categories.successUpdate', 'Category updated successfully')
        });
      }
      
      // Refresh category list
      fetchCategories();
      setEditDialogOpen(false);
    } catch (error: any) {
      console.error('Error saving category:', error);
      toast({
        title: t('common.error'),
        description: error.message || t('categories.error.save', 'Failed to save category'),
        variant: 'destructive'
      });
    }
  };
  
  // Delete category
  const deleteCategory = async () => {
    if (!currentCategory) return;
    
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', currentCategory.id);
      
      if (error) throw error;
      
      toast({
        title: t('common.success'),
        description: t('categories.successDelete', 'Category deleted successfully')
      });
      
      // Refresh category list
      fetchCategories();
      setDeleteDialogOpen(false);
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast({
        title: t('common.error'),
        description: error.message || t('categories.error.delete', 'Failed to delete category'),
        variant: 'destructive'
      });
    }
  };
  
  return (
    <div className="flex-1 bg-[#1C2526] p-5 min-h-screen pb-24">
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
          {t('categories.add', 'Add Category')}
        </Button>
      </div>
      
      {/* Categories Table */}
      <div className="rounded-md border border-[#2A3435] overflow-hidden">
        <Table>
          <TableHeader className="bg-[#2A3435]">
            <TableRow>
              <TableHead className="text-white">Key</TableHead>
              <TableHead className="text-white">English Name</TableHead>
              <TableHead className="text-white">Indonesian Name</TableHead>
              <TableHead className="text-white">Type</TableHead>
              <TableHead className="text-white">Icon</TableHead>
              <TableHead className="text-white">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-white py-4">
                  Loading...
                </TableCell>
              </TableRow>
            ) : categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-white py-4">
                  No categories found
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id} className="border-b border-[#2A3435]">
                  <TableCell className="text-white">{category.category_key}</TableCell>
                  <TableCell className="text-white">{category.en_name}</TableCell>
                  <TableCell className="text-white">{category.id_name}</TableCell>
                  <TableCell className="text-white capitalize">{category.type}</TableCell>
                  <TableCell className="text-black">
                    <div className="bg-[#C6FE1E] w-8 h-8 flex items-center justify-center rounded-full">
                      {category.icon ? renderIcon(category.icon) : <Circle className="h-4 w-4" />}
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
        <DialogContent className="bg-[#1C2526] text-white border-[#2A3435]">
          <DialogHeader>
            <DialogTitle>
              {isNewCategory 
                ? t('categories.add', 'Add Category') 
                : t('categories.edit', 'Edit Category')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="category_key">Category Key</Label>
              <Input
                id="category_key"
                name="category_key"
                value={formData.category_key}
                onChange={handleInputChange}
                className="bg-[#2A3435] border-[#2A3435] text-white"
                placeholder="expense_groceries"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="en_name">English Name</Label>
              <Input
                id="en_name"
                name="en_name"
                value={formData.en_name}
                onChange={handleInputChange}
                className="bg-[#2A3435] border-[#2A3435] text-white"
                placeholder="Groceries"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="id_name">Indonesian Name</Label>
              <Input
                id="id_name"
                name="id_name"
                value={formData.id_name}
                onChange={handleInputChange}
                className="bg-[#2A3435] border-[#2A3435] text-white"
                placeholder="Kebutuhan Rumah"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleSelectChange('type', value)}
              >
                <SelectTrigger className="bg-[#2A3435] border-[#2A3435] text-white">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-[#2A3435] border-[#2A3435] text-white">
                  <SelectItem value="expense" className="text-white">Expense</SelectItem>
                  <SelectItem value="income" className="text-white">Income</SelectItem>
                  <SelectItem value="system" className="text-white">System</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="icon">Icon</Label>
              <Select
                value={formData.icon}
                onValueChange={(value) => handleSelectChange('icon', value)}
              >
                <SelectTrigger className="bg-[#2A3435] border-[#2A3435] text-white">
                  <SelectValue placeholder="Select icon">
                    <div className="flex items-center">
                      {renderIcon(formData.icon)}
                      <span className="ml-2">{formData.icon}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[#2A3435] border-[#2A3435] text-white max-h-[300px] overflow-y-auto">
                  {availableIcons.map((icon) => (
                    <SelectItem key={icon} value={icon} className="text-white">
                      <div className="flex items-center">
                        {renderIcon(icon)}
                        <span className="ml-2">{icon}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="pt-2">
                <div className="bg-[#C6FE1E] w-10 h-10 flex items-center justify-center rounded-full">
                  {renderIcon(formData.icon)}
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              className="border-[#2A3435] text-white hover:bg-[#2A3435]"
            >
              <X className="h-4 w-4 mr-2" />
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              onClick={saveCategory}
              className="bg-[#C6FE1E] text-black hover:bg-[#B0E018]"
            >
              <Check className="h-4 w-4 mr-2" />
              {t('common.save', 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#1C2526] text-white border-[#2A3435]">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('categories.confirmDelete', 'Confirm Deletion')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              {t('categories.deleteWarning', 'Are you sure you want to delete this category? This action cannot be undone.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[#2A3435] text-white border-[#2A3435] hover:bg-[#3A4445] hover:text-white">
              {t('common.cancel', 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={deleteCategory}
            >
              {t('common.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EditCategoryPage; 