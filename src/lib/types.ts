export interface Client {
  id: string;
  nombre: string;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  rut_tax_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  client_id: string;
  invoice_number: string;
  date: string;
  period: string | null;
  protocol_count: number;
  protocol_unit_price: number;
  protocol_total: number;
  onsite_visits: number;
  onsite_unit_price: number;
  onsite_total: number;
  remote_visits: number;
  remote_unit_price: number;
  remote_total: number;
  visit_discount_percent: number;
  visit_discount_amount: number;
  implementation_fee: number;
  subtotal: number;
  discount_amount: number;
  total: number;
  notes: string | null;
  status: "draft" | "sent" | "paid";
  created_at: string;
  updated_at: string;
  client?: Client;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  sort_order: number;
  created_at: string;
}

export interface InvoiceWithItems extends Invoice {
  items: InvoiceItem[];
}
