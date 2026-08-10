import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dataService } from '@/lib/dataService'

// Generic CRUD hook powering every domain page (tasks, projects, notes...).
// Data fetching -> TanStack Query. Persistence -> dataService (local or Firestore).
export function useCollection(name) {
  const qc = useQueryClient()
  const key = [name]

  const query = useQuery({
    queryKey: key,
    queryFn: () => dataService.getAll(name),
    staleTime: 1000 * 30,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: key })

  const createItem = useMutation({
    mutationFn: (item) => dataService.create(name, item),
    onSuccess: invalidate,
  })

  const updateItem = useMutation({
    mutationFn: ({ id, patch }) => dataService.update(name, id, patch),
    onSuccess: invalidate,
  })

  const removeItem = useMutation({
    mutationFn: (id) => dataService.remove(name, id),
    onSuccess: invalidate,
  })

  return {
    items: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    createItem: createItem.mutateAsync,
    updateItem: (id, patch) => updateItem.mutateAsync({ id, patch }),
    removeItem: removeItem.mutateAsync,
    isMutating: createItem.isPending || updateItem.isPending || removeItem.isPending,
  }
}
