import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  StockImportService, type StockItem, type StockProvider, type StockSearchResponse,
} from '@/services/templates/StockImportService';

export const useStockSearch = () =>
  useMutation<StockSearchResponse, Error, { query: string; providers: StockProvider[]; limit?: number }>({
    mutationFn: ({ query, providers, limit }) => StockImportService.search(query, providers, limit),
    onError: (e) => toast.error(e.message),
  });

const invalidate = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: ['admin-templates'] });
  qc.invalidateQueries({ queryKey: ['templates'] });
};

export const useImportStockTemplates = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ items, category }: { items: StockItem[]; category?: string | null }) =>
      StockImportService.importItems(items, category),
    onSuccess: (r) => {
      invalidate(qc);
      toast.success(
        r.imported
          ? `Imported ${r.imported} template${r.imported === 1 ? '' : 's'} as pending${r.skipped ? ` (${r.skipped} already existed)` : ''}`
          : r.message ?? 'Nothing new to import',
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });
};

export const useSeedStarterPack = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ providers, perQuery }: { providers: StockProvider[]; perQuery?: number }) =>
      StockImportService.seedStarterPack(providers, perQuery),
    onSuccess: (r) => {
      invalidate(qc);
      toast.success(
        r.imported
          ? `Seeded ${r.imported} pending templates${r.skipped ? ` (${r.skipped} skipped)` : ''}`
          : r.message ?? 'Starter pack already imported',
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });
};
