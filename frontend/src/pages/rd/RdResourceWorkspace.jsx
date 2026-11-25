import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Briefcase,
  Calendar,
  Clock,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Trash2,
  Edit3,
  Layers,
  DollarSign,
  Award,
  Wrench,
  ShieldAlert,
  Building,
  Cpu,
  BarChart2,
  RefreshCw,
  ChevronRight,
  TrendingUp,
  FileText,
  Activity,
  Check,
  Zap,
  Info
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardBody,
  Badge,
  Button,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  Input,
  KPICard
} from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { apiClient } from '../../services/apiClient';

export const RdResourceWorkspace = () => {
  const { crmUser } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('overview'); // overview | directory | skills | allocations | capacity | timesheets | financials | facilities | bookings
  const [loading, setLoading] = useState(false);

  // Data states
  const [overview, setOverview] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [skills, setSkills] = useState([]);
  const [skillMatrix, setSkillMatrix] = useState(null);
  const [allocations, setAllocations] = useState([]);
  const [capacityData, setCapacityData] = useState(null);
  const [timesheets, setTimesheets] = useState([]);
  const [currentTimesheet, setCurrentTimesheet] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [projects, setProjects] = useState([]);
  const [laborCosts, setLaborCosts] = useState(null);

  // Filters
  const [deptFilter, setDeptFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');

  // Modals & Forms
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({
    department: '',
    designation: '',
    standardWeeklyHours: 40,
    hourlyCostRate: 75,
    employmentStatus: 'ACTIVE',
  });

  const [showAllocModal, setShowAllocModal] = useState(false);
  const [allocForm, setAllocForm] = useState({
    projectId: '',
    userId: '',
    roleInProject: 'Researcher',
    allocationPercentage: 50,
    startDate: new Date().toISOString().substring(0, 10),
    endDate: new Date(Date.now() + 90 * 86400000).toISOString().substring(0, 10),
    notes: '',
  });

  const [showSkillModal, setShowSkillModal] = useState(false);
  const [skillForm, setSkillForm] = useState({
    skillCode: '',
    name: '',
    category: 'SCIENTIFIC_RESEARCH',
    description: '',
  });

  const [showAssignSkillModal, setShowAssignSkillModal] = useState(false);
  const [assignSkillForm, setAssignSkillForm] = useState({
    userId: '',
    skillId: '',
    expertiseLevel: 'INTERMEDIATE',
    yearsOfExperience: 2.0,
    certifications: '',
    notes: '',
  });

  const [showTimeEntryModal, setShowTimeEntryModal] = useState(false);
  const [timeEntryForm, setTimeEntryForm] = useState({
    projectId: '',
    workDate: new Date().toISOString().substring(0, 10),
    hours: 8,
    description: '',
    workCategory: 'RESEARCH',
    isBillable: true,
  });

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState('APPROVE'); // APPROVE | REJECT
  const [reviewNotes, setReviewNotes] = useState('');
  const [selectedTimesheetId, setSelectedTimesheetId] = useState(null);

  const [showFacilityModal, setShowFacilityModal] = useState(false);
  const [facilityForm, setFacilityForm] = useState({
    facilityCode: '',
    name: '',
    facilityType: 'CHEMISTRY_LAB',
    description: '',
    location: 'Main Campus',
    building: 'Building A',
    floor: '1st Floor',
    capacity: 10,
    operatingHoursStart: '08:00',
    operatingHoursEnd: '20:00',
  });

  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [equipmentForm, setEquipmentForm] = useState({
    facilityId: '',
    equipmentCode: '',
    name: '',
    category: 'SPECTROSCOPY',
    description: '',
    manufacturer: '',
    modelNumber: '',
    serialNumber: '',
    hourlyUsageRate: 35.0,
  });

  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintForm, setMaintForm] = useState({
    equipmentId: '',
    maintenanceType: 'PREVENTATIVE',
    title: '',
    startDate: new Date().toISOString().substring(0, 10),
    endDate: new Date(Date.now() + 2 * 86400000).toISOString().substring(0, 10),
    notes: '',
  });

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    resourceType: 'FACILITY', // FACILITY | EQUIPMENT
    facilityId: '',
    equipmentId: '',
    projectId: '',
    bookingDate: new Date().toISOString().substring(0, 10),
    startTime: '09:00',
    endTime: '12:00',
    purpose: '',
  });

  // Load Initial Data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ovRes, profRes, skRes, matRes, alRes, capRes, tmRes, facRes, eqpRes, bkRes, prjRes] =
        await Promise.all([
          apiClient.get('/api/rd/resources/overview'),
          apiClient.get('/api/rd/resources/profiles'),
          apiClient.get('/api/rd/resources/skills'),
          apiClient.get('/api/rd/resources/skills/matrix'),
          apiClient.get('/api/rd/resources/allocations'),
          apiClient.get('/api/rd/resources/capacity'),
          apiClient.get('/api/rd/resources/timesheets'),
          apiClient.get('/api/rd/resources/facilities'),
          apiClient.get('/api/rd/resources/equipment'),
          apiClient.get('/api/rd/resources/bookings'),
          apiClient.get('/api/rd/portfolio'),
        ]);

      if (ovRes?.data?.success) setOverview(ovRes.data.data);
      if (profRes?.data?.success) setProfiles(profRes.data.data);
      if (skRes?.data?.success) setSkills(skRes.data.data);
      if (matRes?.data?.success) setSkillMatrix(matRes.data.data);
      if (alRes?.data?.success) setAllocations(alRes.data.data);
      if (capRes?.data?.success) setCapacityData(capRes.data.data);
      if (tmRes?.data?.success) setTimesheets(tmRes.data.data);
      if (facRes?.data?.success) setFacilities(facRes.data.data);
      if (eqpRes?.data?.success) setEquipment(eqpRes.data.data);
      if (bkRes?.data?.success) setBookings(bkRes.data.data);
      if (prjRes?.data?.success) {
        setProjects(prjRes.data.data.projects || prjRes.data.data || []);
      }
    } catch (err) {
      console.error('[RdResourceWorkspace] Load error:', err);
      addToast({ type: 'error', message: 'Failed to load resource management data' });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load Project Labor Cost when project is selected
  useEffect(() => {
    if (selectedProjectId) {
      apiClient
        .get(`/api/rd/resources/projects/${selectedProjectId}/labor-costs`)
        .then((res) => {
          if (res?.data?.success) setLaborCosts(res.data.data);
        })
        .catch((err) => console.error('Labor cost fetch error:', err));
    }
  }, [selectedProjectId]);

  // Handle Profile Update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await apiClient.put(`/api/rd/resources/profiles/${selectedProfile.id}`, profileForm);
      addToast({ type: 'success', message: 'Resource profile updated successfully' });
      setShowProfileModal(false);
      loadData();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || err.message });
    }
  };

  // Handle Create Allocation
  const handleCreateAllocation = async (e) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/api/rd/resources/allocations', allocForm);
      if (res?.data?.data?.warning) {
        addToast({ type: 'warning', message: res.data.data.warning });
      } else {
        addToast({ type: 'success', message: 'Resource allocated successfully' });
      }
      setShowAllocModal(false);
      loadData();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || err.message });
    }
  };

  // Handle Delete Allocation
  const handleDeleteAllocation = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resource allocation?')) return;
    try {
      await apiClient.delete(`/api/rd/resources/allocations/${id}`);
      addToast({ type: 'success', message: 'Allocation removed successfully' });
      loadData();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || err.message });
    }
  };

  // Handle Create Skill
  const handleCreateSkill = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/api/rd/resources/skills', skillForm);
      addToast({ type: 'success', message: 'Skill registered successfully' });
      setShowSkillModal(false);
      loadData();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || err.message });
    }
  };

  // Handle Assign Skill to Employee
  const handleAssignSkill = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/api/rd/resources/employee-skills', assignSkillForm);
      addToast({ type: 'success', message: 'Skill assigned to employee successfully' });
      setShowAssignSkillModal(false);
      loadData();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || err.message });
    }
  };

  // Handle Verify Skill
  const handleVerifySkill = async (empSkillId) => {
    try {
      await apiClient.put(`/api/rd/resources/employee-skills/${empSkillId}/verify`);
      addToast({ type: 'success', message: 'Skill expertise verified and endorsed!' });
      loadData();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || err.message });
    }
  };

  // Handle Fetch/Open Timesheet
  const handleOpenWeeklyTimesheet = async (userId) => {
    try {
      const now = new Date();
      // find previous monday
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.setDate(diff)).toISOString().substring(0, 10);

      const res = await apiClient.get(
        `/api/rd/resources/timesheets/weekly?userId=${userId}&weekStartDate=${monday}`
      );
      if (res?.data?.success) {
        setCurrentTimesheet(res.data.data);
        setActiveTab('timesheets');
      }
    } catch (err) {
      addToast({ type: 'error', message: 'Failed to retrieve weekly timesheet' });
    }
  };

  // Handle Add Time Entry
  const handleAddTimeEntry = async (e) => {
    e.preventDefault();
    if (!currentTimesheet) return;
    try {
      await apiClient.post(`/api/rd/resources/timesheets/${currentTimesheet.id}/entries`, timeEntryForm);
      addToast({ type: 'success', message: 'Time entry logged successfully' });
      setShowTimeEntryModal(false);
      const res = await apiClient.get(`/api/rd/resources/timesheets/${currentTimesheet.id}`);
      if (res?.data?.success) setCurrentTimesheet(res.data.data);
      loadData();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || err.message });
    }
  };

  // Handle Delete Time Entry
  const handleDeleteTimeEntry = async (entryId) => {
    try {
      await apiClient.delete(`/api/rd/resources/time-entries/${entryId}`);
      addToast({ type: 'success', message: 'Time entry deleted' });
      if (currentTimesheet) {
        const res = await apiClient.get(`/api/rd/resources/timesheets/${currentTimesheet.id}`);
        if (res?.data?.success) setCurrentTimesheet(res.data.data);
      }
      loadData();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || err.message });
    }
  };

  // Handle Submit Timesheet
  const handleSubmitTimesheet = async (timesheetId) => {
    try {
      await apiClient.post(`/api/rd/resources/timesheets/${timesheetId}/submit`);
      addToast({ type: 'success', message: 'Timesheet submitted for manager approval' });
      loadData();
      if (currentTimesheet && currentTimesheet.id === timesheetId) {
        const res = await apiClient.get(`/api/rd/resources/timesheets/${timesheetId}`);
        if (res?.data?.success) setCurrentTimesheet(res.data.data);
      }
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || err.message });
    }
  };

  // Handle Review Timesheet (Approve / Reject)
  const handleReviewTimesheet = async (e) => {
    e.preventDefault();
    try {
      if (reviewAction === 'APPROVE') {
        await apiClient.post(`/api/rd/resources/timesheets/${selectedTimesheetId}/approve`, {
          notes: reviewNotes,
        });
        addToast({ type: 'success', message: 'Timesheet approved successfully' });
      } else {
        await apiClient.post(`/api/rd/resources/timesheets/${selectedTimesheetId}/reject`, {
          reason: reviewNotes,
        });
        addToast({ type: 'warning', message: 'Timesheet rejected and sent back for revision' });
      }
      setShowReviewModal(false);
      loadData();
      if (currentTimesheet && currentTimesheet.id === selectedTimesheetId) {
        const res = await apiClient.get(`/api/rd/resources/timesheets/${selectedTimesheetId}`);
        if (res?.data?.success) setCurrentTimesheet(res.data.data);
      }
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || err.message });
    }
  };

  // Handle Create Facility
  const handleCreateFacility = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/api/rd/resources/facilities', facilityForm);
      addToast({ type: 'success', message: 'Lab facility registered successfully' });
      setShowFacilityModal(false);
      loadData();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || err.message });
    }
  };

  // Handle Create Equipment
  const handleCreateEquipment = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/api/rd/resources/equipment', equipmentForm);
      addToast({ type: 'success', message: 'Lab equipment registered successfully' });
      setShowEquipmentModal(false);
      loadData();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || err.message });
    }
  };

  // Handle Schedule Maintenance
  const handleScheduleMaintenance = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/api/rd/resources/equipment/maintenance', maintForm);
      addToast({ type: 'success', message: 'Maintenance / calibration scheduled successfully' });
      setShowMaintenanceModal(false);
      loadData();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || err.message });
    }
  };

  // Handle Complete Maintenance
  const handleCompleteMaintenance = async (maintId) => {
    const certNum = window.prompt('Enter Calibration Certificate / Service Number:', 'CAL-CERT-' + Date.now().toString(36).toUpperCase());
    if (certNum === null) return;
    try {
      await apiClient.put(`/api/rd/resources/equipment/maintenance/${maintId}/complete`, {
        calibrationCertificateNumber: certNum,
        notes: 'Preventative calibration certified and verified.',
      });
      addToast({ type: 'success', message: 'Maintenance completed and equipment restored to AVAILABLE!' });
      loadData();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || err.message });
    }
  };

  // Handle Create Booking
  const handleCreateBooking = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/api/rd/resources/bookings', bookingForm);
      addToast({ type: 'success', message: 'Lab resource booked successfully!' });
      setShowBookingModal(false);
      loadData();
    } catch (err) {
      // Handles 409 conflict cleanly
      addToast({ type: 'error', message: err.response?.data?.message || err.message });
    }
  };

  // Handle Cancel Booking
  const handleCancelBooking = async (id) => {
    const reason = window.prompt('Enter reason for cancellation:', 'Schedule change');
    if (reason === null) return;
    try {
      await apiClient.post(`/api/rd/resources/bookings/${id}/cancel`, { reason });
      addToast({ type: 'info', message: 'Booking cancelled successfully' });
      loadData();
    } catch (err) {
      addToast({ type: 'error', message: err.response?.data?.message || err.message });
    }
  };

  return (
    <div className="flex flex-col gap-6" style={{ width: '100%' }}>
      {/* 1. Header Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              R&D Resource, Capacity, Time & Lab Facilities
            </h2>
            <Badge variant="primary">Master Prompt 10</Badge>
          </div>
          <p className="text-xs text-secondary" style={{ margin: '4px 0 0 0' }}>
            Workforce Allocation, 2D Skill Matrix, Team Capacity, Weekly Timesheets & Lab Equipment Scheduling
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadData} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => {
              if (activeTab === 'allocations') setShowAllocModal(true);
              else if (activeTab === 'skills') setShowAssignSkillModal(true);
              else if (activeTab === 'facilities') setShowFacilityModal(true);
              else if (activeTab === 'bookings') setShowBookingModal(true);
              else if (activeTab === 'timesheets') setShowTimeEntryModal(true);
              else setShowAllocModal(true);
            }}
          >
            {activeTab === 'allocations' && 'New Allocation'}
            {activeTab === 'skills' && 'Assign Skill'}
            {activeTab === 'facilities' && 'New Facility'}
            {activeTab === 'bookings' && 'Book Lab Resource'}
            {activeTab === 'timesheets' && 'Log Time'}
            {['overview', 'directory', 'capacity', 'financials'].includes(activeTab) && 'Allocate Resource'}
          </Button>
        </div>
      </div>

      {/* 2. Top-Level Workspace Sub-Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          flexWrap: 'wrap',
          backgroundColor: 'var(--surface-raised)',
          padding: '6px',
          borderRadius: '10px',
          border: '1px solid var(--border)',
        }}
      >
        {[
          { id: 'overview', label: 'Overview & KPIs', icon: BarChart2 },
          { id: 'directory', label: `Resource Directory (${profiles.length})`, icon: Users },
          { id: 'skills', label: `2D Skill Matrix (${skills.length})`, icon: Award },
          { id: 'allocations', label: `Allocations (${allocations.length})`, icon: Briefcase },
          { id: 'capacity', label: 'Capacity Planning', icon: Activity },
          { id: 'timesheets', label: `Timesheets (${timesheets.length})`, icon: Clock },
          { id: 'financials', label: 'Labor Cost & MP09 Budget', icon: DollarSign },
          { id: 'facilities', label: `Lab Facilities & Equipment (${facilities.length}/${equipment.length})`, icon: Building },
          { id: 'bookings', label: `Scheduling & Bookings (${bookings.length})`, icon: Calendar },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#fff' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease-in-out',
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ==============================================================================
          TAB 1: OVERVIEW & KPIS
          ============================================================================== */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard
              title="Active R&D Workforce"
              value={overview?.totalResources || profiles.length}
              icon={Users}
              trend={{
                value: `${overview?.totalStandardWeeklyHours || 0} hrs/wk capacity`,
                isPositive: true,
              }}
            />
            <KPICard
              title="Workforce Allocation"
              value={`${overview?.utilizationRate || 0}%`}
              icon={Activity}
              trend={{
                value: `${overview?.totalAllocatedWeeklyHours || 0}h allocated`,
                isPositive: (overview?.utilizationRate || 0) <= 100,
              }}
            />
            <KPICard
              title="Over-Allocated Alerts"
              value={overview?.overAllocatedUsersCount || 0}
              icon={AlertTriangle}
              trend={{
                value:
                  (overview?.overAllocatedUsersCount || 0) > 0
                    ? 'Exceeds 100% capacity'
                    : 'Optimal workload balance',
                isPositive: (overview?.overAllocatedUsersCount || 0) === 0,
              }}
            />
            <KPICard
              title="Shared Labs & Equipment"
              value={`${overview?.totalFacilities || 0} Labs / ${overview?.totalEquipment || 0} Tools`}
              icon={Building}
              trend={{
                value: `${overview?.operationalEquipmentCount || 0} operational`,
                isPositive: true,
              }}
            />
          </div>

          {/* Quick Actions & Recent Bookings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader
                title="Operational Resource Status"
                subtitle="Live workforce capacity and equipment health summary"
              />
              <CardBody className="pt-0 flex flex-col gap-4 text-xs">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="text-secondary">Standard Full-Time Baseline:</span>
                  <span className="font-bold text-primary">40.00 Hours / Week / Employee</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="text-secondary">Registered Enterprise Skills:</span>
                  <span className="font-bold text-primary">{overview?.skillsCount || skills.length} Verified Competencies</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="text-secondary">Timesheets Pending Review:</span>
                  <Badge variant={(overview?.pendingTimesheets || 0) > 0 ? 'warning' : 'success'}>
                    {overview?.pendingTimesheets || 0} Submissions Pending
                  </Badge>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="text-secondary">Equipment Under Maintenance:</span>
                  <Badge variant={(overview?.maintenanceEquipmentCount || 0) > 0 ? 'danger' : 'neutral'}>
                    {overview?.maintenanceEquipmentCount || 0} Units Servicing
                  </Badge>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title="Upcoming Lab Bookings"
                subtitle="Confirmed schedule reservations"
                action={
                  <Button variant="ghost" size="xs" onClick={() => setActiveTab('bookings')}>
                    View All
                  </Button>
                }
              />
              <CardBody className="pt-0">
                {overview?.upcomingBookings && overview.upcomingBookings.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {overview.upcomingBookings.map((b) => (
                      <div
                        key={b.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          backgroundColor: 'var(--surface-raised)',
                          border: '1px solid var(--border)',
                          fontSize: '11px',
                        }}
                      >
                        <div>
                          <span className="font-bold text-primary">
                            {b.facility?.name || b.equipment?.name}
                          </span>
                          <span className="text-muted" style={{ marginLeft: 6 }}>
                            ({b.project?.name})
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Clock size={12} className="text-muted" />
                          <span>{new Date(b.startDateTime).toLocaleDateString()}</span>
                          <Badge variant="success">CONFIRMED</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted">No upcoming reservations found.</p>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* ==============================================================================
          TAB 2: RESOURCE DIRECTORY & PROFILES (Req 51)
          ============================================================================== */}
      {activeTab === 'directory' && (
        <Card>
          <CardHeader
            title="R&D Employee Resource Directory"
            subtitle="Personnel profiles, department assignments, standard hours and hourly cost rate cards"
            action={
              <div style={{ display: 'flex', gap: 8 }}>
                <Input
                  placeholder="Search resources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '220px', height: '32px' }}
                />
              </div>
            }
          />
          <CardBody className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell header>Code</TableCell>
                  <TableCell header>Employee Name</TableCell>
                  <TableCell header>Department</TableCell>
                  <TableCell header>Designation</TableCell>
                  <TableCell header>Weekly Base</TableCell>
                  <TableCell header>Hourly Rate</TableCell>
                  <TableCell header>Allocated %</TableCell>
                  <TableCell header>Remaining</TableCell>
                  <TableCell header>Status</TableCell>
                  <TableCell header>Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles
                  .filter((p) => {
                    if (!searchQuery) return true;
                    const q = searchQuery.toLowerCase();
                    return (
                      p.user.name.toLowerCase().includes(q) ||
                      p.employeeCode.toLowerCase().includes(q) ||
                      p.department.toLowerCase().includes(q) ||
                      p.designation.toLowerCase().includes(q)
                    );
                  })
                  .map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <span className="font-mono text-xs font-bold text-primary">{p.employeeCode}</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-bold text-xs">{p.user.name}</div>
                          <div className="text-muted text-xs">{p.user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="neutral">{p.department}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs">{p.designation}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs">{p.standardWeeklyHours}h / wk</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs font-bold">${p.hourlyCostRate}/hr</span>
                      </TableCell>
                      <TableCell>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span
                            className="font-bold text-xs"
                            style={{ color: p.isOverAllocated ? 'var(--danger)' : 'inherit' }}
                          >
                            {p.currentAllocationPercentage}%
                          </span>
                          {p.isOverAllocated && (
                            <Badge variant="danger" style={{ fontSize: '10px', padding: '2px 4px' }}>
                              OVER
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-mono">{p.remainingWeeklyHours}h</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.employmentStatus === 'ACTIVE' ? 'success' : 'neutral'}>
                          {p.employmentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <Button
                            variant="ghost"
                            size="xs"
                            icon={Edit3}
                            onClick={() => {
                              setSelectedProfile(p);
                              setProfileForm({
                                department: p.department,
                                designation: p.designation,
                                standardWeeklyHours: p.standardWeeklyHours,
                                hourlyCostRate: p.hourlyCostRate,
                                employmentStatus: p.employmentStatus,
                              });
                              setShowProfileModal(true);
                            }}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="xs"
                            icon={Clock}
                            onClick={() => handleOpenWeeklyTimesheet(p.userId)}
                          >
                            Timesheet
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}

      {/* ==============================================================================
          TAB 3: 2D SKILL MATRIX & EXPERTISE MAPPING (Req 52)
          ============================================================================== */}
      {activeTab === 'skills' && (
        <div className="flex flex-col gap-6">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                Enterprise 2D Skill & Competency Matrix
              </h3>
              <p className="text-xs text-secondary" style={{ margin: '2px 0 0 0' }}>
                Mapping employee competencies against required R&D domains: Beginner, Intermediate, Advanced & Expert
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="outline" size="sm" icon={Plus} onClick={() => setShowSkillModal(true)}>
                Add Master Skill
              </Button>
              <Button variant="primary" size="sm" icon={Award} onClick={() => setShowAssignSkillModal(true)}>
                Assign Skill
              </Button>
            </div>
          </div>

          {/* Skill Coverage Summary Bar */}
          {skillMatrix?.skillCoverage && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 12,
              }}
            >
              {skillMatrix.skillCoverage.map((sc) => (
                <div
                  key={sc.skillId}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--surface-raised)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div className="font-bold text-xs text-primary" style={{ marginBottom: 4 }}>
                    {sc.name}
                  </div>
                  <div className="text-muted text-xs" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Coverage:</span>
                    <span className="font-bold">{sc.totalQualified} Scientists</span>
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                    <Badge variant="primary" style={{ fontSize: '9px', padding: '1px 4px' }}>
                      {sc.expertCount} Exp
                    </Badge>
                    <Badge variant="success" style={{ fontSize: '9px', padding: '1px 4px' }}>
                      {sc.advancedCount} Adv
                    </Badge>
                    <Badge variant="neutral" style={{ fontSize: '9px', padding: '1px 4px' }}>
                      {sc.intermediateCount} Int
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 2D Grid Matrix */}
          <Card>
            <CardBody className="p-0 overflow-x-auto">
              {skillMatrix?.employees && skillMatrix?.skills && (
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '11px',
                    textAlign: 'left',
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: 'var(--surface-raised)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '10px 14px', position: 'sticky', left: 0, backgroundColor: 'var(--surface-raised)', zIndex: 1 }}>
                        R&D Scientist / Engineer
                      </th>
                      {skillMatrix.skills.map((sk) => (
                        <th key={sk.id} style={{ padding: '10px 14px', minWidth: '150px' }}>
                          <div className="font-bold">{sk.name}</div>
                          <div className="text-muted font-normal text-xs">{sk.skillCode}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {skillMatrix.employees.map((emp) => (
                      <tr key={emp.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td
                          style={{
                            padding: '10px 14px',
                            position: 'sticky',
                            left: 0,
                            backgroundColor: 'var(--surface)',
                            fontWeight: 700,
                            zIndex: 1,
                          }}
                        >
                          <div>{emp.name}</div>
                          <div className="text-muted font-normal text-xs">{emp.designation}</div>
                        </td>
                        {skillMatrix.skills.map((sk) => {
                          const cell = skillMatrix.matrix[emp.userId]?.[sk.id];
                          if (!cell) {
                            return (
                              <td key={sk.id} style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>
                                —
                              </td>
                            );
                          }

                          let badgeVariant = 'neutral';
                          if (cell.expertiseLevel === 'EXPERT') badgeVariant = 'primary';
                          else if (cell.expertiseLevel === 'ADVANCED') badgeVariant = 'success';
                          else if (cell.expertiseLevel === 'INTERMEDIATE') badgeVariant = 'info';

                          return (
                            <td key={sk.id} style={{ padding: '10px 14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <Badge variant={badgeVariant} style={{ fontSize: '10px', padding: '2px 6px' }}>
                                  {cell.expertiseLevel}
                                  {cell.isVerified && <Check size={10} style={{ marginLeft: 3 }} />}
                                </Badge>
                                {!cell.isVerified && (
                                  <Button
                                    variant="ghost"
                                    size="xs"
                                    onClick={() => handleVerifySkill(cell.id)}
                                    title="Verify & Endorse Skill"
                                  >
                                    <Check size={12} />
                                  </Button>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* ==============================================================================
          TAB 4: RESOURCE ALLOCATIONS (Req 51, 53)
          ============================================================================== */}
      {activeTab === 'allocations' && (
        <Card>
          <CardHeader
            title="Project Team Allocations"
            subtitle="Personnel assignments across active R&D projects with percentage workload tracking"
            action={
              <Button variant="primary" size="sm" icon={Plus} onClick={() => setShowAllocModal(true)}>
                New Allocation
              </Button>
            }
          />
          <CardBody className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell header>Project</TableCell>
                  <TableCell header>Assigned Employee</TableCell>
                  <TableCell header>Role in Project</TableCell>
                  <TableCell header>Allocation %</TableCell>
                  <TableCell header>Expected Hours</TableCell>
                  <TableCell header>Duration</TableCell>
                  <TableCell header>Status</TableCell>
                  <TableCell header>Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allocations.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <span className="font-bold text-xs text-primary">{a.project?.name}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-xs">{a.user?.name}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="neutral">{a.roleInProject}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs font-bold">{a.allocationPercentage}%</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs">{a.expectedWeeklyHours} hrs/wk</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs">
                        {new Date(a.startDate).toLocaleDateString()} – {new Date(a.endDate).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={a.status === 'ACTIVE' ? 'success' : 'neutral'}>{a.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="xs"
                        icon={Trash2}
                        onClick={() => handleDeleteAllocation(a.id)}
                        className="text-danger"
                      >
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}

      {/* ==============================================================================
          TAB 5: TEAM CAPACITY PLANNING (Req 53)
          ============================================================================== */}
      {activeTab === 'capacity' && capacityData && (
        <div className="flex flex-col gap-6">
          {/* Department Capacity Rollups */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {capacityData.departmentRollups?.map((d) => (
              <Card key={d.department}>
                <CardHeader
                  title={d.department}
                  subtitle={`${d.totalHeadcount} Scientists / Engineers`}
                  action={<Badge variant="primary">{d.utilizationRate}% Utilized</Badge>}
                />
                <CardBody className="pt-0 flex flex-col gap-2 text-xs">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-secondary">Standard Capacity:</span>
                    <span className="font-bold">{d.totalStandardHours} hrs/wk</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-secondary">Allocated Workload:</span>
                    <span className="font-bold">{d.totalAllocatedHours} hrs/wk</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-secondary">Remaining Capacity:</span>
                    <span className="font-bold text-success">{d.totalRemainingHours} hrs/wk</span>
                  </div>
                  {d.overAllocatedCount > 0 && (
                    <div style={{ color: 'var(--danger)', fontWeight: 700, marginTop: 4 }}>
                      ⚠️ {d.overAllocatedCount} over-allocated personnel
                    </div>
                  )}
                </CardBody>
              </Card>
            ))}
          </div>

          {/* Individual Workload Distribution */}
          <Card>
            <CardHeader
              title="Individual Workforce Capacity & Workload Balance"
              subtitle="Workload distribution bars highlighting under-utilized, optimal, and over-allocated capacity"
            />
            <CardBody className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell header>Scientist</TableCell>
                    <TableCell header>Department</TableCell>
                    <TableCell header>Weekly Base</TableCell>
                    <TableCell header>Allocated Hours</TableCell>
                    <TableCell header>Remaining Capacity</TableCell>
                    <TableCell header>Workload Utilization</TableCell>
                    <TableCell header>Capacity Status</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {capacityData.resources?.map((r) => {
                    let barColor = 'var(--success)';
                    if (r.capacityStatus === 'OVER_ALLOCATED') barColor = 'var(--danger)';
                    else if (r.capacityStatus === 'UNDER_UTILIZED') barColor = 'var(--warning)';

                    return (
                      <TableRow key={r.id}>
                        <TableCell>
                          <span className="font-bold text-xs">{r.name}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="neutral">{r.department}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs">{r.standardWeeklyHours}h</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs font-bold">{r.allocatedWeeklyHours}h</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs text-success">{r.remainingWeeklyHours}h</span>
                        </TableCell>
                        <TableCell>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '180px' }}>
                            <div
                              style={{
                                flex: 1,
                                height: 8,
                                borderRadius: 4,
                                backgroundColor: 'var(--border)',
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  width: `${Math.min(100, r.utilizationRate)}%`,
                                  height: '100%',
                                  backgroundColor: barColor,
                                }}
                              />
                            </div>
                            <span className="font-mono text-xs font-bold" style={{ width: '40px' }}>
                              {r.utilizationRate}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              r.capacityStatus === 'OPTIMAL'
                                ? 'success'
                                : r.capacityStatus === 'OVER_ALLOCATED'
                                ? 'danger'
                                : 'warning'
                            }
                          >
                            {r.capacityStatus}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ==============================================================================
          TAB 6: TIMESHEETS & TIME TRACKING (Req 54)
          ============================================================================== */}
      {activeTab === 'timesheets' && (
        <div className="flex flex-col gap-6">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                Weekly Timesheets & Activity Logging
              </h3>
              <p className="text-xs text-secondary" style={{ margin: '2px 0 0 0' }}>
                Capture project hours, calculate labor cost rates, submit for approval and audit revision history
              </p>
            </div>
            {currentTimesheet && (
              <div style={{ display: 'flex', gap: 8 }}>
                {['DRAFT', 'REJECTED'].includes(currentTimesheet.status) && (
                  <>
                    <Button variant="outline" size="sm" icon={Plus} onClick={() => setShowTimeEntryModal(true)}>
                      Log Entry
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={CheckCircle2}
                      onClick={() => handleSubmitTimesheet(currentTimesheet.id)}
                    >
                      Submit Timesheet
                    </Button>
                  </>
                )}
                {currentTimesheet.status === 'SUBMITTED' && (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Check}
                      onClick={() => {
                        setSelectedTimesheetId(currentTimesheet.id);
                        setReviewAction('APPROVE');
                        setReviewNotes('');
                        setShowReviewModal(true);
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      icon={XCircle}
                      onClick={() => {
                        setSelectedTimesheetId(currentTimesheet.id);
                        setReviewAction('REJECT');
                        setReviewNotes('');
                        setShowReviewModal(true);
                      }}
                    >
                      Reject
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Current Timesheet Details if selected */}
          {currentTimesheet && (
            <Card>
              <CardHeader
                title={`Timesheet: ${currentTimesheet.timesheetCode}`}
                subtitle={`Week of ${new Date(currentTimesheet.weekStartDate).toLocaleDateString()} to ${new Date(
                  currentTimesheet.weekEndDate
                ).toLocaleDateString()} • Total: ${currentTimesheet.totalHours} Hours`}
                action={
                  <Badge
                    variant={
                      currentTimesheet.status === 'APPROVED'
                        ? 'success'
                        : currentTimesheet.status === 'SUBMITTED'
                        ? 'warning'
                        : currentTimesheet.status === 'REJECTED'
                        ? 'danger'
                        : 'neutral'
                    }
                  >
                    {currentTimesheet.status}
                  </Badge>
                }
              />
              <CardBody className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell header>Work Date</TableCell>
                      <TableCell header>Project</TableCell>
                      <TableCell header>Task / Description</TableCell>
                      <TableCell header>Category</TableCell>
                      <TableCell header>Hours</TableCell>
                      <TableCell header>Rate ($/hr)</TableCell>
                      <TableCell header>Labor Cost</TableCell>
                      <TableCell header>Actions</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentTimesheet.timeEntries && currentTimesheet.timeEntries.length > 0 ? (
                      currentTimesheet.timeEntries.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell>
                            <span className="text-xs">{new Date(e.workDate).toLocaleDateString()}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-bold text-xs text-primary">{e.project?.name}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs">{e.description}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="neutral">{e.workCategory}</Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-xs font-bold">{e.hours}h</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-xs">${e.hourlyCostRate}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-xs font-bold text-success">
                              ${e.calculatedCost}
                            </span>
                          </TableCell>
                          <TableCell>
                            {['DRAFT', 'REJECTED'].includes(currentTimesheet.status) && (
                              <Button
                                variant="ghost"
                                size="xs"
                                icon={Trash2}
                                onClick={() => handleDeleteTimeEntry(e.id)}
                                className="text-danger"
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8}>
                          <p className="text-xs text-muted text-center py-4">
                            No time entries recorded for this week yet. Click "Log Entry" to add your hours.
                          </p>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardBody>
            </Card>
          )}

          {/* All Submissions Directory */}
          <Card>
            <CardHeader
              title="All Timesheet Submissions"
              subtitle="Filter timesheets across workforce and audit approval states"
            />
            <CardBody className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell header>Code</TableCell>
                    <TableCell header>Employee</TableCell>
                    <TableCell header>Week Period</TableCell>
                    <TableCell header>Total Hours</TableCell>
                    <TableCell header>Status</TableCell>
                    <TableCell header>Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timesheets.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>
                        <span className="font-mono text-xs font-bold text-primary">{t.timesheetCode}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-xs">{t.user?.name}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs">
                          {new Date(t.weekStartDate).toLocaleDateString()} –{' '}
                          {new Date(t.weekEndDate).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs font-bold">{t.totalHours}h</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            t.status === 'APPROVED'
                              ? 'success'
                              : t.status === 'SUBMITTED'
                              ? 'warning'
                              : t.status === 'REJECTED'
                              ? 'danger'
                              : 'neutral'
                          }
                        >
                          {t.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => {
                              apiClient.get(`/api/rd/resources/timesheets/${t.id}`).then((res) => {
                                if (res?.data?.success) setCurrentTimesheet(res.data.data);
                              });
                            }}
                          >
                            Open
                          </Button>
                          {t.status === 'SUBMITTED' && (
                            <Button
                              variant="primary"
                              size="xs"
                              onClick={() => {
                                setSelectedTimesheetId(t.id);
                                setReviewAction('APPROVE');
                                setReviewNotes('');
                                setShowReviewModal(true);
                              }}
                            >
                              Review
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ==============================================================================
          TAB 7: LABOR COST & MP09 BUDGET INTEGRATION (Req 55, 56, 57)
          ============================================================================== */}
      {activeTab === 'financials' && (
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader
              title="Project Labor Cost & MP09 Personnel Budget Variance"
              subtitle="Compare planned allocation expenses against approved timesheet actual costs"
              action={
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="text-xs text-secondary">Select Project:</span>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--surface-raised)',
                      fontSize: '12px',
                    }}
                  >
                    <option value="">-- Choose Project --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              }
            />
            <CardBody className="pt-0">
              {laborCosts ? (
                <div className="flex flex-col gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <KPICard
                      title="Approved Actual Spend"
                      value={`$${laborCosts.actualCost.toLocaleString()}`}
                      icon={DollarSign}
                      trend={{ value: `${laborCosts.actualHours} hrs logged`, isPositive: true }}
                    />
                    <KPICard
                      title="Planned Personnel Cost"
                      value={`$${laborCosts.plannedCost.toLocaleString()}`}
                      icon={TrendingUp}
                      trend={{ value: `${laborCosts.plannedHours} hrs planned`, isNeutral: true }}
                    />
                    <KPICard
                      title="MP09 Personnel Budget"
                      value={`$${laborCosts.budgetedAmount.toLocaleString()}`}
                      icon={DollarSign}
                      trend={{ value: 'Category: PERSONNEL', isNeutral: true }}
                    />
                    <KPICard
                      title="Budget Variance"
                      value={`$${laborCosts.costVariance.toLocaleString()}`}
                      icon={AlertTriangle}
                      trend={{
                        value: laborCosts.costVariance >= 0 ? 'Within budget' : 'Over budget',
                        isPositive: laborCosts.costVariance >= 0,
                      }}
                    />
                  </div>

                  <div
                    style={{
                      padding: '1.25rem',
                      borderRadius: '10px',
                      backgroundColor: 'var(--surface-raised)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span className="text-xs font-bold">Personnel Budget Consumption</span>
                      <span className="text-xs font-mono font-bold">{laborCosts.burnRatePercentage}%</span>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: 'var(--border)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(100, laborCosts.burnRatePercentage)}%`,
                          height: '100%',
                          backgroundColor:
                            laborCosts.burnRatePercentage > 100
                              ? 'var(--danger)'
                              : laborCosts.burnRatePercentage > 85
                              ? 'var(--warning)'
                              : 'var(--primary)',
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted text-center py-6">
                  Please select a project from the dropdown above to inspect labor costs and MP09 budget allocations.
                </p>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* ==============================================================================
          TAB 8: LAB FACILITIES & EQUIPMENT REGISTRY (Req 59)
          ============================================================================== */}
      {activeTab === 'facilities' && (
        <div className="flex flex-col gap-6">
          {/* Facilities */}
          <Card>
            <CardHeader
              title="Shared R&D Laboratory Facilities"
              subtitle="Physical cleanrooms, testing bays, and wet chemistry labs"
              action={
                <Button variant="outline" size="sm" icon={Plus} onClick={() => setShowFacilityModal(true)}>
                  Add Facility
                </Button>
              }
            />
            <CardBody className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell header>Code</TableCell>
                    <TableCell header>Facility Name</TableCell>
                    <TableCell header>Type</TableCell>
                    <TableCell header>Location / Building</TableCell>
                    <TableCell header>Capacity</TableCell>
                    <TableCell header>Operating Hours</TableCell>
                    <TableCell header>Status</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {facilities.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell>
                        <span className="font-mono text-xs font-bold text-primary">{f.facilityCode}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-xs">{f.name}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="neutral">{f.facilityType}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs">
                          {f.building}, {f.location} ({f.floor})
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs">{f.capacity} Persons</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-mono">
                          {f.operatingHoursStart} – {f.operatingHoursEnd}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={f.availabilityStatus === 'AVAILABLE' ? 'success' : 'warning'}>
                          {f.availabilityStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardBody>
          </Card>

          {/* Equipment */}
          <Card>
            <CardHeader
              title="Scientific Equipment Registry & Maintenance"
              subtitle="Spectrometers, cyclers, gloveboxes, calibration schedules and hourly rates"
              action={
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button variant="outline" size="sm" icon={Wrench} onClick={() => setShowMaintenanceModal(true)}>
                    Schedule Service
                  </Button>
                  <Button variant="primary" size="sm" icon={Plus} onClick={() => setShowEquipmentModal(true)}>
                    Add Equipment
                  </Button>
                </div>
              }
            />
            <CardBody className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell header>Code</TableCell>
                    <TableCell header>Equipment Name</TableCell>
                    <TableCell header>Facility</TableCell>
                    <TableCell header>Model / Serial</TableCell>
                    <TableCell header>Rate ($/hr)</TableCell>
                    <TableCell header>Operational Status</TableCell>
                    <TableCell header>Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equipment.map((eq) => (
                    <TableRow key={eq.id}>
                      <TableCell>
                        <span className="font-mono text-xs font-bold text-primary">{eq.equipmentCode}</span>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-bold text-xs">{eq.name}</div>
                          <div className="text-muted text-xs">{eq.category}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs">{eq.facility?.name}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-mono">
                          {eq.modelNumber || '—'} / {eq.serialNumber || '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs font-bold">${eq.hourlyUsageRate}/hr</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            eq.operationalStatus === 'AVAILABLE'
                              ? 'success'
                              : eq.operationalStatus === 'IN_USE'
                              ? 'info'
                              : 'danger'
                          }
                        >
                          {eq.operationalStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {eq.maintenances && eq.maintenances.length > 0 && (
                          <Button
                            variant="outline"
                            size="xs"
                            icon={Check}
                            onClick={() => handleCompleteMaintenance(eq.maintenances[0].id)}
                          >
                            Verify Calib
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </div>
      )}

      {/* ==============================================================================
          TAB 9: SCHEDULING & BOOKINGS (Req 59, 60)
          ============================================================================== */}
      {activeTab === 'bookings' && (
        <Card>
          <CardHeader
            title="Lab Facility & Equipment Reservations"
            subtitle="Automated overlap conflict prevention and equipment maintenance gating"
            action={
              <Button variant="primary" size="sm" icon={Plus} onClick={() => setShowBookingModal(true)}>
                Book Resource
              </Button>
            }
          />
          <CardBody className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell header>Code</TableCell>
                  <TableCell header>Resource Booked</TableCell>
                  <TableCell header>Project</TableCell>
                  <TableCell header>Booked By</TableCell>
                  <TableCell header>Booking Date</TableCell>
                  <TableCell header>Time Window</TableCell>
                  <TableCell header>Status</TableCell>
                  <TableCell header>Actions</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      <span className="font-mono text-xs font-bold text-primary">{b.bookingCode}</span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-bold text-xs">{b.facility?.name || b.equipment?.name}</div>
                        <div className="text-muted text-xs">
                          {b.resourceType}: {b.facility?.facilityCode || b.equipment?.equipmentCode}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-bold text-xs">{b.project?.name}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs">{b.requestedBy?.name}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs">{new Date(b.bookingDate).toLocaleDateString()}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-mono font-bold">
                        {b.startTime} – {b.endTime}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={b.status === 'CONFIRMED' ? 'success' : 'neutral'}>{b.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {b.status === 'CONFIRMED' && (
                        <Button
                          variant="ghost"
                          size="xs"
                          icon={XCircle}
                          onClick={() => handleCancelBooking(b.id)}
                          className="text-danger"
                        >
                          Cancel
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}

      {/* ==============================================================================
          MODALS
          ============================================================================== */}

      {/* Modal: Edit Resource Profile */}
      {showProfileModal && (
        <div className="modal-backdrop" style={modalOverlayStyle}>
          <div style={modalCardStyle}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, marginBottom: '1rem' }}>
              Edit Resource Profile: {selectedProfile?.user?.name}
            </h3>
            <form onSubmit={handleUpdateProfile} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="font-bold">Department</label>
                <input
                  className="w-full mt-1 p-2 rounded border bg-surface"
                  value={profileForm.department}
                  onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="font-bold">Designation</label>
                <input
                  className="w-full mt-1 p-2 rounded border bg-surface"
                  value={profileForm.designation}
                  onChange={(e) => setProfileForm({ ...profileForm, designation: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold">Standard Weekly Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    className="w-full mt-1 p-2 rounded border bg-surface"
                    value={profileForm.standardWeeklyHours}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, standardWeeklyHours: Number(e.target.value) })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="font-bold">Hourly Cost Rate ($/hr)</label>
                  <input
                    type="number"
                    step="1"
                    className="w-full mt-1 p-2 rounded border bg-surface"
                    value={profileForm.hourlyCostRate}
                    onChange={(e) => setProfileForm({ ...profileForm, hourlyCostRate: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: '1rem' }}>
                <Button variant="outline" type="button" onClick={() => setShowProfileModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Allocation */}
      {showAllocModal && (
        <div className="modal-backdrop" style={modalOverlayStyle}>
          <div style={modalCardStyle}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, marginBottom: '1rem' }}>
              Assign Resource to Project
            </h3>
            <form onSubmit={handleCreateAllocation} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="font-bold">Project</label>
                <select
                  className="w-full mt-1 p-2 rounded border bg-surface"
                  value={allocForm.projectId}
                  onChange={(e) => setAllocForm({ ...allocForm, projectId: e.target.value })}
                  required
                >
                  <option value="">-- Select Project --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold">Scientist / Engineer</label>
                <select
                  className="w-full mt-1 p-2 rounded border bg-surface"
                  value={allocForm.userId}
                  onChange={(e) => setAllocForm({ ...allocForm, userId: e.target.value })}
                  required
                >
                  <option value="">-- Select Personnel --</option>
                  {profiles.map((p) => (
                    <option key={p.userId} value={p.userId}>
                      {p.user.name} ({p.department} - {p.currentAllocationPercentage}% alloc)
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold">Role in Project</label>
                  <input
                    className="w-full mt-1 p-2 rounded border bg-surface"
                    value={allocForm.roleInProject}
                    onChange={(e) => setAllocForm({ ...allocForm, roleInProject: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="font-bold">Allocation Percentage: {allocForm.allocationPercentage}%</label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    className="w-full mt-2"
                    value={allocForm.allocationPercentage}
                    onChange={(e) =>
                      setAllocForm({ ...allocForm, allocationPercentage: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold">Start Date</label>
                  <input
                    type="date"
                    className="w-full mt-1 p-2 rounded border bg-surface"
                    value={allocForm.startDate}
                    onChange={(e) => setAllocForm({ ...allocForm, startDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="font-bold">End Date</label>
                  <input
                    type="date"
                    className="w-full mt-1 p-2 rounded border bg-surface"
                    value={allocForm.endDate}
                    onChange={(e) => setAllocForm({ ...allocForm, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: '1rem' }}>
                <Button variant="outline" type="button" onClick={() => setShowAllocModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Confirm Allocation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Skill */}
      {showSkillModal && (
        <div className="modal-backdrop" style={modalOverlayStyle}>
          <div style={modalCardStyle}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, marginBottom: '1rem' }}>
              Register Master R&D Skill
            </h3>
            <form onSubmit={handleCreateSkill} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="font-bold">Skill Code</label>
                <input
                  className="w-full mt-1 p-2 rounded border bg-surface"
                  placeholder="e.g. SKL-NMR-01"
                  value={skillForm.skillCode}
                  onChange={(e) => setSkillForm({ ...skillForm, skillCode: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="font-bold">Skill Name</label>
                <input
                  className="w-full mt-1 p-2 rounded border bg-surface"
                  placeholder="e.g. Nuclear Magnetic Resonance Spectroscopy"
                  value={skillForm.name}
                  onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="font-bold">Category</label>
                <select
                  className="w-full mt-1 p-2 rounded border bg-surface"
                  value={skillForm.category}
                  onChange={(e) => setSkillForm({ ...skillForm, category: e.target.value })}
                >
                  <option value="SCIENTIFIC_RESEARCH">Scientific Research</option>
                  <option value="ENGINEERING">Engineering</option>
                  <option value="LAB_TECHNIQUE">Lab Technique</option>
                  <option value="DATA_SCIENCE">Data Science</option>
                  <option value="REGULATORY">Regulatory Compliance</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: '1rem' }}>
                <Button variant="outline" type="button" onClick={() => setShowSkillModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Register Skill
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Assign Skill to Employee */}
      {showAssignSkillModal && (
        <div className="modal-backdrop" style={modalOverlayStyle}>
          <div style={modalCardStyle}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, marginBottom: '1rem' }}>
              Assign Competency to Employee
            </h3>
            <form onSubmit={handleAssignSkill} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="font-bold">Scientist / Engineer</label>
                <select
                  className="w-full mt-1 p-2 rounded border bg-surface"
                  value={assignSkillForm.userId}
                  onChange={(e) => setAssignSkillForm({ ...assignSkillForm, userId: e.target.value })}
                  required
                >
                  <option value="">-- Choose Personnel --</option>
                  {profiles.map((p) => (
                    <option key={p.userId} value={p.userId}>
                      {p.user.name} ({p.department})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold">Skill</label>
                <select
                  className="w-full mt-1 p-2 rounded border bg-surface"
                  value={assignSkillForm.skillId}
                  onChange={(e) => setAssignSkillForm({ ...assignSkillForm, skillId: e.target.value })}
                  required
                >
                  <option value="">-- Choose Skill --</option>
                  {skills.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.skillCode})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold">Expertise Level</label>
                  <select
                    className="w-full mt-1 p-2 rounded border bg-surface"
                    value={assignSkillForm.expertiseLevel}
                    onChange={(e) =>
                      setAssignSkillForm({ ...assignSkillForm, expertiseLevel: e.target.value })
                    }
                  >
                    <option value="BEGINNER">BEGINNER</option>
                    <option value="INTERMEDIATE">INTERMEDIATE</option>
                    <option value="ADVANCED">ADVANCED</option>
                    <option value="EXPERT">EXPERT</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold">Years of Experience</label>
                  <input
                    type="number"
                    step="0.5"
                    className="w-full mt-1 p-2 rounded border bg-surface"
                    value={assignSkillForm.yearsOfExperience}
                    onChange={(e) =>
                      setAssignSkillForm({ ...assignSkillForm, yearsOfExperience: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: '1rem' }}>
                <Button variant="outline" type="button" onClick={() => setShowAssignSkillModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Save Competency
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Log Time Entry */}
      {showTimeEntryModal && (
        <div className="modal-backdrop" style={modalOverlayStyle}>
          <div style={modalCardStyle}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, marginBottom: '1rem' }}>
              Log Time Entry
            </h3>
            <form onSubmit={handleAddTimeEntry} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="font-bold">Project</label>
                <select
                  className="w-full mt-1 p-2 rounded border bg-surface"
                  value={timeEntryForm.projectId}
                  onChange={(e) => setTimeEntryForm({ ...timeEntryForm, projectId: e.target.value })}
                  required
                >
                  <option value="">-- Choose Project --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold">Work Date</label>
                  <input
                    type="date"
                    className="w-full mt-1 p-2 rounded border bg-surface"
                    value={timeEntryForm.workDate}
                    onChange={(e) => setTimeEntryForm({ ...timeEntryForm, workDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="font-bold">Hours Worked</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0.25"
                    max="24"
                    className="w-full mt-1 p-2 rounded border bg-surface"
                    value={timeEntryForm.hours}
                    onChange={(e) => setTimeEntryForm({ ...timeEntryForm, hours: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="font-bold">Description of Work</label>
                <textarea
                  rows={3}
                  className="w-full mt-1 p-2 rounded border bg-surface"
                  placeholder="Detail scientific activities conducted..."
                  value={timeEntryForm.description}
                  onChange={(e) => setTimeEntryForm({ ...timeEntryForm, description: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: '1rem' }}>
                <Button variant="outline" type="button" onClick={() => setShowTimeEntryModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Log Entry
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Review Timesheet */}
      {showReviewModal && (
        <div className="modal-backdrop" style={modalOverlayStyle}>
          <div style={modalCardStyle}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, marginBottom: '1rem' }}>
              {reviewAction === 'APPROVE' ? 'Approve Timesheet' : 'Reject Timesheet'}
            </h3>
            <form onSubmit={handleReviewTimesheet} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="font-bold">
                  {reviewAction === 'APPROVE' ? 'Approval Notes (Optional)' : 'Rejection Reason (Required)'}
                </label>
                <textarea
                  rows={3}
                  className="w-full mt-1 p-2 rounded border bg-surface"
                  placeholder={
                    reviewAction === 'APPROVE'
                      ? 'Approved per project milestones.'
                      : 'Please revise logged hours for Friday task.'
                  }
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  required={reviewAction === 'REJECT'}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: '1rem' }}>
                <Button variant="outline" type="button" onClick={() => setShowReviewModal(false)}>
                  Cancel
                </Button>
                <Button variant={reviewAction === 'APPROVE' ? 'primary' : 'danger'} type="submit">
                  Confirm {reviewAction === 'APPROVE' ? 'Approval' : 'Rejection'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Facility */}
      {showFacilityModal && (
        <div className="modal-backdrop" style={modalOverlayStyle}>
          <div style={modalCardStyle}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, marginBottom: '1rem' }}>
              Add Shared Lab Facility
            </h3>
            <form onSubmit={handleCreateFacility} className="flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold">Facility Code</label>
                  <input
                    className="w-full mt-1 p-2 rounded border bg-surface"
                    placeholder="FAC-CLEAN-02"
                    value={facilityForm.facilityCode}
                    onChange={(e) => setFacilityForm({ ...facilityForm, facilityCode: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="font-bold">Facility Name</label>
                  <input
                    className="w-full mt-1 p-2 rounded border bg-surface"
                    placeholder="Dry Room Beta"
                    value={facilityForm.name}
                    onChange={(e) => setFacilityForm({ ...facilityForm, name: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold">Location</label>
                  <input
                    className="w-full mt-1 p-2 rounded border bg-surface"
                    value={facilityForm.location}
                    onChange={(e) => setFacilityForm({ ...facilityForm, location: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="font-bold">Building</label>
                  <input
                    className="w-full mt-1 p-2 rounded border bg-surface"
                    value={facilityForm.building}
                    onChange={(e) => setFacilityForm({ ...facilityForm, building: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="font-bold">Capacity</label>
                  <input
                    type="number"
                    className="w-full mt-1 p-2 rounded border bg-surface"
                    value={facilityForm.capacity}
                    onChange={(e) => setFacilityForm({ ...facilityForm, capacity: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: '1rem' }}>
                <Button variant="outline" type="button" onClick={() => setShowFacilityModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Register Facility
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Equipment */}
      {showEquipmentModal && (
        <div className="modal-backdrop" style={modalOverlayStyle}>
          <div style={modalCardStyle}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, marginBottom: '1rem' }}>
              Add Scientific Equipment
            </h3>
            <form onSubmit={handleCreateEquipment} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="font-bold">Facility</label>
                <select
                  className="w-full mt-1 p-2 rounded border bg-surface"
                  value={equipmentForm.facilityId}
                  onChange={(e) => setEquipmentForm({ ...equipmentForm, facilityId: e.target.value })}
                  required
                >
                  <option value="">-- Choose Host Facility --</option>
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.facilityCode})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold">Equipment Code</label>
                  <input
                    className="w-full mt-1 p-2 rounded border bg-surface"
                    placeholder="EQP-SEM-02"
                    value={equipmentForm.equipmentCode}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, equipmentCode: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="font-bold">Equipment Name</label>
                  <input
                    className="w-full mt-1 p-2 rounded border bg-surface"
                    placeholder="Field Emission SEM"
                    value={equipmentForm.name}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, name: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold">Manufacturer</label>
                  <input
                    className="w-full mt-1 p-2 rounded border bg-surface"
                    placeholder="Hitachi"
                    value={equipmentForm.manufacturer}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, manufacturer: e.target.value })}
                  />
                </div>
                <div>
                  <label className="font-bold">Hourly Usage Rate ($/hr)</label>
                  <input
                    type="number"
                    className="w-full mt-1 p-2 rounded border bg-surface"
                    value={equipmentForm.hourlyUsageRate}
                    onChange={(e) =>
                      setEquipmentForm({ ...equipmentForm, hourlyUsageRate: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: '1rem' }}>
                <Button variant="outline" type="button" onClick={() => setShowEquipmentModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Register Equipment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Schedule Maintenance */}
      {showMaintenanceModal && (
        <div className="modal-backdrop" style={modalOverlayStyle}>
          <div style={modalCardStyle}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, marginBottom: '1rem' }}>
              Schedule Equipment Maintenance / Calibration
            </h3>
            <form onSubmit={handleScheduleMaintenance} className="flex flex-col gap-4 text-xs">
              <div>
                <label className="font-bold">Equipment</label>
                <select
                  className="w-full mt-1 p-2 rounded border bg-surface"
                  value={maintForm.equipmentId}
                  onChange={(e) => setMaintForm({ ...maintForm, equipmentId: e.target.value })}
                  required
                >
                  <option value="">-- Choose Equipment --</option>
                  {equipment.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name} ({eq.equipmentCode})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold">Maintenance Title</label>
                <input
                  className="w-full mt-1 p-2 rounded border bg-surface"
                  placeholder="e.g. Annual Optical Calibration & Detector Alignment"
                  value={maintForm.title}
                  onChange={(e) => setMaintForm({ ...maintForm, title: e.target.value })}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold">Start Date</label>
                  <input
                    type="date"
                    className="w-full mt-1 p-2 rounded border bg-surface"
                    value={maintForm.startDate}
                    onChange={(e) => setMaintForm({ ...maintForm, startDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="font-bold">End Date</label>
                  <input
                    type="date"
                    className="w-full mt-1 p-2 rounded border bg-surface"
                    value={maintForm.endDate}
                    onChange={(e) => setMaintForm({ ...maintForm, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: '1rem' }}>
                <Button variant="outline" type="button" onClick={() => setShowMaintenanceModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Schedule Service
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Booking */}
      {showBookingModal && (
        <div className="modal-backdrop" style={modalOverlayStyle}>
          <div style={modalCardStyle}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, marginBottom: '1rem' }}>
              Book Lab Facility or Equipment
            </h3>
            <form onSubmit={handleCreateBooking} className="flex flex-col gap-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold">Resource Type</label>
                  <select
                    className="w-full mt-1 p-2 rounded border bg-surface"
                    value={bookingForm.resourceType}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, resourceType: e.target.value })
                    }
                  >
                    <option value="FACILITY">Laboratory Facility</option>
                    <option value="EQUIPMENT">Specialized Equipment</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold">Project</label>
                  <select
                    className="w-full mt-1 p-2 rounded border bg-surface"
                    value={bookingForm.projectId}
                    onChange={(e) => setBookingForm({ ...bookingForm, projectId: e.target.value })}
                    required
                  >
                    <option value="">-- Choose Project --</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {bookingForm.resourceType === 'FACILITY' ? (
                <div>
                  <label className="font-bold">Select Facility</label>
                  <select
                    className="w-full mt-1 p-2 rounded border bg-surface"
                    value={bookingForm.facilityId}
                    onChange={(e) => setBookingForm({ ...bookingForm, facilityId: e.target.value })}
                    required
                  >
                    <option value="">-- Choose Facility --</option>
                    {facilities.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.facilityCode})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="font-bold">Select Equipment</label>
                  <select
                    className="w-full mt-1 p-2 rounded border bg-surface"
                    value={bookingForm.equipmentId}
                    onChange={(e) => setBookingForm({ ...bookingForm, equipmentId: e.target.value })}
                    required
                  >
                    <option value="">-- Choose Equipment --</option>
                    {equipment.map((eq) => (
                      <option key={eq.id} value={eq.id}>
                        {eq.name} ({eq.equipmentCode} - {eq.operationalStatus})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold">Booking Date</label>
                  <input
                    type="date"
                    className="w-full mt-1 p-2 rounded border bg-surface"
                    value={bookingForm.bookingDate}
                    onChange={(e) => setBookingForm({ ...bookingForm, bookingDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="font-bold">Start Time</label>
                  <input
                    type="time"
                    className="w-full mt-1 p-2 rounded border bg-surface"
                    value={bookingForm.startTime}
                    onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="font-bold">End Time</label>
                  <input
                    type="time"
                    className="w-full mt-1 p-2 rounded border bg-surface"
                    value={bookingForm.endTime}
                    onChange={(e) => setBookingForm({ ...bookingForm, endTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold">Purpose & Experimental Objectives</label>
                <textarea
                  rows={2}
                  className="w-full mt-1 p-2 rounded border bg-surface"
                  placeholder="Detail test protocol or experiment requirements..."
                  value={bookingForm.purpose}
                  onChange={(e) => setBookingForm({ ...bookingForm, purpose: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: '1rem' }}>
                <Button variant="outline" type="button" onClick={() => setShowBookingModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  Confirm Booking
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const modalOverlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.65)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 9999,
  padding: '1rem',
};

const modalCardStyle = {
  backgroundColor: 'var(--surface)',
  borderRadius: '12px',
  border: '1px solid var(--border)',
  width: '100%',
  maxWidth: '560px',
  maxHeight: '90vh',
  overflowY: 'auto',
  padding: '1.5rem',
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
};
