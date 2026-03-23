import { useQuery, useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { RBC } from '../types';

const rbcsQuery = {
  queryKey: ['rbcs'],
  queryFn: async (): Promise<RBC[]> => {
    const res = await fetch('/api/rbcs');
    if (!res.ok) throw new Error('Failed to fetch RBCs');
    return res.json();
  },
};

export function useRBCs() {
  return useQuery(rbcsQuery);
}

export function useSuspenseRBCs() {
  return useSuspenseQuery(rbcsQuery);
}

export function useCreateRBC() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<RBC, 'id'>): Promise<RBC> => {
      const res = await fetch('/api/rbcs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create RBC');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rbcs'] }),
  });
}

export function useUpdateRBC() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: RBC) => {
      const res = await fetch(`/api/rbcs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update RBC');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rbcs'] }),
  });
}

export function useDeleteRBC() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/rbcs/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete RBC');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rbcs'] });
      qc.invalidateQueries({ queryKey: ['relations'] });
    },
  });
}
