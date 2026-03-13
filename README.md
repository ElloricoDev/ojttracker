# OJT Tracking System

## Overview
This system manages OJT placements, attendance, daily and weekly reports, evaluations, documents, notifications, and completion analytics. It is role-based and supports Admin, Coordinator, Faculty Adviser, Company Supervisor, and Student users.

## Developer Checkpoint (Web + Mobile)
1. Set `mobile/.env` with your machine LAN IP so phone devices can reach Laravel:
   - `EXPO_PUBLIC_API_BASE_URL=http://<YOUR_LAN_IP>:8001/api`
2. From the project root, start the full stack in one command:
   - `npm run checkpoint:start`
3. Open web Inertia app at `http://127.0.0.1:8001` (do not open `http://0.0.0.0:8001` in a browser).
4. Open Expo Go and scan the QR from the terminal.

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

# OJT Tracker User Guide

## Purpose
This guide explains how each role uses the OJT Tracking System, what modules are available, and the core workflows.

## Permission Matrix

Module | Admin | Coordinator | Adviser | Supervisor | Student
---|---|---|---|---|---
Dashboard | Full | Full | Scoped | Scoped | Scoped
Users | Full | Manage Coordinator/Adviser | No | No | No
Students | Full | Full | No | No | No
Companies | Full | Full | No | No | No
Supervisors | Full | Full | No | No | No
Batches | Full | Full | No | No | No
Placements | Full | Full | View assigned | View assigned | View own
Placement Request | No | No | No | No | Yes
Attendance | Approve all | Approve all | Approve assigned | Approve assigned | Submit own
Daily Reports | Review all | Review all | Review assigned | Review assigned | Submit own
Weekly Reports | Review all | Review all | Review assigned | Review assigned | Submit own
Evaluations | Create/edit all | Create/edit all | Create for assigned | Create for assigned | No
Documents | Verify all | Verify all | Verify assigned | Verify assigned | Upload own
Notifications | Full | Full | Full | Full | Full
Reports | Full | Full | Scoped | Scoped | Scoped
Exports | Full | Full | Scoped | Scoped | Scoped
Audit Logs | Full | No | No | No | No

## Role Walkthroughs

### Admin
1. Go to Users to create Admin/Coordinator/Adviser accounts.
2. Go to Students to create Student accounts.
3. Go to Companies, Supervisors, and Batches to set up master data.
4. Go to Placements to create, approve, activate, complete, or cancel placements.
5. Approve Attendance, review Daily/Weekly Reports, verify Documents, and create Evaluations.
6. Use Reports and Exports for analytics.
7. Review Audit Logs for critical activity.

### Coordinator
1. Manage Students, Companies, Supervisors, and Batches.
2. Manage Placements and approvals.
3. Approve Attendance, review Daily/Weekly Reports, verify Documents, and create Evaluations.
4. Use Reports and Exports for analytics.

### Faculty Adviser
1. Open Placements to view assigned students.
2. Review Daily and Weekly Reports.
3. Verify Documents.
4. Create Evaluations for assigned placements.
5. View Reports scoped to assigned placements.

### Company Supervisor
1. Open Placements to view supervised students.
2. Review Daily and Weekly Reports.
3. Verify Documents.
4. Create Evaluations for assigned placements.
5. View Reports scoped to assigned placements.

### Student
1. If not assigned, use Placements > Request Placement.
2. Use Attendance to time in and time out.
3. Submit Daily and Weekly Reports.
4. Upload Documents.
5. Track Notifications and Reports for progress.

## Workflow Details

### Placement
1. Student submits a placement request.
2. Coordinator or Admin approves and activates.
3. Coordinator or Admin completes or cancels when needed.

### Attendance
1. Student time in and time out.
2. Adviser, Supervisor, Coordinator, or Admin approves or rejects.

### Reports
1. Student submits Daily or Weekly Report.
2. Adviser, Supervisor, Coordinator, or Admin reviews and marks reviewed or rejected.

### Evaluations
1. Adviser or Supervisor submits evaluation.
2. Admin or Coordinator may also submit evaluations.
3. Evaluation period is required: midterm, final, or periodic.

### Documents
1. Student uploads required documents.
2. Adviser, Supervisor, Coordinator, or Admin verifies or rejects.
3. Documents are downloaded via secured links.

## Notes
1. Self-registration is disabled. Accounts are created by Admin or Coordinator.
2. Students can only have one approved or active placement at a time.
3. Batches cannot be deleted if placements exist.



# OJT Tracker Instructions

## Getting Started
1. Admin or Coordinator creates accounts for Users, Students, and Supervisors.
2. Users log in using their assigned email and password.
3. Each role sees only the modules and records they are allowed to access.

## Role Usage

### Admin
1. Create and manage Users, Students, Companies, Supervisors, and Batches.
2. Manage placements and approve or update placement status.
3. Approve attendance, review reports, verify documents, and submit evaluations.
4. Review Reports and export analytics.
5. Review Audit Logs for critical actions.

### Coordinator
1. Manage Students, Companies, Supervisors, and Batches.
2. Manage placements and approvals.
3. Approve attendance, review reports, verify documents, and submit evaluations.
4. Review Reports and export analytics.

### Faculty Adviser
1. Review placements assigned to you.
2. Review daily and weekly reports for assigned placements.
3. Verify documents for assigned placements.
4. Submit evaluations for assigned placements.

### Company Supervisor
1. Review placements you supervise.
2. Review daily and weekly reports for assigned placements.
3. Verify documents for assigned placements.
4. Submit evaluations for assigned placements.

### Student
1. Request a placement if not assigned.
2. Time in and time out daily.
3. Submit daily and weekly reports.
4. Upload required documents.
5. Monitor progress and notifications.

## Core Workflows

### Placement Request and Approval
1. Student submits a placement request.
2. Coordinator or Admin approves the placement.
3. Coordinator or Admin activates the placement.
4. Coordinator or Admin completes or cancels when needed.

### Attendance
1. Student submits time-in and time-out.
2. Adviser, Supervisor, Coordinator, or Admin approves or rejects attendance.

### Reports
1. Student submits daily or weekly report.
2. Adviser, Supervisor, Coordinator, or Admin reviews and approves or rejects.

### Evaluations
1. Adviser or Supervisor submits evaluation.
2. Admin or Coordinator may also submit evaluations.
3. Evaluation period is required: midterm, final, or periodic.

### Documents
1. Student uploads required documents.
2. Adviser, Supervisor, Coordinator, or Admin verifies or rejects.
3. Documents are downloaded through secured links.

## Notes
1. Self-registration is disabled. Accounts are created by Admin or Coordinator.
2. Students can only have one approved or active placement at a time.
3. Batches cannot be deleted if placements exist.
