"use client";

import React, { useState, useEffect } from 'react';
import '../globals.css';

// 1. Updated Interface matching your SQL fields
export interface Partner {
  PartnerProfileID: number;
  FirstName: string;
  MiddleName: string;
  LastName: string;
  Email: string;
  CountryCd: string;
  ContactNo: string;
  DateAccepted: string;
  IsVerified: number;
  Deleted: number;
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        // Replace with your actual backend endpoint that returns the SQL query results as JSON
        const response = await fetch('http://localhost:8082/api/partner-profile-view');
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        setPartners(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch partners');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPartners();
  }, []);

  // Helper to determine status based on IsVerified and Deleted flags
  const getPartnerStatus = (isVerified: number, isDeleted: number) => {
    if (isDeleted === 1) return { label: 'Inactive', bg: 'var(--red)20', text: 'var(--red)' };
    if (isVerified === 1) return { label: 'Verified', bg: 'var(--green)20', text: 'var(--green)' };
    return { label: 'Pending', bg: 'var(--amber)20', text: 'var(--amber)' };
  };

  // Helper to format the SQL date safely
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto p-4">
      
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Partners</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Manage and view your partner network.</p>
        </div>
        <button 
          className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
          style={{ background: 'var(--blue-primary)', color: '#fff' }}
        >
          + Add Partner
        </button>
      </div>

      {/* Table Container */}
      <div 
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            
            {/* Static Column Headers */}
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-elevated)' }}>
                <th className="p-4 text-xs font-semibold tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
                  Name
                </th>
                <th className="p-4 text-xs font-semibold tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
                  Contact Info
                </th>
                <th className="p-4 text-xs font-semibold tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
                  Date Joined
                </th>
                <th className="p-4 text-xs font-semibold tracking-wider uppercase" style={{ color: 'var(--text-muted)' }}>
                  Status
                </th>
                <th className="p-4 text-xs font-semibold tracking-wider uppercase text-right" style={{ color: 'var(--text-muted)' }}>
                  Actions
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="text-sm divide-y divide-[var(--border)]">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>
                    Loading partners...
                  </td>
                </tr>
              )}

              {error && (
                <tr>
                  <td colSpan={5} className="p-8 text-center" style={{ color: 'var(--red)' }}>
                    {error}
                  </td>
                </tr>
              )}

              {!isLoading && !error && partners.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>
                    No partners found.
                  </td>
                </tr>
              )}

              {!isLoading && !error && Array.isArray(partners) && partners.map((partner) => {
                console.log("test");
                const status = getPartnerStatus(partner.IsVerified, partner.Deleted);
                const fullName = `${partner.FirstName} ${partner.LastName}`;
                
                return (
                  <tr key={partner.PartnerProfileID} className="transition-colors hover:bg-black/5 dark:hover:bg-white/5">
                    
                    {/* Name Column */}
                    <td className="p-4 align-middle">
                      <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{fullName}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>ID: {partner.PartnerProfileID}</p>
                    </td>

                    {/* Contact Info Column */}
                    <td className="p-4 align-middle">
                      <p style={{ color: 'var(--text-primary)' }}>{partner.Email}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {partner.CountryCd} {partner.ContactNo}
                      </p>
                    </td>

                    {/* Date Joined Column */}
                    <td className="p-4 align-middle" style={{ color: 'var(--text-secondary)' }}>
                      {formatDate(partner.DateAccepted)}
                    </td>

                    {/* Status Column */}
                    <td className="p-4 align-middle">
                      <span 
                        className="px-2.5 py-1 rounded-md text-xs font-bold"
                        style={{ 
                          background: status.bg, 
                          color: status.text,
                          border: `1px solid ${status.text}40`
                        }}
                      >
                        {status.label}
                      </span>
                    </td>

                    {/* Actions Column */}
                    <td className="p-4 align-middle text-right">
                      <button 
                        className="text-sm font-medium transition-opacity hover:opacity-70" 
                        style={{ color: 'var(--blue-light)' }}
                      >
                        View
                      </button>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}