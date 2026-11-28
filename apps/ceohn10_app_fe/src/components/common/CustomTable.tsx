import React, { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ChevronUp,
  ChevronDown,
  Search,
  Plus,
  X,
  MoreHorizontal,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { Pagination } from "@/components/dashboard/DataTablePagination";
export { CeoTableEllipsis } from "./CeoTableEllipsis";
import { CeoTableEllipsis } from "./CeoTableEllipsis";

export type SortDirection = "asc" | "desc" | null;

export interface CustomTableColumn<T> {
  key: string;
  label: string;
  width?: number | string;
  minWidth?: number;
  align?: "left" | "center" | "right";
  sortable?: boolean;
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  render?: (row: T, index: number) => React.ReactNode;
  className?: string;
}

/**
 * Hook quản lý sắp xếp 3 trạng thái chuẩn CRM CEO HN10:
 * Lần bấm 1: Tăng dần (asc)
 * Lần bấm 2: Giảm dần (desc)
 * Lần bấm 3: Mặc định không sắp xếp (null)
 */
export function useCustomTableSort<T>(
  initialKey: string | null = null,
  initialDir: SortDirection = null
) {
  const [sortKey, setSortKey] = useState<string | null>(initialKey);
  const [sortDir, setSortDir] = useState<SortDirection>(initialDir);

  const handleSort = useCallback((key: string) => {
    setSortKey((prevKey) => {
      if (prevKey !== key) {
        setSortDir("asc");
        return key;
      }
      setSortDir((prevDir) => {
        if (prevDir === "asc") return "desc";
        if (prevDir === "desc") {
          // Trạng thái thứ 3: quay về null (không sắp xếp)
          setSortKey(null);
          return null;
        }
        return "asc";
      });
      return prevKey;
    });
  }, []);

  const sortData = useCallback(
    (data: T[], customExtractors?: Record<string, (item: T) => any>): T[] => {
      if (!sortKey || !sortDir) return data;
      const copy = [...data];
      copy.sort((a, b) => {
        let valA: any = customExtractors?.[sortKey]
          ? customExtractors[sortKey](a)
          : (a as any)[sortKey];
        let valB: any = customExtractors?.[sortKey]
          ? customExtractors[sortKey](b)
          : (b as any)[sortKey];

        if (valA === undefined || valA === null) valA = "";
        if (valB === undefined || valB === null) valB = "";

        if (typeof valA === "number" && typeof valB === "number") {
          return sortDir === "asc" ? valA - valB : valB - valA;
        }

        const strA = String(valA);
        const strB = String(valB);
        const cmp = strA.localeCompare(strB, "vi", { numeric: true });
        return sortDir === "asc" ? cmp : -cmp;
      });
      return copy;
    },
    [sortKey, sortDir]
  );

  return {
    sortKey,
    sortDir,
    handleSort,
    sortData,
    setSortKey,
    setSortDir,
  };
}

export interface TableActionItem {
  key?: string;
  label: string;
  icon?: LucideIcon | React.ComponentType<{ className?: string }>;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  danger?: boolean;
  variant?: "default" | "primary" | "danger" | "success" | "warning";
  className?: string;
  hidden?: boolean;
}

/**
 * Component hiển thị nhóm thao tác theo chuẩn tối đa 3 thao tác:
 * - Nếu <= 3 thao tác: hiển thị đầy đủ trực tiếp.
 * - Nếu > 3 thao tác: hiển thị 2 thao tác đầu + nút 3 chấm (...) mở popup chứa các thao tác còn lại.
 */
export function TableActionsGroup({
  actions,
  maxVisible = 3,
  children,
}: {
  actions?: TableActionItem[];
  maxVisible?: number;
  children?: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; openUp: boolean }>({ top: 0, left: 0, openUp: false });
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const portalMenuRef = useRef<HTMLDivElement>(null);

  const updateMenuPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < 180 && rect.top > 180;
    setMenuPos({
      top: openUp ? rect.top - 4 : rect.bottom + 4,
      left: Math.max(8, rect.right - 180),
      openUp,
    });
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    updateMenuPosition();
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        (!portalMenuRef.current || !portalMenuRef.current.contains(target))
      ) {
        setMenuOpen(false);
      }
    };
    const handleScrollOrResize = () => updateMenuPosition();
    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [menuOpen, updateMenuPosition]);

  if (actions && Array.isArray(actions)) {
    const visibleActions = actions.filter((a) => !a.hidden);
    if (visibleActions.length <= maxVisible) {
      return (
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          {visibleActions.map((act, i) => {
            const Icon = act.icon;
            return (
              <button
                key={act.key || i}
                type="button"
                onClick={act.onClick}
                disabled={act.disabled}
                title={act.label}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  act.danger
                    ? "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400"
                    : act.variant === "primary"
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : act.variant === "success"
                    ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40"
                    : act.variant === "warning"
                    ? "bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/40"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                } ${act.className || ""}`}
              >
                {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                <span>{act.label}</span>
              </button>
            );
          })}
        </div>
      );
    }

    const directActions = visibleActions.slice(0, maxVisible - 1);
    const extraActions = visibleActions.slice(maxVisible - 1);

    return (
      <div className="relative inline-flex items-center justify-center gap-1.5" ref={menuRef}>
        {directActions.map((act, i) => {
          const Icon = act.icon;
          return (
            <button
              key={act.key || i}
              type="button"
              onClick={act.onClick}
              disabled={act.disabled}
              title={act.label}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                act.danger
                  ? "bg-red-50 text-red-600 hover:bg-red-100"
                  : act.variant === "primary"
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
              } ${act.className || ""}`}
            >
              {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
              <span>{act.label}</span>
            </button>
          );
        })}

        <button
          ref={triggerRef}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!menuOpen) updateMenuPosition();
            setMenuOpen((prev) => !prev);
          }}
          className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer transition shadow-2xs"
          title="Thao tác khác"
          aria-label="Thao tác khác"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {menuOpen &&
          typeof document !== "undefined" &&
          createPortal(
            <div
              ref={portalMenuRef}
              style={{
                position: "fixed",
                top: menuPos.top,
                left: menuPos.left,
                transform: menuPos.openUp ? "translateY(-100%)" : undefined,
              }}
              className="w-48 z-[9999] rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xl py-1 text-left text-xs"
            >
              {extraActions.map((act, i) => {
                const Icon = act.icon;
                return (
                  <button
                    key={act.key || i}
                    type="button"
                    disabled={act.disabled}
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      act.onClick(e);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      act.danger ? "text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30" : "text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
                    <span className="truncate">{act.label}</span>
                  </button>
                );
              })}
            </div>,
            document.body,
          )}
      </div>
    );
  }

  const childArray = React.Children.toArray(children).filter(Boolean);
  if (childArray.length <= maxVisible) {
    return <div className="flex items-center justify-center gap-1.5 flex-wrap">{children}</div>;
  }

  const directChildren = childArray.slice(0, maxVisible - 1);
  const extraChildren = childArray.slice(maxVisible - 1);

  return (
    <div className="relative inline-flex items-center justify-center gap-1.5" ref={menuRef}>
      {directChildren}
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (!menuOpen) updateMenuPosition();
          setMenuOpen((prev) => !prev);
        }}
        className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer transition shadow-2xs"
        title="Thao tác khác"
        aria-label="Thao tác khác"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {menuOpen &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={portalMenuRef}
            style={{
              position: "fixed",
              top: menuPos.top,
              left: menuPos.left,
              transform: menuPos.openUp ? "translateY(-100%)" : undefined,
            }}
            className="min-w-[180px] z-[9999] rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-xl p-1.5 text-left text-xs space-y-1"
          >
            {extraChildren.map((child, i) => (
              <div key={i} onClick={() => setMenuOpen(false)} className="w-full [&>button]:w-full [&>button]:justify-start [&>button]:py-1.5 [&>button]:px-2.5">
                {child}
              </div>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}

export interface CustomTableProps<T> {
  columns: CustomTableColumn<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string | number;
  sortKey?: string | null;
  sortDir?: SortDirection;
  onSort?: (key: string) => void;
  showStt?: boolean;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  actionColumn?: {
    title?: string;
    width?: number | string;
    minWidth?: number;
    actions?: (row: T, index: number) => TableActionItem[];
    render?: (row: T, index: number) => React.ReactNode;
  };
  loading?: boolean;
  emptyText?: string;
  emptyAction?: React.ReactNode;
  onRowClick?: (row: T) => void;
  className?: string;
  selectable?: boolean;
  selectedKeys?: Set<string | number>;
  onSelectionChange?: (keys: Set<string | number>) => void;
  onBulkDelete?: (keys: (string | number)[]) => void | Promise<void>;
  bulkDeleteLabel?: string;
}

export function BulkDeleteBar({
  selectedCount,
  onBulkDelete,
  onClear,
  label = "Xóa các mục đã chọn",
  busy = false,
}: {
  selectedCount: number;
  onBulkDelete: () => void;
  onClear: () => void;
  label?: string;
  busy?: boolean;
}) {
  if (selectedCount <= 0) return null;
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50/90 px-4 py-2.5 text-xs dark:border-rose-900/60 dark:bg-rose-950/40">
      <span className="font-semibold text-rose-900 dark:text-rose-200">
        Đã chọn <strong className="font-extrabold">{selectedCount}</strong> mục
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClear}
          disabled={busy}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 cursor-pointer"
        >
          Bỏ chọn
        </button>
        <button
          type="button"
          onClick={onBulkDelete}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 font-bold text-white shadow-xs hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>{busy ? "Đang xóa..." : label}</span>
        </button>
      </div>
    </div>
  );
}

/**
 * Component CustomTable chuẩn hóa toàn hệ thống CRM CEO HN10:
 * 1. Bảng dữ liệu viền bo, nền header slate-50 chuẩn Figma
 * 2. Cột STT tự động tính theo trang
 * 3. Hỗ trợ 3 trạng thái sắp xếp (None -> Asc -> Desc -> None) với icon trực quan
 * 4. Kéo co giãn kích thước cột (Column Resizing)
 * 5. Thanh phân trang đồng nhất phía dưới bảng
 */
export function CustomTable<T>({
  columns,
  data,
  keyExtractor,
  sortKey = null,
  sortDir = null,
  onSort,
  showStt = true,
  page = 1,
  pageSize = 10,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  actionColumn,
  loading = false,
  emptyText = "Chưa có dữ liệu phù hợp",
  emptyAction,
  onRowClick,
  className = "",
  selectable = false,
  selectedKeys,
  onSelectionChange,
  onBulkDelete,
  bulkDeleteLabel = "Xóa các mục đã chọn",
}: CustomTableProps<T>) {
  const [colWidths, setColWidths] = useState<Record<string, number>>({});
  const [internalSelected, setInternalSelected] = useState<Set<string | number>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const isSelectEnabled = selectable || Boolean(onBulkDelete);
  const activeSelected = selectedKeys ?? internalSelected;
  const setActiveSelected = onSelectionChange ?? setInternalSelected;

  const pageKeys = useMemo(
    () => data.map((row, idx) => keyExtractor(row, idx)),
    [data, keyExtractor],
  );
  const allPageSelected =
    pageKeys.length > 0 && pageKeys.every((k) => activeSelected.has(k));

  const toggleSelectAllPage = () => {
    const next = new Set(activeSelected);
    if (allPageSelected) {
      pageKeys.forEach((k) => next.delete(k));
    } else {
      pageKeys.forEach((k) => next.add(k));
    }
    setActiveSelected(next);
  };

  const toggleSelectRow = (k: string | number) => {
    const next = new Set(activeSelected);
    if (next.has(k)) next.delete(k);
    else next.add(k);
    setActiveSelected(next);
  };

  const handleBulkDeleteClick = async () => {
    if (!onBulkDelete || activeSelected.size === 0) return;
    setBulkBusy(true);
    try {
      await onBulkDelete(Array.from(activeSelected));
      setActiveSelected(new Set());
    } finally {
      setBulkBusy(false);
    }
  };

  const handleResize = useCallback((colKey: string, newW: number) => {
    setColWidths((prev) => ({ ...prev, [colKey]: newW }));
  }, []);

  const totalCount = total !== undefined ? total : data.length;
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  return (
    <div className="space-y-2">
      {isSelectEnabled && onBulkDelete && (
        <BulkDeleteBar
          selectedCount={activeSelected.size}
          onBulkDelete={handleBulkDeleteClick}
          onClear={() => setActiveSelected(new Set())}
          label={bulkDeleteLabel}
          busy={bulkBusy}
        />
      )}
      <div
        className={`rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-card shadow-xs overflow-hidden ${className}`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse select-text">
            <thead>
              <tr className="h-11 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 tracking-wider">
                {isSelectEnabled && (
                  <th className="w-10 px-3 text-center border-r border-slate-200 dark:border-slate-800 select-none">
                    <input
                      type="checkbox"
                      checked={allPageSelected}
                      onChange={toggleSelectAllPage}
                      aria-label="Chọn tất cả"
                      className="h-4 w-4 rounded border-slate-300 text-[#003B95] focus:ring-[#003B95] cursor-pointer"
                    />
                  </th>
                )}
                {showStt && (
                <th className="w-12 px-3 text-center border-r border-slate-200 dark:border-slate-800 select-none">
                  STT
                </th>
              )}

              {columns.map((col) => {
                const isSortable = col.sortable !== false && !!onSort;
                const isActive = sortKey === col.key && sortDir !== null;
                const ColIcon = col.icon;
                const widthStyle = colWidths[col.key] || col.width;

                return (
                  <ResizableHeaderCell
                    key={col.key}
                    label={col.label}
                    width={widthStyle}
                    minWidth={col.minWidth || 70}
                    align={col.align}
                    className={`border-r border-slate-200 dark:border-slate-800 last:border-r-0 ${
                      col.className || ""
                    }`}
                    onResize={(w) => handleResize(col.key, w)}
                  >
                    {isSortable ? (
                      <button
                        type="button"
                        onClick={() => onSort(col.key)}
                        className={`inline-flex items-center gap-1.5 uppercase transition-colors hover:text-foreground cursor-pointer focus:outline-none ${
                          isActive
                            ? "text-[#003B95] dark:text-blue-400 font-black"
                            : "text-slate-600 dark:text-slate-400"
                        } ${col.align === "right" ? "flex-row-reverse" : ""}`}
                        title={
                          !isActive
                            ? `Bấm để sắp xếp tăng dần theo ${col.label}`
                            : sortDir === "asc"
                            ? `Đang sắp xếp tăng dần. Bấm để sắp xếp giảm dần`
                            : `Đang sắp xếp giảm dần. Bấm để bỏ sắp xếp`
                        }
                      >
                        {ColIcon && <ColIcon className="h-3.5 w-3.5 shrink-0" />}
                        <span>{col.label}</span>
                        {!isActive ? (
                          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-slate-400 opacity-60" />
                        ) : sortDir === "asc" ? (
                          <ChevronUp className="h-3.5 w-3.5 shrink-0 text-[#003B95] dark:text-blue-400" strokeWidth={2.5} />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#003B95] dark:text-blue-400" strokeWidth={2.5} />
                        )}
                      </button>
                    ) : (
                      <div
                        className={`inline-flex items-center gap-1.5 uppercase ${
                          col.align === "right" ? "flex-row-reverse" : ""
                        }`}
                      >
                        {ColIcon && <ColIcon className="h-3.5 w-3.5 shrink-0" />}
                        <span>{col.label}</span>
                      </div>
                    )}
                  </ResizableHeaderCell>
                );
              })}

              {actionColumn && (
                <ResizableHeaderCell
                  label={actionColumn.title || "THAO TÁC"}
                  width={colWidths["__action_col__"] || actionColumn.width || 128}
                  minWidth={actionColumn.minWidth || 80}
                  align="center"
                  className="px-4 text-center select-none font-bold"
                  onResize={(w) => handleResize("__action_col__", w)}
                >
                  <span className="uppercase">{actionColumn.title || "THAO TÁC"}</span>
                </ResizableHeaderCell>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
            {loading ? (
              <tr>
                <td
                  colSpan={
                    columns.length + (isSelectEnabled ? 1 : 0) + (showStt ? 1 : 0) + (actionColumn ? 1 : 0)
                  }
                  className="py-12 text-center text-slate-500"
                >
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-[#003B95] border-t-transparent rounded-full animate-spin" />
                    <span>Đang nạp dữ liệu...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    columns.length + (isSelectEnabled ? 1 : 0) + (showStt ? 1 : 0) + (actionColumn ? 1 : 0)
                  }
                  className="py-14 text-center text-slate-500"
                >
                  <p className="text-sm font-medium">{emptyText}</p>
                  {emptyAction && <div className="mt-3">{emptyAction}</div>}
                </td>
              </tr>
            ) : (
              data.map((row, index) => {
                const key = keyExtractor(row, index);
                const stt = (page - 1) * pageSize + index + 1;
                const isRowSelected = activeSelected.has(key);

                return (
                  <tr
                    key={key}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={`h-16 hover:bg-slate-50/60 dark:hover:bg-slate-900/40 transition ${
                      isRowSelected ? "bg-blue-50/60 dark:bg-blue-950/30" : ""
                    } ${onRowClick ? "cursor-pointer" : ""}`}
                  >
                    {isSelectEnabled && (
                      <td
                        className="w-10 px-3 text-center border-r border-slate-200 dark:border-slate-800"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isRowSelected}
                          onChange={() => toggleSelectRow(key)}
                          aria-label="Chọn dòng"
                          className="h-4 w-4 rounded border-slate-300 text-[#003B95] focus:ring-[#003B95] cursor-pointer"
                        />
                      </td>
                    )}
                    {showStt && (
                      <td className="w-12 px-3 text-center text-slate-500 dark:text-slate-400 text-xs font-semibold border-r border-slate-200 dark:border-slate-800">
                        {stt}
                      </td>
                    )}

                    {columns.map((col) => {
                      const rawContent = col.render
                        ? col.render(row, index)
                        : (row as any)[col.key];

                      let content = rawContent;
                      if (typeof rawContent === "string" || typeof rawContent === "number") {
                        content = (
                          <CeoTableEllipsis
                            text={rawContent}
                            maxLines={2}
                            showTooltip={true}
                          />
                        );
                      }

                      return (
                        <td
                          key={col.key}
                          className={`px-4 text-slate-800 dark:text-slate-100 border-r border-slate-200 dark:border-slate-800 last:border-r-0 ${
                            col.align === "right"
                              ? "text-right"
                              : col.align === "center"
                              ? "text-center"
                              : "text-left"
                          } ${col.className || ""}`}
                        >
                          {content}
                        </td>
                      );
                    })}

                    {actionColumn && (
                      <td className="px-4 text-center">
                        {actionColumn.actions ? (
                          <TableActionsGroup actions={actionColumn.actions(row, index)} maxVisible={3} />
                        ) : actionColumn.render ? (
                          <TableActionsGroup maxVisible={3}>
                            {actionColumn.render(row, index)}
                          </TableActionsGroup>
                        ) : null}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Unified Pagination */}
      {onPageChange && (
        <Pagination
          page={page}
          pageCount={pageCount}
          pageSize={pageSize}
          total={totalCount}
          from={from}
          to={to}
          onPage={onPageChange}
          onPageSize={onPageSizeChange || (() => {})}
          pageSizeOptions={pageSizeOptions}
        />
      )}
      </div>
    </div>
  );
}

function ResizableHeaderCell({
  label,
  children,
  width,
  minWidth = 70,
  align = "left",
  className = "",
  onResize,
}: {
  label: string;
  children: React.ReactNode;
  width?: number | string;
  minWidth?: number;
  align?: "left" | "center" | "right";
  className?: string;
  onResize?: (newWidth: number) => void;
}) {
  const thRef = useRef<HTMLTableCellElement>(null);
  const [isResizing, setIsResizing] = useState(false);

  const handleResizeStart = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      const startX = e.clientX;
      const th = thRef.current;
      const startWidth = th
        ? th.getBoundingClientRect().width
        : typeof width === "number"
        ? width
        : 120;
      setIsResizing(true);

      const handlePointerMove = (moveEvt: PointerEvent) => {
        const delta = moveEvt.clientX - startX;
        const newW = Math.max(minWidth, Math.round(startWidth + delta));
        if (th) {
          th.style.width = `${newW}px`;
          th.style.minWidth = `${newW}px`;
        }
        if (onResize) onResize(newW);
      };

      const handlePointerUp = () => {
        setIsResizing(false);
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    },
    [minWidth, onResize, width]
  );

  return (
    <th
      ref={thRef}
      style={
        width
          ? {
              width: typeof width === "number" ? `${width}px` : width,
              minWidth: `${minWidth}px`,
            }
          : { minWidth: `${minWidth}px` }
      }
      className={`group/col relative px-4 py-3 select-none text-xs font-bold transition-colors ${
        align === "right"
          ? "text-right"
          : align === "center"
          ? "text-center"
          : "text-left"
      } ${className}`}
    >
      <div
        className={`flex items-center gap-1.5 w-full ${
          align === "right"
            ? "justify-end flex-row-reverse"
            : align === "center"
            ? "justify-center"
            : "justify-start"
        }`}
      >
        {children}
      </div>

      <div
        onPointerDown={handleResizeStart}
        onClick={(e) => e.stopPropagation()}
        className={`absolute top-0 right-0 h-full w-3 cursor-col-resize flex items-center justify-center z-20 group/handle touch-none ${
          isResizing ? "opacity-100" : "opacity-0 group-hover/col:opacity-100"
        } transition-opacity`}
        title="Kéo sang trái hoặc phải để chỉnh độ rộng cột"
      >
        <div
          className={`w-[2px] transition-all rounded-full ${
            isResizing
              ? "bg-[#003B95] h-full ring-2 ring-[#003B95]/30"
              : "bg-slate-300 dark:bg-slate-700 h-4 group-hover/handle:bg-[#003B95] group-hover/handle:h-full"
          }`}
        />
      </div>
    </th>
  );
}

/* ────────────────────────────────────────────────────────────
 * ── 4 KPI CARDS CHUẨN FIGMA EXACT GRADIENTS ──
 * ──────────────────────────────────────────────────────────── */

export type CrmMetricTone = "sky" | "violet" | "orange" | "green";

const METRIC_TONE_STYLES: Record<
  CrmMetricTone,
  {
    bg: string;
    textTitle: string;
    iconColor: string;
  }
> = {
  sky: {
    bg: "bg-white dark:bg-card border border-slate-200 dark:border-slate-800",
    textTitle: "text-[#003B95] dark:text-blue-400",
    iconColor: "text-[#003B95] dark:text-blue-400",
  },
  violet: {
    bg: "bg-white dark:bg-card border border-slate-200 dark:border-slate-800",
    textTitle: "text-[#003B95] dark:text-blue-400",
    iconColor: "text-[#003B95] dark:text-blue-400",
  },
  orange: {
    bg: "bg-white dark:bg-card border border-slate-200 dark:border-slate-800",
    textTitle: "text-amber-600 dark:text-amber-400",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  green: {
    bg: "bg-white dark:bg-card border border-slate-200 dark:border-slate-800",
    textTitle: "text-emerald-600 dark:text-emerald-400",
    iconColor: "text-emerald-600 dark:text-emerald-400",
  },
};

export interface CrmMetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon | React.ComponentType<{ className?: string }>;
  tone: CrmMetricTone;
  to?: string;
}

export function CrmMetricCard({
  label,
  value,
  sub,
  icon: Icon,
  tone,
}: CrmMetricCardProps) {
  const styles = METRIC_TONE_STYLES[tone];

  return (
    <div
      className={`h-32 p-4 ${styles.bg} rounded-[20px] outline outline-[0.50px] outline-slate-200 dark:outline-slate-800 flex flex-col justify-start items-start gap-2.5 overflow-hidden shadow-xs`}
    >
      <div className="h-8 flex items-center gap-2">
        <Icon className={`h-4 w-4 ${styles.iconColor}`} />
        <div
          className={`text-xs font-semibold font-['Inter'] uppercase tracking-tight ${styles.textTitle}`}
        >
          {label}
        </div>
      </div>
      <div className="text-slate-900 dark:text-white text-2xl font-bold font-['Inter'] leading-7">
        {typeof value === "number" ? value.toLocaleString("vi-VN") : value}
      </div>
      <div className="text-slate-500 dark:text-slate-400 text-xs font-normal font-['Inter'] truncate w-full">
        {sub || "Dữ liệu thực tế hệ thống"}
      </div>
    </div>
  );
}

export function CrmMetricGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────
 * ── TOOLBAR TÌM KIẾM CẠNH THÊM MỚI (FIGMA STYLE) ──
 * ──────────────────────────────────────────────────────────── */

export interface CrmToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchPlaceholder?: string;
  addButtonLabel?: string;
  onAddClick?: () => void;
  addIcon?: LucideIcon;
  children?: React.ReactNode;
}

export function CrmToolbar({
  searchQuery,
  onSearchChange,
  searchPlaceholder = "Tìm kiếm...",
  addButtonLabel,
  onAddClick,
  addIcon: AddIcon = Plus,
  children,
}: CrmToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-[0px_2px_2px_0px_rgba(22,39,75,0.05)]">
      <div className="flex flex-1 items-center gap-2 max-w-xl">
        <div className="flex-1 h-9 px-3 bg-white dark:bg-card rounded-3xl outline outline-1 outline-slate-200 dark:outline-slate-700 flex items-center gap-2.5 overflow-hidden">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="flex-1 bg-transparent text-xs text-slate-900 dark:text-white placeholder:text-slate-500 outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {addButtonLabel && onAddClick && (
          <button
            type="button"
            onClick={onAddClick}
            className="h-9 px-4 bg-[#003B95] hover:bg-[#002f78] rounded-3xl shadow-sm flex items-center gap-2 text-white text-xs font-bold transition shrink-0 cursor-pointer"
          >
            <AddIcon className="h-3.5 w-3.5" />
            <span>{addButtonLabel}</span>
          </button>
        )}
      </div>

      {children && (
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      )}
    </div>
  );
}
