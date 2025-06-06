import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useFinance } from '@/context/FinanceContext';
import { useToast } from '@/hooks/use-toast';
import { WantToBuyItem } from '@/types/finance';
import { FormattedInput } from '@/components/ui/formatted-input';
import AnimatedText from '@/components/ui/animated-text';

interface WantToBuyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemToEdit?: WantToBuyItem | null;
}

const WantToBuyForm: React.FC<WantToBuyFormProps> = ({ open, onOpenChange, itemToEdit }) => {
  const { t } = useTranslation();
  const { addWantToBuyItem, updateWantToBuyItem } = useFinance();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: '' as 'Keinginan' | 'Kebutuhan' | '',
    priority: '' as 'Tinggi' | 'Sedang' | 'Rendah' | '',
    estimated_date: '',
    icon: '🛍️',
  });

  const [date, setDate] = useState<Date>();

  useEffect(() => {
    if (itemToEdit) {
      setFormData({
        name: itemToEdit.name,
        price: itemToEdit.price.toString(),
        category: itemToEdit.category,
        priority: itemToEdit.priority,
        estimated_date: itemToEdit.estimated_date,
        icon: itemToEdit.icon || '🛍️',
      });
      setDate(new Date(itemToEdit.estimated_date));
    } else {
      setFormData({
        name: '',
        price: '',
        category: '',
        priority: '',
        estimated_date: '',
        icon: '🛍️',
      });
      setDate(undefined);
    }
  }, [itemToEdit]);

  const handleSubmit = async () => {
    if (!formData.name || !formData.price || !formData.category || !formData.priority || !date) {
      toast({
        title: t('common.error'),
        description: t('common.fillAllFields'),
        variant: 'destructive',
      });
      return;
    }

    try {
      const itemData = {
        name: formData.name,
        price: Number(formData.price),
        category: formData.category as 'Keinginan' | 'Kebutuhan',
        priority: formData.priority as 'Tinggi' | 'Sedang' | 'Rendah',
        estimated_date: format(date, 'yyyy-MM-dd'),
        icon: formData.icon,
        is_purchased: false,
      };

      if (itemToEdit) {
        await updateWantToBuyItem({
          ...itemData,
          id: itemToEdit.id,
          user_id: itemToEdit.user_id,
          created_at: itemToEdit.created_at,
          purchase_date: itemToEdit.purchase_date,
        });
        toast({
          title: t('common.success'),
          description: t('budget.wantToBuyUpdated'),
        });
      } else {
        await addWantToBuyItem(itemData);
        toast({
          title: t('common.success'),
          description: t('budget.wantToBuyAdded'),
        });
      }

      onOpenChange(false);
    } catch (error) {
      console.error('Error saving want to buy item:', error);
      toast({
        title: t('common.error'),
        description: t('budget.wantToBuyError'),
        variant: 'destructive',
      });
    }
  };

  const handlePriceChange = (value: string) => {
    setFormData({ ...formData, price: value });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-[#1A1A1A] border-none text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            <AnimatedText 
              text={itemToEdit ? t('budget.editWantToBuy') : t('budget.addWantToBuy')}
              animationType="fade"
            />
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-[#868686]">
              <AnimatedText text={t('budget.itemName')} />
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-[#242425] border-0 text-white"
              placeholder={t('budget.enterItemName')}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="price" className="text-[#868686]">
              <AnimatedText text={t('budget.price')} />
            </Label>
            <FormattedInput
              id="price"
              value={formData.price}
              onChange={handlePriceChange}
              className="bg-[#242425] border-0 text-white"
              placeholder={t('budget.enterPrice')}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="category" className="text-[#868686]">
              <AnimatedText text={t('budget.category')} />
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value as 'Keinginan' | 'Kebutuhan' })}
            >
              <SelectTrigger className="bg-[#242425] border-0 text-white">
                <SelectValue>
                  <AnimatedText 
                    text={formData.category || t('budget.selectCategory')}
                  />
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-[#242425] border-0 text-white">
                <SelectItem value="Kebutuhan" className="hover:bg-[#333] focus:bg-[#333]">
                  <AnimatedText text={t('budget.need')} />
                </SelectItem>
                <SelectItem value="Keinginan" className="hover:bg-[#333] focus:bg-[#333]">
                  <AnimatedText text={t('budget.want')} />
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="priority" className="text-[#868686]">
              <AnimatedText text={t('budget.priority')} />
            </Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => setFormData({ ...formData, priority: value as 'Tinggi' | 'Sedang' | 'Rendah' })}
            >
              <SelectTrigger className="bg-[#242425] border-0 text-white">
                <SelectValue>
                  <AnimatedText 
                    text={formData.priority ? t(`budget.${formData.priority.toLowerCase()}`) : t('budget.selectPriority')}
                  />
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-[#242425] border-0 text-white">
                <SelectItem value="Tinggi" className="hover:bg-[#333] focus:bg-[#333]">
                  <AnimatedText text={t('budget.high')} />
                </SelectItem>
                <SelectItem value="Sedang" className="hover:bg-[#333] focus:bg-[#333]">
                  <AnimatedText text={t('budget.medium')} />
                </SelectItem>
                <SelectItem value="Rendah" className="hover:bg-[#333] focus:bg-[#333]">
                  <AnimatedText text={t('budget.low')} />
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label className="text-[#868686]">
              <AnimatedText text={t('budget.estimatedDate')} />
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal bg-[#242425] border-0 text-white hover:bg-[#333]",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  <AnimatedText 
                    text={date ? format(date, "PPP") : t('budget.selectDate')}
                  />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-[#242425] border-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className="bg-[#242425] text-white"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-[#333] hover:bg-[#333] text-white">
            <AnimatedText text={t('buttons.cancel')} />
          </Button>
          <Button onClick={handleSubmit} className="bg-[#C6FE1E] text-[#0D0D0D] hover:bg-[#B0E018] font-semibold border-0">
            <AnimatedText text={itemToEdit ? t('buttons.update') : t('buttons.add')} />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WantToBuyForm;
