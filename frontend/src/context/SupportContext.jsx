import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import supportService from '../services/supportService';
import { useAuth } from './AuthContext';

const SupportContext = createContext();

export const defaultEnterpriseTickets = [
  {
    id: 'tck-001',
    ticketNumber: 'TCK-9841',
    title: 'High-Priority SLA: Grid Power Telemetry Ingestion Latency',
    description: 'Inverters in Western Corridor reporting intermittent telemetry packet dropouts over MQTT broker.',
    category: 'Technical',
    priority: 'High',
    status: 'In Progress',
    slaHours: 12,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date().toISOString(),
    contact: { name: 'Marcus Vance', email: 'marcus@biogenix.org', company: 'BioGenix Labs Inc.' },
    assignedUser: { name: 'Alexander Wright', email: 'alexander@nergy.io' }
  },
  {
    id: 'tck-002',
    ticketNumber: 'TCK-9835',
    title: 'Billing & Commercial Tariff Reconciliation Discrepancy',
    description: 'Mismatch in utility peak rate consumption metrics for Q1 commercial audit review.',
    category: 'Billing',
    priority: 'Critical',
    status: 'Open',
    slaHours: 6,
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    updatedAt: new Date().toISOString(),
    contact: { name: 'Sarah Jenkins', email: 's.jenkins@vanguard.com', company: 'Vanguard Capital' },
    assignedUser: { name: 'Finance Desk Admin', email: 'finance.admin@nergy.io' }
  },
  {
    id: 'tck-003',
    ticketNumber: 'TCK-9820',
    title: 'ZBox SEA Cryptographic Multi-Signer Sync Issue',
    description: 'Hardware key exchange timed out during dual-authorization session for tenant admin vault.',
    category: 'Security',
    priority: 'Medium',
    status: 'In Progress',
    slaHours: 24,
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    updatedAt: new Date().toISOString(),
    contact: { name: 'Dr. Aris Thorne', email: 'a.thorne@biogenix.org', company: 'BioGenix Labs Inc.' },
    assignedUser: { name: 'Super Admin', email: 'super.admin@nergy.io' }
  },
  {
    id: 'tck-004',
    ticketNumber: 'TCK-9812',
    title: 'Solar Field Inverter Telemetry Re-connection',
    description: 'Gateway unit rebooted successfully and telemetry feed restored with 100% data fidelity.',
    category: 'Field Ops',
    priority: 'Medium',
    status: 'Resolved',
    slaHours: 24,
    createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
    updatedAt: new Date().toISOString(),
    contact: { name: 'David Chen', email: 'd.chen@energycorridor.com', company: 'Energy Corridors LLC' },
    assignedUser: { name: 'Alexander Wright', email: 'alexander@nergy.io' }
  },
  {
    id: 'tck-005',
    ticketNumber: 'TCK-9798',
    title: 'API Webhook Callback Timeout on Commercial Metering',
    description: 'Configured retry backoff multiplier to prevent dropouts during high-frequency interval logging.',
    category: 'Integration',
    priority: 'Low',
    status: 'Resolved',
    slaHours: 48,
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    updatedAt: new Date().toISOString(),
    contact: { name: 'Elena Rostova', email: 'elena@biogenix.org', company: 'BioGenix Labs Inc.' },
    assignedUser: { name: 'Operations Admin', email: 'operations.admin@nergy.io' }
  }
];

export const SupportProvider = ({ children }) => {
  const [tickets, setTickets] = useState(() => {
    try {
      const cached = localStorage.getItem('crm_support_tickets');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return defaultEnterpriseTickets;
  });

  const [kbArticles, setKbArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isCrmAuthenticated } = useAuth();

  const fetchSupportData = useCallback(async () => {
    if (!isCrmAuthenticated) return;
    try {
      setIsLoading(true);
      const [tckRes, artRes] = await Promise.allSettled([
        supportService.getTickets(),
        supportService.getArticles(),
      ]);

      if (tckRes.status === 'fulfilled' && Array.isArray(tckRes.value) && tckRes.value.length > 0) {
        setTickets(tckRes.value);
        try { localStorage.setItem('crm_support_tickets', JSON.stringify(tckRes.value)); } catch (e) {}
      } else {
        // Fallback to enterprise default tickets if remote DB is empty
        setTickets((prev) => {
          const list = prev && prev.length > 0 ? prev : defaultEnterpriseTickets;
          try { localStorage.setItem('crm_support_tickets', JSON.stringify(list)); } catch (e) {}
          return list;
        });
      }

      if (artRes.status === 'fulfilled' && Array.isArray(artRes.value)) {
        setKbArticles(artRes.value);
      }
    } catch (error) {
      console.error('Failed to load support data:', error);
      setTickets((prev) => (prev && prev.length > 0 ? prev : defaultEnterpriseTickets));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isCrmAuthenticated) return;
    fetchSupportData();
  }, [fetchSupportData, isCrmAuthenticated]);

  const addTicket = async (item) => {
    try {
      const created = await supportService.createTicket(item);
      setTickets((prev) => {
        const updated = [created, ...prev];
        try { localStorage.setItem('crm_support_tickets', JSON.stringify(updated)); } catch (e) {}
        return updated;
      });
      return created;
    } catch (e) {
      // Local fallback in case of network issue
      const localTicket = {
        id: `tck-${Date.now()}`,
        ticketNumber: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
        title: item.title,
        description: item.description || '',
        category: item.category || 'Technical',
        priority: item.priority || 'Medium',
        status: 'Open',
        slaHours: item.slaHours || 24,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setTickets((prev) => {
        const updated = [localTicket, ...prev];
        try { localStorage.setItem('crm_support_tickets', JSON.stringify(updated)); } catch (e) {}
        return updated;
      });
      return localTicket;
    }
  };

  const updateTicketStatus = async (id, newStatus) => {
    try {
      await supportService.updateTicket(id, { status: newStatus });
    } catch (e) {}
    setTickets((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t));
      try { localStorage.setItem('crm_support_tickets', JSON.stringify(updated)); } catch (e) {}
      return updated;
    });
  };

  const addArticle = async (item) => {
    const created = await supportService.createArticle(item);
    setKbArticles((prev) => [created, ...prev]);
    return created;
  };

  return (
    <SupportContext.Provider
      value={{
        tickets,
        kbArticles,
        isLoading,
        fetchSupportData,
        addTicket,
        updateTicketStatus,
        addArticle,
      }}
    >
      {children}
    </SupportContext.Provider>
  );
};

export const useSupport = () => useContext(SupportContext);
