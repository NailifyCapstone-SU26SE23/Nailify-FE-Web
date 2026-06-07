import { useMemo, useState } from "react";

export function usePagination(items = [], pageSize = 10) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const paginatedItems = useMemo(() => {
    const safePage = Math.min(currentPage, totalPages);
    const startIndex = (safePage - 1) * pageSize;
    return items.slice(startIndex, startIndex + pageSize);
  }, [currentPage, items, pageSize, totalPages]);

  return {
    currentPage: Math.min(currentPage, totalPages),
    paginatedItems,
    pageSize,
    setCurrentPage,
    totalPages,
  };
}
