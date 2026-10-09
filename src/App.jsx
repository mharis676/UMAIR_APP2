import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import Toast from './components/Toast';
import ProductModal from './components/ProductModal';
import BackupModal from './components/BackupModal';

import DashboardView from './views/DashboardView';
import ReceiveView from './views/ReceiveView';
import DeliverView from './views/DeliverView';
import CurrentStockView from './views/CurrentStockView';
import HistoryView from './views/HistoryView';

function MainApp() {
  const { currentTab } = useApp();

  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  return (
    <div className="app-wrapper">
      {/* Top Header Navbar */}
      <Navbar
        onOpenAddProduct={() => setIsAddProductOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
      />

      {/* Floating Notifications */}
      <Toast />

      {/* Active Tab Screen Content */}
      <main className="main-content">
        {currentTab === 'dashboard' && (
          <DashboardView onOpenAddProduct={() => setIsAddProductOpen(true)} />
        )}
        {currentTab === 'receive' && <ReceiveView />}
        {currentTab === 'deliver' && <DeliverView />}
        {currentTab === 'stock' && (
          <CurrentStockView onOpenAddProduct={() => setIsAddProductOpen(true)} />
        )}
        {currentTab === 'history' && <HistoryView />}
      </main>

      {/* Persistent Bottom Mobile Navigation Bar */}
      <BottomNav />

      {/* Global Modals */}
      <ProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
      />

      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
