import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useSearchParams,
  useNavigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Sidebar } from "./components/Sidebar";
import { MobileSidebar } from "./components/layout/MobileSidebar";
import AppLayout from "./components/layout/AppLayout";
import { HomePage } from "./components/HomePage";
import { DeviceDetail } from "./components/DeviceDetail";
import { KnowledgePage } from "./components/KnowledgePages";
import { InventoryManagement } from "./components/InventoryManagement";
import { Dashboard } from "./pages/Dashboard";
import { Audit } from "./pages/Audit";
import { OutboundManagement } from "./pages/OutboundManagement";
import { Toaster } from "./components/ui/sonner";
import SupabaseGate from "./components/SupabaseGate";

// 创建 QueryClient 实例
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 数据5分钟内视为新鲜，不会自动重新请求
      cacheTime: 10 * 60 * 1000, // 缓存保留10分钟
      refetchInterval: false, // 禁用自动轮询，减少不必要的请求
    },
  },
});

// 主布局组件
function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout
      sidebar={
        <>
          {/* Desktop Sidebar */}
          <div className="hidden md:block">
            <Sidebar />
          </div>
          {/* Mobile Sidebar */}
          <div className="md:hidden">
            <MobileSidebar />
          </div>
        </>
      }
    >
      {children}
      <Toaster />
    </AppLayout>
  );
}

// 设备详情页面包装器
function DeviceDetailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const deviceId = searchParams.get("id");

  if (!deviceId) {
    return <Navigate to="/" replace />;
  }

  return <DeviceDetail deviceId={deviceId} onBack={() => navigate("/")} />;
}

// 知识页面包装器
function KnowledgePageWrapper() {
  const [searchParams] = useSearchParams();
  const pageId = searchParams.get("id");

  if (!pageId) {
    return <Navigate to="/" replace />;
  }

  return <KnowledgePage pageId={pageId} />;
}

// 主页面包装器
function HomePageWrapper() {
  const navigate = useNavigate();

  return <HomePage onDeviceClick={(id) => navigate(`/device?id=${id}`)} />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <SupabaseGate>
          <Layout>
            <Routes>
              {/* 主页面 */}
              <Route path="/" element={<HomePageWrapper />} />

              {/* 新增功能页面 */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/audit" element={<Audit />} />
              <Route path="/outbound" element={<OutboundManagement />} />

              {/* 现有功能页面（保持兼容） */}
              <Route path="/inventory" element={<InventoryManagement />} />
              <Route path="/device" element={<DeviceDetailPage />} />
              <Route path="/knowledge" element={<KnowledgePageWrapper />} />

              {/* 重定向未知路由 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </SupabaseGate>
      </Router>
    </QueryClientProvider>
  );
}
