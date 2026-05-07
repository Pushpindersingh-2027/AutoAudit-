import React, { useState, useEffect, JSX } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';

// Dashboard Components
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Evidence from './pages/Evidence';
import SettingsPage from './pages/SettingsPage';
import AccountPage from './pages/AccountPage';
import StyleGuide from './pages/StyleGuide';
import ConnectionsPage from './pages/Connections/ConnectionsPage';
import ScansPage from './pages/Scans/ScansPage';
import ScanDetailPage from './pages/Scans/ScanDetailPage';

// Authentication & Landing Components
import LandingPage from './pages/Landing/LandingPage';
import AboutUs from './pages/Landing/AboutUs';
import ContactPage from './pages/Contact/ContactPage';
import LoginPage from './pages/Auth/LoginPage';
import SignUpPage from './pages/Auth/SignUpPage';
import ContactAdminPage from './pages/Admin/ContactAdminPage';
import GoogleCallbackPage from './pages/Auth/GoogleCallbackPage';

// Auth Context
import { useAuth } from './context/AuthContext';
import { register as apiRegister } from './api/client';

// Styles
import './index.css';

type RouteWrapperProps = {
  children: React.ReactNode;
};

type DashboardChildProps = {
  sidebarWidth?: number;
  isDarkMode?: boolean;
  onThemeToggle?: () => void;
};

type DashboardLayoutProps = {
  children: React.ReactElement<DashboardChildProps>;
  sidebarWidth: number;
  isDarkMode: boolean;
  onThemeToggle: () => void;
  onSidebarWidthChange: (width: number) => void;
};

type SignUpData = {
  email: string;
  password: string;
};

const LoadingScreen = (): JSX.Element => (
  <div className="flex justify-center items-center h-screen bg-slate-900">
    <div className="text-center">
      <div className="animate-spin">
        <svg
          className="w-8 h-8 text-blue-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
      <p className="mt-4 text-slate-400">Loading...</p>
    </div>
  </div>
);

// Protected Route Component
const ProtectedRoute: React.FC<RouteWrapperProps> = ({ children }) => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return isAuthenticated ? <>{children}</> : null;
};

// Admin-only Route Component
const AdminRoute: React.FC<RouteWrapperProps> = ({ children }) => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if ((user as { role?: string } | null | undefined)?.role !== 'admin') {
      navigate('/dashboard');
    }
  }, [isAuthenticated, isLoading, navigate, user]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return isAuthenticated && (user as { role?: string } | null | undefined)?.role === 'admin'
    ? <>{children}</>
    : null;
};

// Dashboard Layout Component with sidebar
const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  sidebarWidth,
  isDarkMode,
  onThemeToggle,
  onSidebarWidthChange,
}) => {
  return (
    <>
      <Sidebar onWidthChange={onSidebarWidthChange} isDarkMode={isDarkMode} />
      {React.cloneElement(children, { sidebarWidth, isDarkMode, onThemeToggle })}
    </>
  );
};

function App(): JSX.Element {
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const showPublicEnhancements = ['/', '/about', '/contact'].includes(location.pathname);

  // Dashboard state
  const getInitialSidebarWidth = (): number => {
    if (typeof window === 'undefined') return 220;

    try {
      const stored = window.localStorage.getItem('sidebarExpanded');

      if (stored === null) return 220;

      return stored === 'true' ? 220 : 80;
    } catch {
      return 220;
    }
  };

  const [sidebarWidth, setSidebarWidth] = useState<number>(getInitialSidebarWidth);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Theme management
  useEffect(() => {
    const theme = localStorage.getItem('theme') ?? 'dark';
    const dark = theme === 'dark';

    setIsDarkMode(dark);

    const root = document.documentElement;

    if (dark) {
      root.classList.remove('light');
    } else {
      root.classList.add('light');
    }
  }, []);

  // Scroll restoration
  useEffect(() => {
    if (location.hash) return;

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname, location.hash]);

  // Authentication handlers
  const handleUserLogin = async (
    email: string,
    password: string,
    remember: boolean = true,
  ): Promise<void> => {
    await auth.login(email, password, remember);
    navigate('/dashboard');
  };

  const handleUserLogout = (): void => {
    auth.logout();
    navigate('/');
  };

  const handleSignUp = async (signUpData: SignUpData): Promise<void> => {
    const email = signUpData.email;
    const password = signUpData.password;

    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    await apiRegister(email, password);
    await auth.login(email, password, true);
    navigate('/dashboard');
  };

  const handleThemeToggle = (): void => {
    const newThemeIsDark = !isDarkMode;

    setIsDarkMode(newThemeIsDark);
    localStorage.setItem('theme', newThemeIsDark ? 'dark' : 'light');

    const root = document.documentElement;

    if (newThemeIsDark) {
      root.classList.remove('light');
    } else {
      root.classList.add('light');
    }
  };

  const handleSidebarWidthChange = (width: number): void => {
    setSidebarWidth(width);
  };

  return (
    <div className="App">
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={<LandingPage onSignInClick={() => navigate('/login')} />}
        />

        <Route
          path="/about"
          element={<AboutUs onSignInClick={() => navigate('/login')} />}
        />

        <Route
          path="/contact"
          element={<ContactPage onSignIn={() => navigate('/login')} />}
        />

        <Route
          path="/login"
          element={
            <LoginPage
              onLogin={handleUserLogin}
              onSignUpClick={() => navigate('/signup')}
            />
          }
        />

        <Route path="/auth/google/callback" element={<GoogleCallbackPage />} />

        <Route
          path="/signup"
          element={
            <SignUpPage
              onSignUp={handleSignUp}
              onBackToLogin={() => navigate('/login')}
            />
          }
        />

        <Route
          path="/admin/contact-submissions"
          element={
            <AdminRoute>
              <ContactAdminPage />
            </AdminRoute>
          }
        />

        {/* Protected Dashboard Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout
                sidebarWidth={sidebarWidth}
                isDarkMode={isDarkMode}
                onThemeToggle={handleThemeToggle}
                onSidebarWidthChange={handleSidebarWidthChange}
              >
                <Dashboard isDarkMode={isDarkMode} onThemeToggle={handleThemeToggle} />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/evidence-scanner"
          element={
            <ProtectedRoute>
              <DashboardLayout
                sidebarWidth={sidebarWidth}
                isDarkMode={isDarkMode}
                onThemeToggle={handleThemeToggle}
                onSidebarWidthChange={handleSidebarWidthChange}
              >
                <Evidence />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <DashboardLayout
                sidebarWidth={sidebarWidth}
                isDarkMode={isDarkMode}
                onThemeToggle={handleThemeToggle}
                onSidebarWidthChange={handleSidebarWidthChange}
              >
                <SettingsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <DashboardLayout
                sidebarWidth={sidebarWidth}
                isDarkMode={isDarkMode}
                onThemeToggle={handleThemeToggle}
                onSidebarWidthChange={handleSidebarWidthChange}
              >
                <AccountPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/cloud-platforms"
          element={
            <ProtectedRoute>
              <DashboardLayout
                sidebarWidth={sidebarWidth}
                isDarkMode={isDarkMode}
                onThemeToggle={handleThemeToggle}
                onSidebarWidthChange={handleSidebarWidthChange}
              >
                <ConnectionsPage isDarkMode={isDarkMode} />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/scans"
          element={
            <ProtectedRoute>
              <DashboardLayout
                sidebarWidth={sidebarWidth}
                isDarkMode={isDarkMode}
                onThemeToggle={handleThemeToggle}
                onSidebarWidthChange={handleSidebarWidthChange}
              >
                <ScansPage isDarkMode={isDarkMode} />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/scans/:scanId"
          element={
            <ProtectedRoute>
              <DashboardLayout
                sidebarWidth={sidebarWidth}
                isDarkMode={isDarkMode}
                onThemeToggle={handleThemeToggle}
                onSidebarWidthChange={handleSidebarWidthChange}
              >
                <ScanDetailPage isDarkMode={isDarkMode} />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route path="/styleguide" element={<StyleGuide />} />

        {/* Fallback Route */}
        <Route
          path="*"
          element={<LandingPage onSignInClick={() => navigate('/login')} />}
        />
      </Routes>

      {showPublicEnhancements && (
        <>
          <section className="autoaudit-readiness-section">
            <div className="autoaudit-readiness-content">
              <div className="autoaudit-readiness-text">
                <span className="autoaudit-section-label">Audit Readiness</span>
                <h2>Built to support faster compliance preparation</h2>
                <p>
                  AutoAudit brings evidence review, cloud visibility, and audit tracking
                  into one streamlined workflow, helping teams stay prepared before
                  compliance reviews begin.
                </p>
              </div>

              <div className="autoaudit-readiness-cards">
                <div className="autoaudit-readiness-card">
                  <h3>Evidence Visibility</h3>
                  <p>Organise and review audit evidence across connected systems.</p>
                </div>

                <div className="autoaudit-readiness-card">
                  <h3>Risk Awareness</h3>
                  <p>Highlight compliance gaps early so teams can respond before audit deadlines.</p>
                </div>

                <div className="autoaudit-readiness-card">
                  <h3>Workflow Clarity</h3>
                  <p>Keep compliance tasks clear, trackable, and easier to manage.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="autoaudit-value-section">
            <div className="autoaudit-value-container">
              <div className="autoaudit-value-header">
                <span className="autoaudit-section-label">Platform Value</span>
                <h2>Designed for clear, secure, and reliable audit workflows</h2>
                <p>
                  The public interface now communicates AutoAudit’s value more clearly by
                  highlighting usability, consistency, compliance focus, and responsive access
                  across different screen sizes.
                </p>
              </div>

              <div className="autoaudit-value-grid">
                <div className="autoaudit-value-card">
                  <span>01</span>
                  <h3>Clear Navigation</h3>
                  <p>Supports users in understanding audit-related features with less friction.</p>
                </div>

                <div className="autoaudit-value-card">
                  <span>02</span>
                  <h3>Consistent Interface</h3>
                  <p>Strengthens the visual structure of public-facing product sections.</p>
                </div>

                <div className="autoaudit-value-card">
                  <span>03</span>
                  <h3>Compliance Focus</h3>
                  <p>Highlights evidence, risk, and governance workflows in a professional way.</p>
                </div>

                <div className="autoaudit-value-card">
                  <span>04</span>
                  <h3>Responsive Layout</h3>
                  <p>Improves the presentation across desktop, tablet, and mobile screens.</p>
                </div>
              </div>
            </div>
          </section>

          <footer className="autoaudit-footer">
            <div className="autoaudit-footer-content">
              <div className="autoaudit-footer-brand">
                <h3>AutoAudit</h3>
                <p>
                  AutoAudit helps teams streamline audit preparation, manage compliance
                  evidence, and improve visibility across security and governance workflows.
                </p>
              </div>

              <div className="autoaudit-footer-column">
                <h4>Platform</h4>
                <p>Compliance Dashboard</p>
                <p>Evidence Scanner</p>
                <p>Cloud Integrations</p>
                <p>Audit Reports</p>
              </div>

              <div className="autoaudit-footer-column">
                <h4>Security</h4>
                <p>Secure Evidence Review</p>
                <p>Policy Alignment</p>
                <p>Access Control</p>
                <p>Risk Monitoring</p>
              </div>

              <div className="autoaudit-footer-column">
                <h4>Project</h4>
                <p>Open-source Platform</p>
                <p>Frontend Interface</p>
                <p>Responsive UI Design</p>
                <p>Built for Audit Readiness</p>
              </div>
            </div>

            <div className="autoaudit-footer-bottom">
              <p>
                © 2026 AutoAudit. Built to support secure, reliable, and automated
                compliance workflows.
              </p>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}

export default App;