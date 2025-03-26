import React, { useState } from 'react';
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
  
  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-finance-expense';
    if (percentage >= 75) return 'bg-amber-500';
    return 'bg-finance-income';
  };

  const handleEdit = (budget: any) => {
    setEditingBudget(budget.id);
    setEditForm({
      category: budget.category,
      amount: budget.amount.toString()
    });
  };

  const handleCancelEdit = () => {
    setEditingBudget(null);
  };

  const handleSaveEdit = (budget: any) => {
    // Validate inputs
    if (!editForm.category.trim()) {
      toast({
        title: "Error",
        description: "Category name cannot be empty",
        variant: "destructive"
      });
      return;
    }

    if (!editForm.amount || isNaN(Number(editForm.amount)) || Number(editForm.amount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive"
      });
      return;
    }

    // Update the budget
    updateBudget({
      ...budget,
      category: editForm.category,
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
                  <div className="flex justify-between items-baseline">
                    {isEditing ? (
                      <Input 
                        value={editForm.category}
                        onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                        className="w-40 h-8"
                      />
                    ) : (
                      <div className="flex justify-between w-full">
                        <h3 className="font-medium">{budget.category}</h3>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium">
                            <span className={remaining < 0 ? 'text-finance-expense' : ''}>
                              {formatCurrency(budget.spent)}
                            </span>
                            <span className="text-muted-foreground"> / </span>
                            {isEditing ? (
                              <Input 
                                value={editForm.amount}
                                onChange={(e) => setEditForm({...editForm, amount: e.target.value})}
                                className="w-24 h-7 inline mx-1"
                                type="number"
                                min="0"
                              />
                            ) : (
                              <span className="text-muted-foreground">{formatCurrency(budget.amount)}</span>
                            )}
                          </div>
                          
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7" 
                                onClick={() => handleSaveEdit(budget)}
                              >
                                <Check className="h-4 w-4 text-finance-income" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7" 
                                onClick={handleCancelEdit}
                              >
                                <X className="h-4 w-4 text-finance-expense" />
                              </Button>
                            </div>
                          ) : (
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
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
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
