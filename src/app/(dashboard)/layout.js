'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, Users, UserPlus, Settings, 
  Database, Shield, LogOut, Menu, X, Clock, Upload,
  ChevronLeft, ChevronRight, ShieldAlert, Mail, FileText, Send, History, Zap, BarChart3
} from 'lucide-react';

export default function DashboardLayout({ children }) {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, exact: true },
    { name: 'Customer Data', href: '/users', icon: Users, exact: false },
    { name: 'Import Data', href: '/import', icon: Upload, exact: false },
  ];

  const mailNavigation = [
    { name: 'Email Analytics', href: '/email/analytics', icon: BarChart3, exact: false },
    { name: 'Compose Mail', href: '/email/compose', icon: Send, exact: false },
    { name: 'Email Templates', href: '/email/templates', icon: FileText, exact: false },
    { name: 'Email Logs', href: '/email/logs', icon: History, exact: false },
  ];

  const adminNavigation = [
    { name: 'Staff Management', href: '/admin/staff', icon: Shield, exact: false },
    { name: 'Deletion Approvals', href: '/admin/deletions', icon: UserPlus, exact: false },
    { name: 'Active Sessions', href: '/admin/sessions', icon: Clock, exact: false },
    { name: 'System Settings', href: '/admin/settings', icon: Settings, exact: false },
    { name: 'Audit Logs', href: '/admin/audit', icon: Database, exact: false },
    { name: 'Database Reset', href: '/admin/reset', icon: ShieldAlert, exact: false },
  ];

  const NavItem = ({ item }) => {
    const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
    return (
      <Link
        href={item.href}
        onClick={() => setIsMobileMenuOpen(false)}
        className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all ${
          isActive
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        } ${isCollapsed ? 'justify-center px-0' : ''}`}
        title={isCollapsed ? item.name : ''}
      >
        <item.icon
          className={`flex-shrink-0 h-5 w-5 transition-colors ${
            isActive ? 'text-indigo-700' : 'text-slate-400 group-hover:text-slate-600'
          } ${isCollapsed ? '' : '-ml-1 mr-3'}`}
        />
        {!isCollapsed && <span className="truncate">{item.name}</span>}
      </Link>
    );
  };

  return (
    <div className="h-screen bg-slate-50 flex overflow-hidden">
      {/* Mobile sidebar overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 transform transition-all duration-300 ease-in-out lg:static lg:flex-shrink-0
        ${isMobileMenuOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:translate-x-0'}
        ${isCollapsed ? 'lg:w-20' : 'lg:w-72'}
      `}>
        <div className="h-full flex flex-col">
          {/* Logo area */}
          <div className={`h-16 flex items-center border-b border-slate-100 ${isCollapsed ? 'justify-center px-2' : 'px-6'}`}>
            <div className={`w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center ${isCollapsed ? '' : 'mr-3'}`}>
              <span className="text-white font-bold text-lg">R</span>
            </div>
            {!isCollapsed && <span className="text-xl font-semibold text-slate-900 truncate">RESOL CRM</span>}
            <button 
              className="ml-auto lg:hidden text-slate-500 hover:text-slate-900"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <div className={`flex-1 overflow-y-auto py-6 space-y-8 ${isCollapsed ? 'px-2' : 'px-4'}`}>
            <div className="space-y-1">
              {navigation.map((item) => (
                <NavItem key={item.name} item={item} />
              ))}
            </div>

            <div>
              {!isCollapsed ? (
                <h3 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Mailing System
                </h3>
              ) : (
                <div className="flex justify-center mb-2">
                  <div className="w-4 h-px bg-slate-300"></div>
                </div>
              )}
              <div className="space-y-1">
                {mailNavigation.map((item) => (
                  <NavItem key={item.name} item={item} />
                ))}
              </div>
            </div>

            {isAdmin && (
              <div>
                {!isCollapsed ? (
                  <h3 className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Administration
                  </h3>
                ) : (
                  <div className="flex justify-center mb-2">
                    <div className="w-4 h-px bg-slate-300"></div>
                  </div>
                )}
                <div className="space-y-1">
                  {adminNavigation.map((item) => (
                    <NavItem key={item.name} item={item} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User profile / Logout / Collapse Toggle */}
          <div className={`p-4 border-t border-slate-100 ${isCollapsed ? 'flex flex-col items-center px-2' : ''}`}>
            {!isCollapsed && (
              <div className="flex items-center px-3 py-3 mb-2 bg-slate-50 rounded-xl">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-xs text-slate-500 truncate capitalize">
                    {user?.role || 'Staff'}
                  </p>
                </div>
              </div>
            )}
            
            <Link
              href="/profile"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`w-full flex items-center py-2 text-sm font-medium text-slate-700 rounded-xl hover:bg-slate-100 transition-colors ${isCollapsed ? 'justify-center px-0 mb-1' : 'px-3 mb-1'}`}
              title="My Details"
            >
              <Settings className={`flex-shrink-0 h-5 w-5 text-slate-500 ${isCollapsed ? '' : '-ml-1 mr-3'}`} />
              {!isCollapsed && <span>My Details</span>}
            </Link>

            <button
              onClick={logout}
              className={`w-full flex items-center py-2 text-sm font-medium text-rose-600 rounded-xl hover:bg-rose-50 transition-colors ${isCollapsed ? 'justify-center px-0 mb-4' : 'px-3 mb-4'}`}
              title="Sign out"
            >
              <LogOut className={`flex-shrink-0 h-5 w-5 text-rose-500 ${isCollapsed ? '' : '-ml-1 mr-3'}`} />
              {!isCollapsed && <span>Sign out</span>}
            </button>

            {/* Desktop Collapse Toggle */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex w-full items-center justify-center py-2 text-sm font-medium text-slate-500 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
              {!isCollapsed && <span className="ml-2">Collapse</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="flex-shrink-0 h-16 bg-white border-b border-slate-200 flex items-center px-4 lg:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -ml-2 text-slate-500 hover:text-slate-900 focus:outline-none"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span className="ml-3 text-lg font-semibold text-slate-900">RESOL CRM</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
