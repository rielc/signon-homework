import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Relation } from '../types';

export function useRelations() {
  return useQuery({
    queryKey: ['relations'],
    queryFn: async (): Promise<Relation[]> => {
      const res = await fetch('/api/relations');
      if (!res.ok) throw new Error('Failed to fetch relations');
      return res.json();
    },
  });
}

export function useCreateRelation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { trainId: string; rbcId: string; key: string }) => {
      const res = await fetch('/api/relations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create relation');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['relations'] }),
  });
}

export function useDeleteRelation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ trainId, rbcId }: { trainId: string; rbcId: string }) => {
      const res = await fetch(`/api/relations/${trainId}/${rbcId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete relation');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['relations'] }),
  });
}

export function useUpdateKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ trainId, rbcId, key }: { trainId: string; rbcId: string; key: string }) => {
      const res = await fetch(`/api/relations/${trainId}/${rbcId}/key`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key }),
      });
      if (!res.ok) throw new Error('Failed to update key');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['relations'] }),
  });
}

