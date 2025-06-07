
// Fixed EditCategoryPage to handle category data structure from database properly
// Added proper type casting and mapping for categories

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Save, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import CategoryIcon from '@/components/shared/CategoryIcon';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Define proper category type to match database structure
interface Category {
  id: string;
  category_id?: number;
  category_key?: string;
  en_name: string;
  id_name: string;
  type?: string;
  icon?: string;
  created_at?: string;
}

const EditCategoryPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  
  const [category, setCategory] = useState<Category | null>(null);
  const [enName, setEnName] = useState('');
  const [idName, setIdName] = useState('');
  const [icon, setIcon] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Available icons
  const availableIcons = [
    'ShoppingCart', 'Utensils', 'Car', 'Home', 'Briefcase', 'DollarSign',
    'Gift', 'Package', 'Heart', 'Plane', 'Music', 'Book', 'ArrowLeftRight',
    'LineChart', 'ShoppingBag', 'Zap', 'User', 'Pill', 'Baby', 'Coins',
    'Building2', 'Wallet', 'Circle'
  ];

  useEffect(() => {
    if (id) {
      fetchCategory();
    }
  }, [id]);

  const fetchCategory = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('categories')
        .select('category_id, category_key, created_at, en_name, icon, id_name, type')
        .eq('category_id', id)
        .single();

      if (error) {
        console.error('Error fetching category:', error);
        toast({
          title: t('common.error'),
          description: t('categories.fetch_error'),
          variant: 'destructive',
        });
        navigate('/budget');
        return;
      }

      if (data) {
        // Map the database structure to our Category interface
        const mappedCategory: Category = {
          id: String(data.category_id),
          category_id: data.category_id,
          category_key: data.category_key,
          en_name: data.en_name,
          id_name: data.id_name,
          type: data.type,
          icon: data.icon,
          created_at: data.created_at
        };
        
        setCategory(mappedCategory);
        setEnName(mappedCategory.en_name);
        setIdName(mappedCategory.id_name);
        setIcon(mappedCategory.icon || '');
        setType(mappedCategory.type as 'income' | 'expense' || 'expense');
      }
    } catch (err) {
      console.error('Error fetching category:', err);
      toast({
        title: t('common.error'),
        description: t('categories.fetch_error'),
        variant: 'destructive',
      });
      navigate('/budget');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!category || !enName.trim() || !idName.trim()) {
      toast({
        title: t('common.error'),
        description: t('categories.validation_error'),
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase
        .from('categories')
        .update({
          en_name: enName.trim(),
          id_name: idName.trim(),
          icon: icon || null,
          type: type,
        })
        .eq('category_id', category.category_id);

      if (error) {
        throw error;
      }

      toast({
        title: t('common.success'),
        description: t('categories.update_success'),
      });

      navigate('/budget');
    } catch (err) {
      console.error('Error updating category:', err);
      toast({
        title: t('common.error'),
        description: t('categories.update_error'),
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!category) return;

    try {
      // Check if category is used in transactions or budgets
      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select('id')
        .eq('category_id', category.category_id)
        .limit(1);

      if (transError) {
        throw transError;
      }

      if (transactions && transactions.length > 0) {
        toast({
          title: t('common.error'),
          description: t('categories.delete_used_error'),
          variant: 'destructive',
        });
        return;
      }

      const { data: budgets, error: budgetError } = await supabase
        .from('budgets')
        .select('id')
        .eq('category_id', category.category_id)
        .limit(1);

      if (budgetError) {
        throw budgetError;
      }

      if (budgets && budgets.length > 0) {
        toast({
          title: t('common.error'),
          description: t('categories.delete_used_error'),
          variant: 'destructive',
        });
        return;
      }

      // Delete the category
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('category_id', category.category_id);

      if (error) {
        throw error;
      }

      toast({
        title: t('common.success'),
        description: t('categories.delete_success'),
      });

      navigate('/budget');
    } catch (err) {
      console.error('Error deleting category:', err);
      toast({
        title: t('common.error'),
        description: t('categories.delete_error'),
        variant: 'destructive',
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto bg-[#0D0D0D] min-h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C6FE1E] mx-auto mb-4"></div>
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="max-w-md mx-auto bg-[#0D0D0D] min-h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-red-500 mb-4">{t('categories.not_found')}</p>
          <Button onClick={() => navigate('/budget')} className="bg-[#C6FE1E] text-black">
            {t('common.back')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="max-w-md mx-auto bg-[#0D0D0D] min-h-screen text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="p-6 pt-12">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button onClick={() => navigate('/budget')} className="mr-4">
              <ChevronLeft size={24} className="text-white" />
            </button>
            <h1 className="text-xl font-bold">{t('categories.edit_category')}</h1>
          </div>
          <Button
            onClick={() => setIsDeleteDialogOpen(true)}
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
          >
            <Trash2 size={16} />
          </Button>
        </div>

        <div className="space-y-6">
          {/* Icon Preview */}
          <div className="flex items-center justify-center">
            <CategoryIcon category={category.category_id || category.id} size="lg" />
          </div>

          {/* English Name */}
          <div className="space-y-2">
            <Label htmlFor="enName" className="text-white">
              {t('categories.english_name')}
            </Label>
            <Input
              id="enName"
              value={enName}
              onChange={(e) => setEnName(e.target.value)}
              className="bg-[#242425] border-none text-white"
              placeholder={t('categories.english_name_placeholder')}
            />
          </div>

          {/* Indonesian Name */}
          <div className="space-y-2">
            <Label htmlFor="idName" className="text-white">
              {t('categories.indonesian_name')}
            </Label>
            <Input
              id="idName"
              value={idName}
              onChange={(e) => setIdName(e.target.value)}
              className="bg-[#242425] border-none text-white"
              placeholder={t('categories.indonesian_name_placeholder')}
            />
          </div>

          {/* Icon Selection */}
          <div className="space-y-2">
            <Label className="text-white">{t('categories.icon')}</Label>
            <Select value={icon} onValueChange={setIcon}>
              <SelectTrigger className="bg-[#242425] border-none text-white">
                <SelectValue placeholder={t('categories.select_icon')} />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1A] border-[#333] text-white">
                {availableIcons.map((iconName) => (
                  <SelectItem key={iconName} value={iconName}>
                    <div className="flex items-center">
                      <CategoryIcon category="question" size="sm" className="mr-2" />
                      <span>{iconName}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Type Selection */}
          <div className="space-y-2">
            <Label className="text-white">{t('categories.type')}</Label>
            <Select value={type} onValueChange={(value: 'income' | 'expense') => setType(value)}>
              <SelectTrigger className="bg-[#242425] border-none text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1A] border-[#333] text-white">
                <SelectItem value="expense">{t('expense.title')}</SelectItem>
                <SelectItem value="income">{t('income.title')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={saving || !enName.trim() || !idName.trim()}
            className="w-full bg-[#C6FE1E] text-black hover:bg-[#B5ED0D] transition-colors"
          >
            {saving ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                {t('common.saving')}
              </div>
            ) : (
              <div className="flex items-center">
                <Save size={16} className="mr-2" />
                {t('common.save')}
              </div>
            )}
          </Button>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent className="bg-[#1A1A1A] border-0 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle>{t('common.areYouSure')}</AlertDialogTitle>
              <AlertDialogDescription className="text-[#868686]">
                {t('categories.delete_confirmation')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-[#242425] border-0 text-white hover:bg-[#333]">
                {t('common.cancel')}
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-[#FF6B6B] text-white hover:bg-red-400"
              >
                {t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </motion.div>
  );
};

export default EditCategoryPage;
