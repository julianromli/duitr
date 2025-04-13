import React, { useState, useEffect } from 'react';
import { PieChart, Edit, Trash, X, Check } from 'lucide-react';
import { useBudgets } from '@/hooks/useBudgets';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useFinance } from '@/context/FinanceContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

const BudgetList: React.FC = () => {
  const { budgets } = useBudgets();
  const { formatCurrency, updateBudget, deleteBudget } = useFinance();
  const { toast } = useToast();
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    category: '',
    amount: ''
  });
  
  useEffect(() => {
    if (editingBudget) {
      const currentBudget = budgets.find(b => b.id === editingBudget);
      if (currentBudget) {
        console.log("Found budget for editing:", currentBudget);
        setEditForm({
          category: currentBudget.category || '',
          amount: currentBudget.amount.toString()
        });
      } else {
        console.warn("Could not find budget with ID:", editingBudget);
      }
    }
  }, [budgets, editingBudget]);

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-finance-expense';
    if (percentage >= 75) return 'bg-amber-500';
    return 'bg-finance-income';
  };

  const handleEdit = (budget: any) => {
    console.log("Editing budget:", budget);
    setEditingBudget(budget.id);
    setEditForm({
      category: budget.category || '',
      amount: budget.amount.toString()
    });
  };

  const handleCancelEdit = () => {
    setEditingBudget(null);
  };

  const handleSaveEdit = (budget: any) => {
    // Validate inputs
    if (!editForm.amount || isNaN(Number(editForm.amount)) || Number(editForm.amount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive"
      });
      return;
    }

    // Update the budget with only the amount changed, preserve category
    updateBudget({
      ...budget,
      category: budget.category,
      amount: Number(editForm.amount)
    });

    toast({
      title: "Success",
      description: "Budget updated successfully"
    });

    setEditingBudget(null);
  };

  const handleDelete = (id: string) => {
    deleteBudget(id);
    
    toast({
      title: "Success",
      description: "Budget deleted successfully"
    });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <PieChart className="w-5 h-5" /> Budget Categories
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            {budgets.map((budget) => {
              const percentage = (budget.spent / budget.amount) * 100;
              const remaining = budget.amount - budget.spent;
              const isEditing = editingBudget === budget.id;
              
              return (
                <div key={budget.id} className="space-y-2">
                  {isEditing ? (
                    <div className="flex flex-col space-y-3 bg-gray-100 dark:bg-gray-800 p-3 rounded-md border">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium">Category:</label>
                          <span className="text-sm">{budget.category || 'No Category'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium">Amount:</label>
                          <Input 
                            value={editForm.amount}
                            onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
                            className="w-28 h-8"
                            type="number"
                            min="0"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleCancelEdit}
                          className="h-8"
                        >
                          <X className="h-4 w-4 mr-1" /> Cancel
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={() => handleSaveEdit(budget)}
                          className="h-8 bg-finance-income text-black hover:bg-finance-income/90"
                        >
                          <Check className="h-4 w-4 mr-1" /> Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">{budget.category}</h3>
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-medium">
                          <span className={remaining < 0 ? 'text-finance-expense' : ''}>
                            {formatCurrency(budget.spent)}
                          </span>
                          <span className="text-muted-foreground"> / </span>
                          <span className="text-muted-foreground">{formatCurrency(budget.amount)}</span>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(budget)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDelete(budget.id)}
                              className="text-destructive"
                            >
                              <Trash className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )}
                  
                  <Progress 
                    value={Math.min(percentage, 100)} 
                    className="h-2" 
                    indicatorClassName={getProgressColor(percentage)} 
                  />
                  
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{Math.round(percentage)}% used</span>
                    <span className={remaining < 0 ? 'text-finance-expense' : ''}>
                      {remaining < 0 ? 'Over by ' : 'Remaining: '}
                      {formatCurrency(Math.abs(remaining))}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BudgetList;
