import { Shield } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  GRANULAR_PERMISSION_CATEGORIES,
  getDefaultPermissionsForRole,
  getAllActionCodesForRoutes,
} from "@/lib/rbac-permission-helpers";

export function GranularRoleAndActionPicker({
  mode,
  onModeChange,
  role,
  selectedPerms,
  onChangeSelectedPerms,
}: {
  mode: "role" | "granular";
  onModeChange: (m: "role" | "granular") => void;
  role: string;
  selectedPerms: string[];
  onChangeSelectedPerms: (updater: (prev: string[]) => string[]) => void;
}) {
  const defaultRoleRoutes = getDefaultPermissionsForRole(role);
  const defaultRoleActions = getAllActionCodesForRoutes(defaultRoleRoutes);
  const rolePreviewSet = new Set<string>([...defaultRoleRoutes, ...defaultRoleActions]);

  const handleSwitchToGranular = () => {
    if (selectedPerms.length === 0) {
      onChangeSelectedPerms(() => [...defaultRoleRoutes, ...defaultRoleActions]);
    }
    onModeChange("granular");
  };

  const toggleFeature = (itemKey: string, actionCodes: string[], checked: boolean) => {
    onChangeSelectedPerms((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(itemKey);
        const hasAnyAct = actionCodes.some((c) => next.has(c));
        if (!hasAnyAct && actionCodes.length > 0) {
          next.add(actionCodes[0]);
        }
      } else {
        next.delete(itemKey);
        actionCodes.forEach((c) => next.delete(c));
      }
      return Array.from(next);
    });
  };

  const toggleAction = (itemKey: string, actionCode: string, checked: boolean) => {
    onChangeSelectedPerms((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(itemKey);
        next.add(actionCode);
      } else {
        next.delete(actionCode);
      }
      return Array.from(next);
    });
  };

  const toggleAllActionsForItem = (itemKey: string, actionCodes: string[], selectAll: boolean) => {
    onChangeSelectedPerms((prev) => {
      const next = new Set(prev);
      if (selectAll) {
        next.add(itemKey);
        actionCodes.forEach((c) => next.add(c));
      } else {
        actionCodes.forEach((c) => next.delete(c));
      }
      return Array.from(next);
    });
  };

  return (
    <div className="pt-2 border-t border-slate-200">
      <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
        <Label className="text-xs font-bold text-slate-900">
          Phương thức phân quyền chức năng:
        </Label>
        <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-[11px]">
          <button
            type="button"
            onClick={() => onModeChange("role")}
            className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
              mode === "role"
                ? "bg-[#002B70] text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Kiểu 1: Theo Role (Tích sẵn)
          </button>
          <button
            type="button"
            onClick={handleSwitchToGranular}
            className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
              mode === "granular"
                ? "bg-[#002B70] text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Kiểu 2: Chọn Chức Năng &amp; Thao Tác
          </button>
        </div>
      </div>

      {mode === "role" ? (
        <div className="p-2.5 rounded-xl border border-blue-200/80 bg-blue-50/40 max-h-60 overflow-y-auto space-y-2.5">
          <div className="text-[10px] text-blue-900 font-medium flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#002B70] shrink-0" />
            <span>
              Quyền mặc định được tích sẵn theo vai trò <strong>{role}</strong> (chuyển sang Kiểu 2 nếu muốn tùy chỉnh từng thao tác):
            </span>
          </div>
          {GRANULAR_PERMISSION_CATEGORIES.map((cat) => (
            <div key={cat.category} className="space-y-1">
              <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                {cat.category}
              </div>
              <div className="space-y-1.5 pl-1">
                {cat.items.map((p) => {
                  const isChecked = rolePreviewSet.has(p.key);
                  const actions = p.actions || [];
                  return (
                    <div
                      key={p.key}
                      className={`p-2 rounded-lg border text-left ${
                        isChecked
                          ? "bg-white border-blue-200 text-blue-950"
                          : "bg-slate-50/70 border-slate-200 text-slate-400"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          readOnly
                          disabled
                          className="rounded text-[#002B70]"
                        />
                        <span className="text-[11px] font-bold">{p.name}</span>
                      </div>
                      {actions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1.5 pl-5">
                          {actions.map((act) => {
                            const actChecked = rolePreviewSet.has(act.code);
                            return (
                              <span
                                key={act.code}
                                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border ${
                                  actChecked
                                    ? "bg-blue-50 border-blue-200 text-blue-800 font-semibold"
                                    : "bg-slate-100 border-slate-200 text-slate-400"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={actChecked}
                                  readOnly
                                  disabled
                                  className="w-3 h-3 rounded"
                                />
                                {act.label}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 max-h-64 overflow-y-auto space-y-3">
          <div className="text-[10px] text-slate-600 italic">
            Tích chọn chức năng và từng thao tác cụ thể tài khoản được phép thực hiện. Thao tác nào không được tích sẽ tự động ẩn khỏi giao diện và bị chặn API:
          </div>
          {GRANULAR_PERMISSION_CATEGORIES.map((cat) => (
            <div key={cat.category} className="space-y-1.5">
              <div className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">
                {cat.category}
              </div>
              <div className="space-y-1.5 pl-1">
                {cat.items.map((p) => {
                  const isFeatureChecked = selectedPerms.includes(p.key);
                  const actions = p.actions || [];
                  const actionCodes = actions.map((a) => a.code);
                  const checkedActionCount = actionCodes.filter((c) => selectedPerms.includes(c)).length;
                  const allActionsChecked = actionCodes.length > 0 && checkedActionCount === actionCodes.length;

                  return (
                    <div
                      key={p.key}
                      className={`p-2 rounded-lg border transition ${
                        isFeatureChecked
                          ? "bg-white border-blue-300 text-blue-950 shadow-2xs"
                          : "bg-white/70 border-slate-200 text-slate-600"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <label className="flex items-center gap-1.5 cursor-pointer flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={isFeatureChecked}
                            onChange={(e) => toggleFeature(p.key, actionCodes, e.target.checked)}
                            className="rounded text-[#002B70]"
                          />
                          <div className="min-w-0 flex-1 leading-tight">
                            <span className="text-[11px] font-bold">{p.name}</span>
                            <span className="text-[9px] text-slate-400 ml-1.5">({p.desc})</span>
                          </div>
                        </label>
                        {actionCodes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => toggleAllActionsForItem(p.key, actionCodes, !allActionsChecked)}
                            className="text-[10px] font-semibold text-[#002B70] hover:underline shrink-0 cursor-pointer"
                          >
                            {allActionsChecked ? "Bỏ hết thao tác" : "Chọn tất cả"}
                          </button>
                        )}
                      </div>

                      {actions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2 pl-5">
                          {actions.map((act) => {
                            const isActChecked = selectedPerms.includes(act.code);
                            return (
                              <label
                                key={act.code}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] cursor-pointer transition ${
                                  isActChecked
                                    ? "bg-blue-50 border-blue-300 text-blue-900 font-semibold"
                                    : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isActChecked}
                                  onChange={(e) => toggleAction(p.key, act.code, e.target.checked)}
                                  className="w-3 h-3 rounded text-[#002B70]"
                                />
                                <span>{act.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
