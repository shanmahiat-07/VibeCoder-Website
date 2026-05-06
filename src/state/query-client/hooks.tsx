import { UseMutationOptions, UseQueryOptions, useMutation, useQuery, QueryKey } from '@tanstack/react-query';

type ApiError = Error;

type GlobalQueryOptions<TQueryFnData, TError, TData, TQueryKey extends QueryKey> = Omit<
  UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>,
  'onError'
> & {
  onError?: (error: TError) => void;
};

export const useGlobalQuery = <
  TQueryFnData = unknown,
  TError = ApiError,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: GlobalQueryOptions<TQueryFnData, TError, TData, TQueryKey>
) => {
  return useQuery<TQueryFnData, TError, TData, TQueryKey>({
    ...options,
    retry: false,
  });
};

export type GlobalMutationOptions<
  TData = unknown,
  TError = ApiError,
  TVariables = void,
  TContext = unknown,
> = UseMutationOptions<TData, TError, TVariables, TContext> & {
  suppressToast?: boolean;
};

export const useGlobalMutation = <
  TData = unknown,
  TError = ApiError,
  TVariables = void,
  TContext = unknown,
>(
  option: GlobalMutationOptions<TData, TError, TVariables, TContext>
) => {
  return useMutation({
    ...option,
  });
};
