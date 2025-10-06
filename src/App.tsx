import React from 'react';
import { Sidebar } from './components/Sidebar';
import { HomePage } from './components/HomePage';
import { DeviceDetail } from './components/DeviceDetail';
import { KnowledgePage } from './components/KnowledgePages';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const [currentPage, setCurrentPage] = React.useState('home');
  const [pageType, setPageType] = React.useState<'home' | 'page' | 'device'>('home');

  const handlePageChange = (pageId: string, type: 'page' | 'device') => {
    setCurrentPage(pageId);
    setPageType(type);
  };

  const handleDeviceClick = (deviceId: string) => {
    setCurrentPage(deviceId);
    setPageType('device');
  };

  const handleBack = () => {
    setCurrentPage('home');
    setPageType('home');
  };

  const renderMainContent = () => {
    if (currentPage === 'home') {
      return <HomePage onDeviceClick={handleDeviceClick} />;
    }
    
    if (pageType === 'device') {
      return <DeviceDetail key={currentPage} deviceId={currentPage} onBack={handleBack} />;
    }
    
    if (pageType === 'page') {
      return <KnowledgePage pageId={currentPage} />;
    }
    
    return <HomePage onDeviceClick={handleDeviceClick} />;
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        currentPage={currentPage} 
        onPageChange={handlePageChange}
      />
      
      <main className="flex-1 overflow-y-auto">
        {renderMainContent()}
      </main>
      
      <Toaster />
    </div>
  );
}