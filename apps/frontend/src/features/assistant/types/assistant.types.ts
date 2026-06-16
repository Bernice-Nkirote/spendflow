export type AssistantSupplierSuggestion = {
  supplier_id: string;
  supplier_name: string;
  category: string | null;
  sub_category: string | null;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  recent_supplied_items: string[];
  po_count: number;
  total_order_value: number;
  score: number;
  reasons: string[];
};

export type AssistantChatRequest = {
  message: string;
  context?: string;
  item_names?: string[];
  category?: string;
};

export type AssistantChatResponse = {
  answer: string;
  cautions: string[];
  suggested_next_steps: string[];
  supplier_suggestions: AssistantSupplierSuggestion[];
};
