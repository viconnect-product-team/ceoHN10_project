import React, { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, Check, Eye, EyeOff } from "lucide-react";
import type { DynamicFieldDef } from "./DynamicFieldRenderer";

interface DynamicTableColumnsConfigProps {
  dynamicFields: DynamicFieldDef[];
  visibleColumns: string[];
  onChangeVisibleColumns: (columns: string[]) => void;
}

export function DynamicTableColumnsConfig({
  dynamicFields,
  visibleColumns,
  onChangeVisibleColumns,
}: DynamicTableColumnsConfigProps) {
  const [open, setOpen] = useState(false);

  const toggleColumn = (colName: string) => {
    if (visibleColumns.includes(colName)) {
      onChangeVisibleColumns(visibleColumns.filter((c) => c !== colName));
    } else {
      onChangeVisibleColumns([...visibleColumns, colName]);
    }
  };

  const showAll = () => {
    onChangeVisibleColumns(dynamicFields.map((f) => f.field_name));
  };

  const hideAll = () => {
    onChangeVisibleColumns([]);
  };

  if (!dynamicFields || dynamicFields.length === 0) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-8 gap-1.5 border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
          <span>Cột hiển thị</span>
          {visibleColumns.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#003B95] text-white text-[10px] font-bold flex items-center justify-center">
              {visibleColumns.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-3 bg-card border border-border shadow-xl rounded-xl space-y-2 text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <span className="font-bold text-foreground">Bật/tắt cột động</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={showAll}
              className="text-[11px] text-[#003B95] hover:underline"
            >
              Hiện tất cả
            </button>
            <span className="text-muted-foreground/40">|</span>
            <button
              type="button"
              onClick={hideAll}
              className="text-[11px] text-muted-foreground hover:underline"
            >
              Ẩn
            </button>
          </div>
        </div>

        <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
          {dynamicFields.map((df) => {
            const isVisible = visibleColumns.includes(df.field_name);
            return (
              <label
                key={df.id}
                className="flex items-center justify-between p-1.5 rounded-lg hover:bg-muted/40 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isVisible}
                    onChange={() => toggleColumn(df.field_name)}
                    className="rounded border-border text-[#003B95] focus:ring-0"
                  />
                  <span className="font-medium text-foreground">{df.field_label}</span>
                </div>
                <span className="text-[10px] uppercase font-mono text-muted-foreground">
                  {df.field_type}
                </span>
              </label>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
