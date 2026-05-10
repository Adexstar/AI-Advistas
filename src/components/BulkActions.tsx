import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  Play,
  Pause,
  Trash2,
  Copy,
  Archive,
  Download,
  Edit,
  CheckSquare,
  Square,
  Minus,
  RotateCcw
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface BulkActionsProps {
  items: any[];
  selectedItems: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onBulkAction: (action: string, itemIds: string[], payload?: any) => void;
  actions?: BulkAction[];
  itemType?: string;
  showQuickStatusChange?: boolean;
  quickStatusOptions?: Array<{
    value: string;
    label: string;
  }>;
}

interface BulkAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary';
  requiresConfirmation?: boolean;
  confirmationMessage?: string;
  disabled?: (selectedItems: any[]) => boolean;
  payload?: any;
}

export const BulkActions = ({
  items,
  selectedItems,
  onSelectionChange,
  onBulkAction,
  actions = [],
  itemType = 'items',
  showQuickStatusChange = true,
  quickStatusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'paused', label: 'Paused' },
    { value: 'draft', label: 'Draft' },
    { value: 'archived', label: 'Archived' },
  ]
}: BulkActionsProps) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<BulkAction | null>(null);

  const defaultActions: BulkAction[] = [
    {
      id: 'activate',
      label: 'Activate',
      icon: <Play className="h-4 w-4" />,
      variant: 'default',
    },
    {
      id: 'pause',
      label: 'Pause',
      icon: <Pause className="h-4 w-4" />,
      variant: 'outline',
    },
    {
      id: 'duplicate',
      label: 'Duplicate',
      icon: <Copy className="h-4 w-4" />,
      variant: 'outline',
    },
    {
      id: 'archive',
      label: 'Archive',
      icon: <Archive className="h-4 w-4" />,
      variant: 'outline',
      requiresConfirmation: true,
      confirmationMessage: 'Are you sure you want to archive the selected items? They will be moved to the archive.',
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      variant: 'destructive',
      requiresConfirmation: true,
      confirmationMessage: 'Are you sure you want to delete the selected items? This action cannot be undone.',
    },
    {
      id: 'export',
      label: 'Export',
      icon: <Download className="h-4 w-4" />,
      variant: 'outline',
    },
  ];

  const availableActions = actions.length > 0 ? actions : defaultActions;
  const selectedItemsData = items.filter(item => selectedItems.includes(item.id));

  const handleSelectAll = () => {
    if (selectedItems.length === items.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(items.map(item => item.id));
    }
  };

  const getSelectionState = () => {
    if (selectedItems.length === 0) return 'none';
    if (selectedItems.length === items.length) return 'all';
    return 'partial';
  };

  const handleBulkAction = (action: BulkAction) => {
    if (selectedItems.length === 0) {
      toast({
        title: 'No items selected',
        description: 'Please select at least one item to perform this action.',
        variant: 'destructive',
      });
      return;
    }

    if (action.disabled && action.disabled(selectedItemsData)) {
      toast({
        title: 'Action not available',
        description: 'This action cannot be performed on the selected items.',
        variant: 'destructive',
      });
      return;
    }

    if (action.requiresConfirmation) {
      setPendingAction(action);
      setShowConfirmDialog(true);
    } else {
      executeAction(action);
    }
  };

  const executeAction = (action: BulkAction) => {
    onBulkAction(action.id, selectedItems, action.payload);
    
    toast({
      title: 'Action completed',
      description: `${action.label} applied to ${selectedItems.length} ${itemType}.`,
    });

    // Clear selection after action
    onSelectionChange([]);
  };

  const confirmAction = () => {
    if (pendingAction) {
      executeAction(pendingAction);
    }
    setShowConfirmDialog(false);
    setPendingAction(null);
  };

  const SelectionIcon = () => {
    const state = getSelectionState();
    if (state === 'all') return <CheckSquare className="h-4 w-4" />;
    if (state === 'partial') return <Minus className="h-4 w-4" />;
    return <Square className="h-4 w-4" />;
  };

  return (
    <>
      <AnimatePresence>
        {(selectedItems.length > 0 || items.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-muted/30 border border-border rounded-lg"
          >
            {/* Selection Controls */}
            <div className="flex items-center gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={getSelectionState() === 'all'}
                  onCheckedChange={handleSelectAll}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  className="text-sm font-medium"
                >
                  <SelectionIcon />
                  <span className="ml-2">
                    {getSelectionState() === 'all' 
                      ? 'Deselect All' 
                      : `Select All (${items.length})`
                    }
                  </span>
                </Button>
              </div>
              
              {selectedItems.length > 0 && (
                <Badge variant="secondary">
                  {selectedItems.length} selected
                </Badge>
              )}
            </div>

            {/* Bulk Actions */}
            {selectedItems.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 flex-1">
                <span className="text-sm text-muted-foreground mr-2">Actions:</span>
                
                {availableActions.map((action) => (
                  <Button
                    key={action.id}
                    variant={action.variant || 'outline'}
                    size="sm"
                    onClick={() => handleBulkAction(action)}
                    disabled={action.disabled && action.disabled(selectedItemsData)}
                    className="flex items-center gap-2"
                  >
                    {action.icon}
                    {action.label}
                  </Button>
                ))}

                {/* Quick Status Change */}
                {showQuickStatusChange && quickStatusOptions.length > 0 && (
                  <div className="flex items-center gap-2 ml-4">
                    <span className="text-sm text-muted-foreground">Set status:</span>
                    <Select onValueChange={(value) => onBulkAction('changeStatus', selectedItems, { status: value })}>
                      <SelectTrigger className="w-32 h-8">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        {quickStatusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Clear Selection */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSelectionChange([])}
                  className="ml-auto"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Clear
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.confirmationMessage || 
                `Are you sure you want to ${pendingAction?.label.toLowerCase()} ${selectedItems.length} ${itemType}?`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingAction(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmAction}
              className={pendingAction?.variant === 'destructive' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {pendingAction?.label}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};