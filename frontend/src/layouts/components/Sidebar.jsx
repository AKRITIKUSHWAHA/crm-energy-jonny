import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Shield } from 'lucide-react';
import { crmNavigation, oalNavigation } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import { getFilteredNavigation, getRoleConfig } from '../../utils/rbac';

export const Sidebar = ({
  isCollapsed = false,
  product = 'crm',
  onCloseMobile,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, crmUser, oalUser } = useAuth();
  const { addToast } = useToast();
  const { t } = useLanguage();

  const [permissionsVersion, setPermissionsVersion] = useState(0);

  useEffect(() => {
    const handlePermUpdate = () => setPermissionsVersion((v) => v + 1);
    window.addEventListener('crm-permissions-updated', handlePermUpdate);
    return () => window.removeEventListener('crm-permissions-updated', handlePermUpdate);
  }, []);

  const currentUser = product === 'crm' ? crmUser : oalUser;
  const roleConfig = getRoleConfig(currentUser, product);
  const rawNavItems = product === 'crm' ? crmNavigation : oalNavigation;

  // Filter items permitted for the active role
  const permittedNavItems = getFilteredNavigation(rawNavItems, product, currentUser);

  // Compute strictly one active nav item (exact match first, then longest matching prefix)
  const activeItemId = (() => {
    const exact = permittedNavItems.find((item) => item.path === location.pathname);
    if (exact) return exact.id;

    let bestMatch = null;
    let maxLen = 0;
    for (const item of permittedNavItems) {
      if (item.path !== '/' && item.path !== '/crm/dashboard' && item.path !== '/oal/borrower/dashboard') {
        if (location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)) {
          if (item.path.length > maxLen) {
            maxLen = item.path.length;
            bestMatch = item;
          }
        }
      }
    }
    return bestMatch ? bestMatch.id : null;
  })();

  // Group filtered items by section
  const groupedSections = permittedNavItems.reduce((acc, item) => {
    const sec = item.section || 'General';
    if (!acc[sec]) acc[sec] = [];
    acc[sec].push(item);
    return acc;
  }, {});

  const handleLogout = () => {
    logout(product);
    addToast({
      title: 'Logged Out',
      message: `Signed out of ${product === 'crm' ? 'CRM nErgy AI' : 'OAL Network'}.`,
      type: 'info',
    });
    if (onCloseMobile) onCloseMobile();
    navigate(product === 'crm' ? '/crm/login' : '/oal/login');
  };

  return (
    <aside
      style={{
        width: isCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
        backgroundColor: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        height: '100%',
        maxHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        flexShrink: 0,
        transition: 'width var(--transition-normal)',
        overflow: 'hidden',
        zIndex: 10,
        boxSizing: 'border-box',
      }}
    >
      {/* Navigation Scrollable Body */}
      <div className="flex flex-col gap-4 p-3" style={{ overflowY: 'auto', overflowX: 'hidden', flex: 1, boxSizing: 'border-box' }}>
        {Object.entries(groupedSections).map(([sectionTitle, items]) => (
          <div key={sectionTitle} className="flex flex-col gap-1">
            {!isCollapsed && (
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--text-tertiary)',
                  padding: '0.5rem 0.5rem 0.25rem 0.5rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {t(sectionTitle)}
              </div>
            )}

            {items.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === activeItemId;

              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  end
                  onClick={() => {
                    if (item.id === 'bestie') {
                      window.dispatchEvent(new CustomEvent('open-crm-ai-copilot'));
                    }
                    if (onCloseMobile) onCloseMobile();
                  }}
                  title={isCollapsed ? t(item.label) : undefined}
                  style={() => {
                    return {
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      padding: isCollapsed ? '0.65rem 0' : '0.65rem 0.85rem',
                      justifyContent: isCollapsed ? 'center' : 'flex-start',
                      borderRadius: '14px',
                      fontSize: '13px',
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? '#ffffff' : 'var(--text-secondary, #475569)',
                      background: isActive
                        ? 'linear-gradient(90deg, #4f46e5 0%, #0284c7 65%, #06b6d4 100%)'
                        : 'transparent',
                      boxShadow: isActive
                        ? '0 8px 20px -4px rgba(2, 132, 199, 0.45), 0 4px 12px -2px rgba(56, 189, 248, 0.25)'
                        : 'none',
                      textDecoration: 'none',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      marginBottom: '2px',
                      width: '100%',
                      boxSizing: 'border-box',
                    };
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = '#38bdf8';
                      e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.1)';
                      const iconEl = e.currentTarget.querySelector('svg');
                      if (iconEl) iconEl.style.color = '#38bdf8';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = 'var(--text-secondary, #475569)';
                      e.currentTarget.style.backgroundColor = 'transparent';
                      const iconEl = e.currentTarget.querySelector('svg');
                      if (iconEl) iconEl.style.color = '#64748b';
                    }
                  }}
                >
                  <Icon
                    size={18}
                    className="flex-shrink-0"
                    style={{
                      color: isActive ? '#ffffff' : '#64748b',
                      transition: 'color 200ms ease',
                    }}
                  />
                  {!isCollapsed && (
                    <span
                      style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: '1.2',
                      }}
                      title={t(item.label)}
                    >
                      {t(item.label)}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>

      {/* Sidebar Footer — SIGN OUT */}
      <div
        style={{
          padding: isCollapsed ? '0.75rem 0.35rem' : '0.75rem 0.85rem',
          borderTop: '1px solid var(--border)',
          backgroundColor: 'var(--surface-secondary, rgba(248, 250, 252, 0.6))',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem',
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-all"
          style={{
            backgroundColor: 'transparent',
            color: '#ef4444',
            borderRadius: '10px',
            border: '1px solid transparent',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            minHeight: '36px',
            textAlign: 'left',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
            e.currentTarget.style.color = '#dc2626';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.borderColor = 'transparent';
            e.currentTarget.style.color = '#ef4444';
          }}
          title={isCollapsed ? t(`Sign Out (${product.toUpperCase()})`) : undefined}
        >
          <LogOut size={16} className="flex-shrink-0" style={{ color: '#ef4444' }} />
          {!isCollapsed && <span style={{ fontSize: '12.5px', fontWeight: 600 }}>{t(`Sign Out (${product.toUpperCase()})`)}</span>}
        </button>
      </div>
    </aside>
  );
};
