'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { 
  UserPlusIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

// Mock data for team members
const TEAM_MEMBERS = [
  {
    id: 1,
    name: 'Sarah Johnson',
    role: 'Portfolio Manager',
    email: 'sarah.johnson@tokeniq.com',
    phone: '+1 (555) 123-4567',
    department: 'Investment',
    experience: '15 years',
    image: '/team/sarah.jpg',
    status: 'Active'
  },
  {
    id: 2,
    name: 'Michael Chen',
    role: 'Risk Analyst',
    email: 'michael.chen@tokeniq.com',
    phone: '+1 (555) 234-5678',
    department: 'Risk Management',
    experience: '8 years',
    image: '/team/michael.jpg',
    status: 'Active'
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    role: 'Compliance Officer',
    email: 'emily.rodriguez@tokeniq.com',
    phone: '+1 (555) 345-6789',
    department: 'Compliance',
    experience: '12 years',
    image: '/team/emily.jpg',
    status: 'Active'
  },
  {
    id: 4,
    name: 'David Kim',
    role: 'Blockchain Developer',
    email: 'david.kim@tokeniq.com',
    phone: '+1 (555) 456-7890',
    department: 'Technology',
    experience: '6 years',
    image: '/team/david.jpg',
    status: 'Active'
  }
];

export default function TeamPage() {
  const { address, isConnected } = useAccount();
  const [selectedMember, setSelectedMember] = useState<number | null>(null);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4">
        <h1 className="text-2xl font-bold mb-4 text-foreground">Please connect your wallet</h1>
        <p className="text-muted-foreground">
          Connect your wallet to view team information
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team</h1>
          <p className="text-muted-foreground">
            Meet our dedicated team of professionals
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            variant="outline"
            className="flex items-center"
          >
            <UserGroupIcon className="h-5 w-5 mr-2" />
            View Organization
          </Button>
          <Button
            className="flex items-center"
          >
            <UserPlusIcon className="h-5 w-5 mr-2" />
            Add Team Member
          </Button>
        </div>
      </div>

      {/* Team Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-card hover:bg-accent/50 transition-colors">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <UserGroupIcon className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-card-foreground">Total Members</h2>
            </div>
            <p className="text-3xl font-bold text-foreground">12</p>
            <p className="text-muted-foreground text-sm">Across 4 departments</p>
          </div>
        </Card>
        <Card className="bg-card hover:bg-accent/50 transition-colors">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BuildingOfficeIcon className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-card-foreground">Departments</h2>
            </div>
            <p className="text-3xl font-bold text-foreground">4</p>
            <p className="text-muted-foreground text-sm">Investment, Risk, Compliance, Tech</p>
          </div>
        </Card>
        <Card className="bg-card hover:bg-accent/50 transition-colors">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BriefcaseIcon className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-card-foreground">Avg. Experience</h2>
            </div>
            <p className="text-3xl font-bold text-foreground">10.2</p>
            <p className="text-muted-foreground text-sm">Years in industry</p>
          </div>
        </Card>
        <Card className="bg-card hover:bg-accent/50 transition-colors">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <ShieldCheckIcon className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-card-foreground">Certifications</h2>
            </div>
            <p className="text-3xl font-bold text-foreground">24</p>
            <p className="text-muted-foreground text-sm">Professional certifications</p>
          </div>
        </Card>
      </div>

      {/* Team Members */}
      <Card className="bg-card hover:bg-accent/50 transition-colors mb-8">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-6 text-card-foreground">Team Members</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TEAM_MEMBERS.map((member) => (
              <div 
                key={member.id}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-lg cursor-pointer transition-colors",
                  selectedMember === member.id ? "bg-primary/10" : "bg-accent/20 hover:bg-accent/30"
                )}
                onClick={() => setSelectedMember(member.id)}
              >
                <div className="w-16 h-16 rounded-full bg-accent/40 flex items-center justify-center">
                  <UserGroupIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-foreground">{member.name}</h3>
                      <p className="text-sm text-muted-foreground">{member.role}</p>
                    </div>
                    <span className="px-2 py-1 text-xs rounded-full bg-emerald-500/10 text-emerald-500">
                      {member.status}
                    </span>
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <EnvelopeIcon className="h-4 w-4" />
                      <span>{member.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <PhoneIcon className="h-4 w-4" />
                      <span>{member.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BuildingOfficeIcon className="h-4 w-4" />
                      <span>{member.department}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AcademicCapIcon className="h-4 w-4" />
                      <span>{member.experience} experience</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Member Details */}
      {selectedMember && (
        <Card className="bg-card hover:bg-accent/50 transition-colors">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-card-foreground">Member Details</h2>
              <Button
                variant="outline"
                className="flex items-center"
              >
                <EnvelopeIcon className="h-5 w-5 mr-2" />
                Contact Member
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 bg-accent/20 rounded-lg">
                  <h3 className="font-medium text-card-foreground mb-2">Contact Information</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <EnvelopeIcon className="h-4 w-4" />
                      <span>{TEAM_MEMBERS.find(m => m.id === selectedMember)?.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <PhoneIcon className="h-4 w-4" />
                      <span>{TEAM_MEMBERS.find(m => m.id === selectedMember)?.phone}</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-accent/20 rounded-lg">
                  <h3 className="font-medium text-card-foreground mb-2">Department</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BuildingOfficeIcon className="h-4 w-4" />
                    <span>{TEAM_MEMBERS.find(m => m.id === selectedMember)?.department}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-accent/20 rounded-lg">
                  <h3 className="font-medium text-card-foreground mb-2">Role & Experience</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BriefcaseIcon className="h-4 w-4" />
                      <span>{TEAM_MEMBERS.find(m => m.id === selectedMember)?.role}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <AcademicCapIcon className="h-4 w-4" />
                      <span>{TEAM_MEMBERS.find(m => m.id === selectedMember)?.experience} experience</span>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-accent/20 rounded-lg">
                  <h3 className="font-medium text-card-foreground mb-2">Status</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ShieldCheckIcon className="h-4 w-4" />
                    <span>{TEAM_MEMBERS.find(m => m.id === selectedMember)?.status}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </>
  );
} 