import { useCallback, useMemo, useRef, useEffect, useState } from 'react';

// 디바운스 훅
export function useDebounce<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => callback(...args), delay);
    },
    [callback, delay]
  ) as T;
}

// 쓰로틀 훅
export function useThrottle<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const lastCall = useRef(0);
  const lastCallTimer = useRef<NodeJS.Timeout>();

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall.current >= delay) {
        callback(...args);
        lastCall.current = now;
      } else {
        if (lastCallTimer.current) {
          clearTimeout(lastCallTimer.current);
        }
        lastCallTimer.current = setTimeout(() => {
          callback(...args);
          lastCall.current = Date.now();
        }, delay - (now - lastCall.current));
      }
    },
    [callback, delay]
  ) as T;
}

// 무한 스크롤 훅
export function useInfiniteScroll(
  callback: () => void,
  hasMore: boolean,
  loading: boolean
) {
  const observer = useRef<IntersectionObserver>();

  const lastElementRef = useCallback(
    (node: HTMLElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          callback();
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore, callback]
  );

  return lastElementRef;
}

// 성능 모니터링 훅
export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0);
  const startTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current += 1;
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;
    
    if (renderCount.current > 1) {
      console.log(`${componentName} 렌더링 #${renderCount.current}: ${renderTime.toFixed(2)}ms`);
    }
    
    startTime.current = performance.now();
  });

  return {
    renderCount: renderCount.current,
    resetRenderCount: () => {
      renderCount.current = 0;
    }
  };
}

// 메모이제이션된 필터링 훅
export function useMemoizedFilter<T>(
  items: T[],
  filterFn: (item: T) => boolean,
  dependencies: unknown[] = []
) {
  return useMemo(() => {
    return items.filter(filterFn);
  }, [items, filterFn, ...dependencies]);
}

// 메모이제이션된 정렬 훅
export function useMemoizedSort<T>(
  items: T[],
  sortFn: (a: T, b: T) => number,
  dependencies: unknown[] = []
) {
  return useMemo(() => {
    return [...items].sort(sortFn);
  }, [items, sortFn, ...dependencies]);
}

// 가상화된 리스트를 위한 아이템 크기 계산 훅
export function useItemSize(
  containerHeight: number,
  itemCount: number,
  minItemHeight: number = 50
) {
  return useMemo(() => {
    const calculatedHeight = Math.max(minItemHeight, containerHeight / Math.min(itemCount, 10));
    return Math.min(calculatedHeight, 200); // 최대 높이 제한
  }, [containerHeight, itemCount, minItemHeight]);
}

// 성능 최적화된 검색 훅
export function useOptimizedSearch<T>(
  items: T[],
  searchTerm: string,
  searchFields: (keyof T)[],
  debounceDelay: number = 300
) {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  const debouncedSetSearchTerm = useDebounce(setDebouncedSearchTerm, debounceDelay);

  useEffect(() => {
    debouncedSetSearchTerm(searchTerm);
  }, [searchTerm, debouncedSetSearchTerm]);

  const filteredItems = useMemo(() => {
    if (!debouncedSearchTerm.trim()) return items;
    
    const searchLower = debouncedSearchTerm.toLowerCase();
    return items.filter(item => {
      return searchFields.some(field => {
        const value = item[field];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchLower);
        }
        return false;
      });
    });
  }, [items, debouncedSearchTerm, searchFields]);

  return filteredItems;
} 