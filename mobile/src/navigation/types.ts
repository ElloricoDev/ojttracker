export type StudentRouteName =
  | 'Dashboard'
  | 'Placement'
  | 'Attendance'
  | 'DailyReports'
  | 'WeeklyReports'
  | 'Documents'
  | 'Notifications'
  | 'Profile';

export type RootStackParamList = {
  Login: undefined;
  App: undefined;
};

export type DrawerParamList = {
  Dashboard: undefined;
  Placement: undefined;
  Attendance: undefined;
  DailyReports: undefined;
  WeeklyReports: undefined;
  Documents: undefined;
  Notifications: undefined;
  Profile: undefined;
};

export type StudentRouteIconName =
  | 'view-dashboard-outline'
  | 'briefcase-outline'
  | 'calendar-check-outline'
  | 'notebook-edit-outline'
  | 'chart-box-outline'
  | 'file-document-outline'
  | 'bell-outline'
  | 'account-circle-outline';

export const STUDENT_ROUTES: ReadonlyArray<{
  name: StudentRouteName;
  label: string;
  icon: StudentRouteIconName;
}> = [
  { name: 'Dashboard', label: 'Dashboard', icon: 'view-dashboard-outline' },
  { name: 'Placement', label: 'Placement', icon: 'briefcase-outline' },
  { name: 'Attendance', label: 'Attendance', icon: 'calendar-check-outline' },
  { name: 'DailyReports', label: 'Daily Reports', icon: 'notebook-edit-outline' },
  { name: 'WeeklyReports', label: 'Weekly Reports', icon: 'chart-box-outline' },
  { name: 'Documents', label: 'Documents', icon: 'file-document-outline' },
  { name: 'Notifications', label: 'Notifications', icon: 'bell-outline' },
  { name: 'Profile', label: 'Profile', icon: 'account-circle-outline' },
];
