// Approval system types and interfaces

export interface PendingProperty {
  id: string;
  code: string;
  status: 'pending';
  property_category: 'residential' | 'commercial';
  property_subcategory: string;
  listing_type: 'agency_owned' | 'branch_owned' | 'brokerage';
  area_m2: string;
  buy_price_azn?: string;
  sell_price_azn?: string;
  created_at: string;
  created_by_first_name?: string;
  created_by_last_name?: string;
  branch_name?: string;
  days_pending?: number;
}

export interface PendingApprovalsResponse {
  success: boolean;
  data: {
    approvals: PendingProperty[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface ApprovalResponse {
  success: boolean;
  data: {
    message: string;
    property_id: string;
    new_status: 'active' | 'rejected';
    audit_log_id: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface ApprovalHistoryEntry {
  id: string;
  action: 'APPROVE' | 'REJECT';
  actor: string;
  before_state: Record<string, any>;
  after_state: Record<string, any>;
  metadata: {
    actor_role: string;
    listing_type: string;
    property_code: string;
    comments?: string;
    rejection_reason?: string;
  };
  timestamp: string;
}

export interface ApprovalHistoryResponse {
  success: boolean;
  data: {
    property_id: string;
    history: ApprovalHistoryEntry[];
  };
}

export type PropertyStatus = 'pending' | 'active' | 'rejected' | 'sold' | 'archived';
export type ListingType = 'agency_owned' | 'branch_owned' | 'brokerage';
export type ApprovalAction = 'approve' | 'reject';