export type UserSummary = {
  id: number;
  name: string;
};

export type CompanySummary = {
  id: number;
  name: string;
};

export type PlacementCompany = CompanySummary & {
  address: string | null;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
};

export type PlacementPerson = {
  id: number;
  user_id: number;
  name: string;
  email: string;
};

export type PlacementBatch = {
  id: number;
  name: string;
  school_year: string | null;
  semester: string | null;
  start_date: string | null;
  end_date: string | null;
};

export type RelatedPlacement = {
  id: number;
  status: string;
  start_date: string | null;
  end_date: string | null;
  company: CompanySummary | null;
};

export type Placement = {
  id: number;
  student_id: number;
  company_id: number | null;
  supervisor_id: number | null;
  adviser_id: number | null;
  ojt_batch_id: number | null;
  required_hours: number | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  company: PlacementCompany | null;
  supervisor: PlacementPerson | null;
  adviser: PlacementPerson | null;
  batch: PlacementBatch | null;
  created_at: string | null;
  updated_at: string | null;
};

export type AttendanceLog = {
  id: number;
  placement_id: number;
  work_date: string | null;
  time_in: string | null;
  time_out: string | null;
  total_minutes: number | null;
  status: string;
  approved_by: number | null;
  remarks: string | null;
  approver: UserSummary | null;
  placement: RelatedPlacement | null;
  created_at: string | null;
  updated_at: string | null;
};

export type DailyReport = {
  id: number;
  placement_id: number;
  work_date: string | null;
  accomplishments: string;
  hours_rendered: number;
  status: string;
  reviewer_id: number | null;
  reviewer_comment: string | null;
  reviewer: UserSummary | null;
  placement: RelatedPlacement | null;
  created_at: string | null;
  updated_at: string | null;
};

export type WeeklyReport = {
  id: number;
  placement_id: number;
  week_start: string | null;
  week_end: string | null;
  accomplishments: string;
  hours_rendered: number;
  status: string;
  reviewer_id: number | null;
  reviewer_comment: string | null;
  reviewer: UserSummary | null;
  placement: RelatedPlacement | null;
  created_at: string | null;
  updated_at: string | null;
};

export type StudentDocument = {
  id: number;
  placement_id: number;
  document_type: string;
  file_name: string | null;
  file_path: string | null;
  status: string;
  submitted_at: string | null;
  verified_at: string | null;
  verified_by: number | null;
  verifier: UserSummary | null;
  placement: RelatedPlacement | null;
  created_at: string | null;
  updated_at: string | null;
};

export type StudentNotification = {
  id: number;
  type: string;
  title: string;
  body: string;
  url: string | null;
  metadata: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};
