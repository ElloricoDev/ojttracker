import { httpClient } from './httpClient';
import type { ApiEnvelope, PaginatedQuery, PaginatedResponse } from '../types/api';
import type {
  AttendanceLog,
  DailyReport,
  Placement,
  StudentDocument,
  StudentNotification,
  WeeklyReport,
} from '../types/student';

export type StudentPlacementRequestPayload = {
  company_id: number;
  start_date: string;
  end_date?: string | null;
  ojt_batch_id?: number | null;
};

export type StudentAttendanceActionPayload = {
  placement_id: number;
  timestamp?: string;
};

export type StudentDailyReportPayload = {
  placement_id: number;
  work_date: string;
  accomplishments: string;
  hours_rendered: number;
};

export type StudentWeeklyReportPayload = {
  placement_id: number;
  week_start: string;
  week_end: string;
  accomplishments: string;
  hours_rendered: number;
};

export type StudentDocumentUploadFile = {
  uri: string;
  name: string;
  type?: string | null;
};

export type StudentDocumentUploadPayload = {
  placement_id: number;
  document_type: string;
  document_file: StudentDocumentUploadFile;
};

export type StudentNotificationReadAllData = {
  updated_count: number;
  read_at: string;
};

function buildPaginatedParams(query: PaginatedQuery = {}): Record<string, number | string> {
  const params: Record<string, number | string> = {};

  if (query.page && query.page > 0) {
    params.page = query.page;
  }

  if (query.perPage && query.perPage > 0) {
    params.per_page = query.perPage;
  }

  if (query.search && query.search.trim().length > 0) {
    params.search = query.search.trim();
  }

  if (query.sort && query.sort.length > 0) {
    params.sort = query.sort;
  }

  if (query.direction) {
    params.direction = query.direction;
  }

  if (query.placementId && query.placementId > 0) {
    params.placement_id = query.placementId;
  }

  return params;
}

async function fetchPaginatedResource<TData>(
  endpoint: string,
  query: PaginatedQuery = {}
): Promise<PaginatedResponse<TData>> {
  const response = await httpClient.get<PaginatedResponse<TData>>(endpoint, {
    params: buildPaginatedParams(query),
  });

  return response.data;
}

export async function getStudentPlacement(): Promise<Placement | null> {
  const response = await httpClient.get<ApiEnvelope<Placement | null>>('/v1/student/placement');
  return response.data.data;
}

export async function requestStudentPlacement(
  payload: StudentPlacementRequestPayload
): Promise<Placement> {
  const response = await httpClient.post<ApiEnvelope<Placement>>(
    '/v1/student/placement/request',
    payload
  );
  return response.data.data;
}

export async function getStudentAttendance(
  query: PaginatedQuery = {}
): Promise<PaginatedResponse<AttendanceLog>> {
  return fetchPaginatedResource<AttendanceLog>('/v1/student/attendance', query);
}

export async function submitStudentAttendanceTimeIn(
  payload: StudentAttendanceActionPayload
): Promise<AttendanceLog> {
  const response = await httpClient.post<ApiEnvelope<AttendanceLog>>(
    '/v1/student/attendance/time-in',
    payload
  );

  return response.data.data;
}

export async function submitStudentAttendanceTimeOut(
  payload: StudentAttendanceActionPayload
): Promise<AttendanceLog> {
  const response = await httpClient.post<ApiEnvelope<AttendanceLog>>(
    '/v1/student/attendance/time-out',
    payload
  );

  return response.data.data;
}

export async function getStudentDailyReports(
  query: PaginatedQuery = {}
): Promise<PaginatedResponse<DailyReport>> {
  return fetchPaginatedResource<DailyReport>('/v1/student/daily-reports', query);
}

export async function submitStudentDailyReport(
  payload: StudentDailyReportPayload
): Promise<DailyReport> {
  const response = await httpClient.post<ApiEnvelope<DailyReport>>(
    '/v1/student/daily-reports',
    payload
  );

  return response.data.data;
}

export async function getStudentWeeklyReports(
  query: PaginatedQuery = {}
): Promise<PaginatedResponse<WeeklyReport>> {
  return fetchPaginatedResource<WeeklyReport>('/v1/student/weekly-reports', query);
}

export async function submitStudentWeeklyReport(
  payload: StudentWeeklyReportPayload
): Promise<WeeklyReport> {
  const response = await httpClient.post<ApiEnvelope<WeeklyReport>>(
    '/v1/student/weekly-reports',
    payload
  );

  return response.data.data;
}

export async function getStudentDocuments(
  query: PaginatedQuery = {}
): Promise<PaginatedResponse<StudentDocument>> {
  return fetchPaginatedResource<StudentDocument>('/v1/student/documents', query);
}

export async function uploadStudentDocument(
  payload: StudentDocumentUploadPayload
): Promise<StudentDocument> {
  const formData = new FormData();
  formData.append('placement_id', String(payload.placement_id));
  formData.append('document_type', payload.document_type);
  formData.append('document_file', {
    uri: payload.document_file.uri,
    name: payload.document_file.name,
    type: payload.document_file.type ?? 'application/octet-stream',
  } as unknown as Blob);

  const response = await httpClient.post<ApiEnvelope<StudentDocument>>(
    '/v1/student/documents',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data.data;
}

export async function getStudentNotifications(
  query: PaginatedQuery = {}
): Promise<PaginatedResponse<StudentNotification>> {
  return fetchPaginatedResource<StudentNotification>('/v1/student/notifications', query);
}

export async function getStudentUnreadNotifications(limit = 10): Promise<StudentNotification[]> {
  const safeLimit = Math.max(1, Math.min(limit, 50));
  const response = await httpClient.get<ApiEnvelope<StudentNotification[]>>(
    '/v1/student/notifications/unread',
    {
      params: {
        limit: safeLimit,
      },
    }
  );

  return response.data.data;
}

export async function markStudentNotificationRead(
  notificationId: number
): Promise<StudentNotification> {
  const response = await httpClient.patch<ApiEnvelope<StudentNotification>>(
    `/v1/student/notifications/${notificationId}/read`,
    {}
  );

  return response.data.data;
}

export async function markAllStudentNotificationsRead(): Promise<StudentNotificationReadAllData> {
  const response = await httpClient.patch<ApiEnvelope<StudentNotificationReadAllData>>(
    '/v1/student/notifications/read-all',
    {}
  );

  return response.data.data;
}
