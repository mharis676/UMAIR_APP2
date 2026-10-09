import React from 'react';
import { LayoutDashboard, ArrowDownToLine, ArrowUpFromLine, Boxes, History } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function BottomNav() {
  const { currentTab, setCurrentTab, setPreselectedProductId } = useApp();

  const handleTabClick = (tab) => {
    // If switching tabs directly, clear any preselected product
    if (tab !== 'receive' && tab !== 'deliver') {
      setPreselectedProductId(null);
    }
    setCurrentTab(tab);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'receive', label: 'Receive', icon: ArrowDownToLine },
    { id: 'deliver', label: 'Deliver', icon: ArrowUpFromLine },
    { id: 'stock', label: 'Stock', icon: Boxes },
    { id: 'history', label: 'History', icon: History }
  ];

  return (
    <nav className="bottom-nav" aria-label="Bottom Navigation">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => handleTabClick(item.id)}
            aria-label={item.label}
          >
            <div className="nav-icon-wrapper">
              <Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} />
            </div>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
