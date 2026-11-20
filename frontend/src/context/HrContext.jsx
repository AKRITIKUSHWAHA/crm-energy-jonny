import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import hrService from '../services/hrService';
import { useAuth } from './AuthContext';

const HrContext = createContext();

export const HrProvider = ({ children }) => {
  // Instant SWR Hydration: Initialize from localStorage cache if available
  const [employees, setEmployees] = useState(() => {
    try {
      const cached = localStorage.getItem('crm_hr_employees');
      if (cached) {
        const p = JSON.parse(cached);
        if (Array.isArray(p) && p.length > 0) return p;
      }
    } catch (_) {}
    return [];
  });

  const [candidates, setCandidates] = useState(() => {
    try {
      const cached = localStorage.getItem('crm_hr_candidates');
      if (cached) {
        const p = JSON.parse(cached);
        if (Array.isArray(p) && p.length > 0) return p;
      }
    } catch (_) {}
    return [];
  });

  const [isLoading, setIsLoading] = useState(false);
  const { isCrmAuthenticated } = useAuth();

  // Auto-persist to localStorage
  useEffect(() => {
    if (employees.length > 0) {
      try { localStorage.setItem('crm_hr_employees', JSON.stringify(employees)); } catch (_) {}
    }
  }, [employees]);

  useEffect(() => {
    if (candidates.length > 0) {
      try { localStorage.setItem('crm_hr_candidates', JSON.stringify(candidates)); } catch (_) {}
    }
  }, [candidates]);

  const fetchHrData = useCallback(async () => {
    const token = localStorage.getItem('crm_token');
    if (!token) return;

    try {
      setIsLoading(true);
      const [empRes, candRes] = await Promise.allSettled([
        hrService.getEmployees(),
        hrService.getCandidates(),
      ]);

      if (empRes.status === 'fulfilled' && Array.isArray(empRes.value)) {
        setEmployees(empRes.value);
        try { localStorage.setItem('crm_hr_employees', JSON.stringify(empRes.value)); } catch (_) {}
      }

      if (candRes.status === 'fulfilled' && Array.isArray(candRes.value)) {
        setCandidates(candRes.value);
        try { localStorage.setItem('crm_hr_candidates', JSON.stringify(candRes.value)); } catch (_) {}
      }
    } catch (error) {
      console.warn('Failed to load HR data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHrData();
  }, [fetchHrData, isCrmAuthenticated]);

  const addEmployee = async (item) => {
    const created = await hrService.createEmployee(item);
    setEmployees((prev) => [created, ...prev]);
    return created;
  };

  const updateEmployee = async (updatedItem) => {
    const updated = await hrService.updateEmployee(updatedItem.id, updatedItem);
    setEmployees((prev) =>
      prev.map((emp) => (emp.id === updated.id ? updated : emp))
    );
    return updated;
  };

  const deleteEmployee = async (id) => {
    await hrService.deleteEmployee(id);
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  };

  const addCandidate = async (item) => {
    const created = await hrService.createCandidate(item);
    setCandidates((prev) => [created, ...prev]);
    return created;
  };

  const updateCandidate = async (updatedItem) => {
    const updated = await hrService.updateCandidate(updatedItem.id, updatedItem);
    setCandidates((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
    return updated;
  };

  const deleteCandidate = async (id) => {
    await hrService.deleteCandidate(id);
    setCandidates((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <HrContext.Provider
      value={{
        employees,
        candidates,
        isLoading,
        fetchHrData,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        addCandidate,
        updateCandidate,
        deleteCandidate,
      }}
    >
      {children}
    </HrContext.Provider>
  );
};

export const useHr = () => useContext(HrContext);
