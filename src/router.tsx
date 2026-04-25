import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { PageSpinner } from './components/ui/Spinner';
import { useAuthStore } from './store/useAuthStore';

// Lazy loading — production bundle splitting
const LandingApp       = lazy(() => import('./App'));
const ParentDashboard  = lazy(() => import('./pages/parent/ParentDashboard'));
const NannySearchPage  = lazy(() => import('./pages/parent/NannySearchPage'));
const BookingsPage     = lazy(() => import('./pages/parent/BookingsPage'));
const ProfilePage      = lazy(() => import('./pages/parent/ProfilePage'));
const MessagesPage     = lazy(() => import('./pages/parent/MessagesPage'));
const NotificationsPage= lazy(() => import('./pages/parent/NotificationsPage'));

const NannyDashboard   = lazy(() => import('./pages/nanny/NannyDashboard'));
const NannyProfilePage = lazy(() => import('./pages/nanny/NannyProfilePage'));
const NannyBookings    = lazy(() => import('./pages/nanny/NannyBookingsPage'));
const EarningsPage     = lazy(() => import('./pages/nanny/EarningsPage'));
const SchedulePage     = lazy(() => import('./pages/nanny/SchedulePage'));
const NannyReviews     = lazy(() => import('./pages/nanny/ReviewsPage'));
const OnboardingPage   = lazy(() => import('./pages/nanny/OnboardingPage'));
const ProPage          = lazy(() => import('./pages/nanny/ProPage'));

const AdminDashboard      = lazy(() => import('./pages/admin/AdminDashboard'));
const UsersPage           = lazy(() => import('./pages/admin/UsersPage'));
const NanniesPage         = lazy(() => import('./pages/admin/NanniesPage'));
const AdminBookings       = lazy(() => import('./pages/admin/AdminBookingsPage'));
const PaymentsPage        = lazy(() => import('./pages/admin/PaymentsPage'));
const VerificationsPage   = lazy(() => import('./pages/admin/VerificationsPage'));
const AdminSupportPage    = lazy(() => import('./pages/admin/SupportPage'));

const ParentSupportPage   = lazy(() => import('./pages/parent/SupportPage'));
const ReferralPage        = lazy(() => import('./pages/parent/ReferralPage'));
const ReceivedReviewsPage = lazy(() => import('./pages/parent/ReceivedReviewsPage'));

function wrap(Component: React.LazyExoticComponent<React.ComponentType>) {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Component />
    </Suspense>
  );
}

// Role-based index page inside /dashboard
function DashboardIndex() {
  const role = useAuthStore(s => s.role);
  if (role === 'nanny') {
    return (
      <Suspense fallback={<PageSpinner />}>
        <NannyDashboard />
      </Suspense>
    );
  }
  return (
    <Suspense fallback={<PageSpinner />}>
      <ParentDashboard />
    </Suspense>
  );
}

export const router = createBrowserRouter([
  // ── Landing page ─────────────────────────────────────────────────────────
  {
    path: '/',
    element: (
      <Suspense fallback={<PageSpinner />}>
        <LandingApp />
      </Suspense>
    ),
  },

  // ── Nanny onboarding (DashboardLayout dan tashqarida) ────────────────────
  {
    path: '/onboarding',
    element: wrap(OnboardingPage),
  },

  // ── Parent / Nanny shared dashboard ──────────────────────────────────────
  {
    path: '/dashboard',
    element: <DashboardLayout requireRole={['parent', 'nanny']} />,
    children: [
      { index: true,           element: <DashboardIndex />        },
      { path: 'search',        element: wrap(NannySearchPage)     },
      { path: 'bookings',      element: wrap(BookingsPage)        },
      { path: 'profile',       element: <DashboardProfileRoute /> },
      { path: 'messages',      element: wrap(MessagesPage)        },
      { path: 'notifications', element: wrap(NotificationsPage)   },
      { path: 'schedule',      element: wrap(SchedulePage)        },
      { path: 'earnings',      element: wrap(EarningsPage)        },
      { path: 'reviews',       element: wrap(NannyReviews)        },
      { path: 'support',       element: wrap(ParentSupportPage)   },
      { path: 'referral',       element: wrap(ReferralPage)          },
      { path: 'my-reviews',     element: wrap(ReceivedReviewsPage)   },
      { path: 'pro',            element: wrap(ProPage)               },
    ],
  },

  // ── Admin ─────────────────────────────────────────────────────────────────
  {
    path: '/admin',
    element: <DashboardLayout requireRole="admin" />,
    children: [
      { index: true,           element: wrap(AdminDashboard) },
      { path: 'users',         element: wrap(UsersPage)      },
      { path: 'nannies',       element: wrap(NanniesPage)    },
      { path: 'bookings',      element: wrap(AdminBookings)  },
      { path: 'payments',      element: wrap(PaymentsPage)   },
      { path: 'verifications', element: wrap(VerificationsPage) },
      { path: 'support',       element: wrap(AdminSupportPage)  },
    ],
  },

  // ── Catch-all ─────────────────────────────────────────────────────────────
  { path: '*', element: <Navigate to="/" replace /> },
]);

// Profile route — renders role-specific profile page
function DashboardProfileRoute() {
  const role = useAuthStore(s => s.role);
  if (role === 'nanny') {
    return (
      <Suspense fallback={<PageSpinner />}>
        <NannyProfilePage />
      </Suspense>
    );
  }
  return (
    <Suspense fallback={<PageSpinner />}>
      <ProfilePage />
    </Suspense>
  );
}
