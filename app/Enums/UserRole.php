<?php

namespace App\Enums;

enum UserRole: string
{
    case Admin = 'admin';
    case Coordinator = 'coordinator';
    case Adviser = 'adviser';
    case Supervisor = 'supervisor';
    case Student = 'student';
}
