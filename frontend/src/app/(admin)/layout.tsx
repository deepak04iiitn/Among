/**
 * Admin layout — role-gated route group.
 *
 * Wraps all /admin/* routes in:
 *  1. AdminGuard — verifies Firebase auth AND checks role is 'moderator' or 'admin'.
 *     Redirects to landing on failure.
 *
 * This layout and its children are never indexed (robots.txt disallows /admin).
 * Never linked from any public page or sitemap.
 */
import AdminGuard from '../../components/admin/AdminGuard';

export const metadata = {
  // Prevent any accidental indexing
  robots: 'noindex, nofollow',
};

export default function AdminLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <AdminGuard>
      {children}
    </AdminGuard>
  );
}
