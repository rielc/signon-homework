import { useQuery, useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Train } from '../types';

const trainsQuery = {
  queryKey: ['trains'],
  queryFn: async (): Promise<Train[]> => {
    const res = await fetch('/api/trains');
    if (!res.ok) throw new Error('Failed to fetch trains');
    return res.json();
  },
};

export function useTrains() {
  return useQuery(trainsQuery);
}

export function useSuspenseTrains() {
  return useSuspenseQuery(trainsQuery);
}

export function useCreateTrain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Train, 'id'>): Promise<Train> => {
      const res = await fetch('/api/trains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create train');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trains'] }),
  });
}

export function useUpdateTrain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Train) => {
      const res = await fetch(`/api/trains/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update train');
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trains'] }),
  });
}

export function useDeleteTrain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/trains/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete train');
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trains'] });
      qc.invalidateQueries({ queryKey: ['relations'] });
    },
  });
}
