# OJT Tracking System

## Overview
This system manages OJT placements, attendance, daily and weekly reports, evaluations, documents, notifications, and completion analytics. It is role-based and supports Admin, Coordinator, Faculty Adviser, Company Supervisor, and Student users.

## Core Modules
1. Dashboard
2. Users (Admin, Coordinator, Adviser accounts)
3. Students
4. Companies
5. Supervisors
6. Batches
7. Placements
8. Attendance
9. Daily Reports
10. Weekly Reports
11. Evaluations
12. Documents
13. Notifications
14. Reports and Exports
15. Audit Logs (Admin only)

## Account Creation
Self-registration is disabled. Admin or Coordinator creates accounts using:
1. Users module for Admin, Coordinator, Adviser roles
2. Students module for Student accounts
3. Supervisors module for Company Supervisor accounts

## Role Permissions

### Admin
1. Full access to all modules, including Audit Logs
2. Can create, update, and delete all master data
3. Can approve attendance, review reports, verify documents, and create evaluations
4. Can export reports

### Coordinator
1. Full operational access except Audit Logs
2. Can manage Users (Coordinator and Adviser only), Students, Companies, Supervisors, Batches
3. Can manage placements and approval workflows
4. Can review and approve attendance, reports, documents, and evaluations
5. Can export reports

### Faculty Adviser
1. Limited to placements assigned to them
2. Can review daily and weekly reports for assigned placements
3. Can verify documents for assigned placements
4. Can create evaluations for assigned placements
5. Reports and exports are scoped to assigned placements

### Company Supervisor
1. Limited to placements they supervise
2. Can review daily and weekly reports for assigned placements
3. Can verify documents for assigned placements
4. Can create evaluations for assigned placements
5. Reports and exports are scoped to assigned placements

### Student
1. Limited to their own placements
2. Can request a placement
3. Can log time in and time out
4. Can submit daily and weekly reports
5. Can upload documents
6. Reports and exports are scoped to their placements

## Core Workflows

### Placement Workflow
1. Student submits a placement request
2. Coordinator or Admin reviews and approves the placement
3. Coordinator or Admin activates the placement
4. Coordinator or Admin completes or cancels when needed
5. Students can only have one approved or active placement at a time

### Attendance Workflow
1. Student time-in for a placement
2. Student time-out for the same placement
3. Attendance is marked pending
4. Adviser, Supervisor, Coordinator, or Admin approves or rejects it

### Daily and Weekly Reports
1. Student submits a report under their placement
2. Adviser, Supervisor, Coordinator, or Admin reviews and marks it reviewed or rejected
3. Student receives notification of review result

### Evaluations
1. Adviser or Supervisor submits evaluation
2. Admin or Coordinator may also submit evaluations
3. Evaluation period is required: midterm, final, or periodic
4. Evaluations can be updated or deleted by authorized roles

### Documents
1. Student uploads documents tied to their placement
2. Adviser, Supervisor, Coordinator, or Admin verifies or rejects
3. Documents are stored privately and downloaded via secure routes

### Reports and Exports
1. Dashboard and Reports show hours rendered, completion rate, and analytics
2. Exports are available for per-company and per-course reports
3. Data is scoped by role

## How Each Role Uses the System

### Admin Daily Use
1. Login and review Dashboard metrics
2. Manage master data in Users, Students, Companies, Supervisors, Batches
3. Create and manage placements in Placements
4. Approve attendance and review reports as needed
5. Verify documents and submit evaluations
6. Check Reports and export analytics
7. Review Audit Logs for system activity

### Coordinator Daily Use
1. Login and review Dashboard metrics
2. Manage Students, Companies, Supervisors, Batches
3. Manage placements and approvals
4. Approve attendance and review daily and weekly reports
5. Verify documents and create evaluations
6. Export reports if needed

### Faculty Adviser Daily Use
1. Login and review Dashboard metrics for assigned placements
2. Open Placements to see assigned students
3. Review Daily and Weekly Reports
4. Verify Documents for assigned placements
5. Create Evaluations with required period

### Company Supervisor Daily Use
1. Login and review Dashboard metrics for supervised placements
2. Review Daily and Weekly Reports
3. Verify Documents
4. Submit Evaluations

### Student Daily Use
1. Login and review Dashboard and placement progress
2. Request a placement if not assigned
3. Time in and time out daily
4. Submit daily and weekly reports on time
5. Upload required documents
6. Track notifications and progress reports

## Notifications
1. Reminders are generated for missing daily or weekly reports
2. Reviewers receive reminders for pending approvals
3. Students receive notifications when items are approved or rejected

## Notes
1. Self-registration is disabled by default
2. Batch deletion is blocked if placements exist
3. Document downloads require authentication and authorization
