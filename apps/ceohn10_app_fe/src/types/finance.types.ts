export type Transaction = {
  id: string;
  date: string;
  type: "income" | "expense";
  category: string;
  description: string;
  amount: number;
  method: "bank" | "card" | "cash";
  status: "completed" | "pending";
  advanceAmount?: number;
  refundAmount?: number;
  invoiceUrl?: string;
  recipient?: string;
  targetDepartment?: string;
  targetEventId?: string;
  targetEventName?: string;
  fundType?: "general" | "sponsorship_cash" | "sponsorship_in_kind" | string;
  department?: string;
  eventName?: string;
};

