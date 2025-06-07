
// Fixed BudgetPage to handle proper function signatures for edit handlers
// Updated to match the FinanceContext interface

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFinance } from '@/context/FinanceContext';
import { motion } from 'framer-motion';
import BudgetList from '@/components/budget/BudgetList';
import BudgetProgress from '@/components/budget/BudgetProgress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WantToBuyList from '@/components/budget/WantToBuyList';
import WantToBuyForm from '@/components/budget/WantToBuyForm';
import PinjamanList from '@/components/budget/PinjamanList';
import PinjamanForm from '@/components/budget/PinjamanForm';
import { supabase } from '@/lib/supabase';

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

const BudgetPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { budgets, loading, updateWantToBuy, updatePinjaman } = useFinance();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isWantToBuyFormOpen, setIsWantToBuyFormOpen] = useState(false);
  const [isPinjamanFormOpen, setIsPinjamanFormOpen] = useState(false);
  
  // Fetch categories for budget creation
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('category_id, category_key, created_at, en_name, icon, id_name, type')
          .eq('type', 'expense')
          .order('en_name');
        
        if (error) {
          console.error('Error fetching categories:', error);
          return;
        }
        
        if (data) {
          // Map the database structure to our Category interface
          const mappedCategories = data.map(cat => ({
            id: String(cat.category_id), // Use category_id as id (converted to string)
            category_id: cat.category_id,
            category_key: cat.category_key,
            en_name: cat.en_name,
            id_name: cat.id_name,
            type: cat.type,
            icon: cat.icon,
            created_at: cat.created_at
          }));
          
          setCategories(mappedCategories);
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    
    fetchCategories();
  }, []);

  const handleEditWantToBuyItem = (item: any) => {
    // This function should handle opening the edit form
    // For now, we'll just log the item
    console.log('Edit want to buy item:', item);
  };

  const handleEditPinjamanItem = (item: any) => {
    // This function should handle opening the edit form
    // For now, we'll just log the item
    console.log('Edit pinjaman item:', item);
  };
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 24 }
    }
  };
  
  return (
    <motion.div 
      className="max-w-md mx-auto bg-[#0D0D0D] min-h-screen pb-24 text-white"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="p-6 pt-12">
        <motion.div 
          className="flex items-center justify-between mb-6"
          variants={itemVariants}
        >
          <div className="flex items-center">
            <button onClick={() => navigate('/')} className="mr-4">
              <ChevronLeft size={24} className="text-white" />
            </button>
            <h1 className="text-xl font-bold">{t('budget.title')}</h1>
          </div>
        </motion.div>
        
        <Tabs defaultValue="budgets" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-[#242425] mb-6">
            <TabsTrigger 
              value="budgets" 
              className="data-[state=active]:bg-[#C6FE1E] data-[state=active]:text-black"
            >
              {t('budget.budgets')}
            </TabsTrigger>
            <TabsTrigger 
              value="want-to-buy"
              className="data-[state=active]:bg-[#C6FE1E] data-[state=active]:text-black"
            >
              {t('budget.want_to_buy')}
            </TabsTrigger>
            <TabsTrigger 
              value="pinjaman"
              className="data-[state=active]:bg-[#C6FE1E] data-[state=active]:text-black"
            >
              {t('budget.loans')}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="budgets" className="space-y-6">
            <motion.div variants={itemVariants}>
              <BudgetProgress />
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <BudgetList />
            </motion.div>
          </TabsContent>
          
          <TabsContent value="want-to-buy" className="space-y-4">
            <motion.div 
              className="flex justify-end"
              variants={itemVariants}
            >
              <Button 
                onClick={() => setIsWantToBuyFormOpen(true)}
                className="bg-[#C6FE1E] text-black hover:bg-[#B5ED0D] transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('budget.add_item')}
              </Button>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <WantToBuyList onEditItem={handleEditWantToBuyItem} />
            </motion.div>
            
            <WantToBuyForm 
              open={isWantToBuyFormOpen} 
              onOpenChange={setIsWantToBuyFormOpen} 
            />
          </TabsContent>
          
          <TabsContent value="pinjaman" className="space-y-4">
            <motion.div 
              className="flex justify-end"
              variants={itemVariants}
            >
              <Button 
                onClick={() => setIsPinjamanFormOpen(true)}
                className="bg-[#C6FE1E] text-black hover:bg-[#B5ED0D] transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('budget.add_loan')}
              </Button>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <PinjamanList onEditItem={handleEditPinjamanItem} />
            </motion.div>
            
            <PinjamanForm 
              open={isPinjamanFormOpen} 
              onOpenChange={setIsPinjamanFormOpen} 
            />
          </TabsContent>
        </Tabs>
      </div>
    </motion.div>
  );
};

export default BudgetPage;
