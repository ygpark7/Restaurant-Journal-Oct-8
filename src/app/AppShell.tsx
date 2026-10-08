import { useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { Icon, type IconName } from '@/components/Icon';
import { useAuth } from '@/features/auth/AuthProvider';
import { cn } from '@/lib/cn';

const NAV: { to: string; label: string; icon: IconName; end?: boolean }[] = [
  { to: '/', label: 'Discover', icon: 'compass', end: true },
  { to: '/places', label: 'My places', icon: 'heart' },
  { to: '/log', label: 'Log', icon: 'plus' },
];

function SampleDataNote({ className, short }: { className?: string; short?: boolean }) {
  return (
    <p
      className={cn(
        'rounded-full bg-apricot-100 px-3 py-1 text-sm font-medium text-apricot-700',
        className,
      )}
    >
      {short ? 'Sample data' : 'Sample data: all places are fictional'}
    </p>
  );
}

export function AppShell() {
  const { pathname } = useLocation();
  const { status, user } = useAuth();
  const accountTo = status === 'signedIn' ? '/account' : '/login';
  const accountLabel = status === 'signedIn' ? 'Account' : 'Sign in';

  // A new page should start at the top.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-dvh md:flex">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-sage-600 focus:px-5 focus:py-3 focus:text-white"
      >
        Skip to content
      </a>

      {/* Desktop: left sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col gap-6 border-r border-cream-300 bg-cream-50 p-5 md:flex">
        <div className="flex items-center gap-2 text-xl font-bold text-sage-700">
          <span aria-hidden="true">🍽️</span> Table for Little Ones
        </div>
        <nav aria-label="Main" className="flex flex-col gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'flex min-h-11 items-center gap-3 rounded-full px-4 text-base font-semibold',
                  isActive
                    ? 'bg-sage-100 text-sage-700'
                    : 'text-ink-700 hover:bg-cream-200',
                )
              }
            >
              <Icon name={item.icon} />
              {item.label === 'Log' ? 'Log a visit' : item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-3">
          <NavLink
            to={accountTo}
            className={({ isActive }) =>
              cn(
                'flex min-h-11 items-center gap-3 rounded-full px-4 text-base font-semibold',
                isActive
                  ? 'bg-sage-100 text-sage-700'
                  : 'text-ink-700 hover:bg-cream-200',
              )
            }
          >
            <Icon name="user" />
            <span className="min-w-0">
              <span className="block">{accountLabel}</span>
              {user && (
                <span className="block truncate text-sm font-normal text-ink-500">
                  {user.email}
                </span>
              )}
            </span>
          </NavLink>
          <SampleDataNote />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile: slim top bar */}
        <header className="flex items-center justify-between gap-2 px-4 pb-1 pt-3 md:hidden">
          <div className="flex items-center gap-2 whitespace-nowrap text-lg font-bold text-sage-700">
            <span aria-hidden="true">🍽️</span> Table for Little Ones
          </div>
          <div className="flex items-center gap-1">
            <SampleDataNote short className="whitespace-nowrap px-2.5 py-0.5 text-xs" />
            <NavLink
              to={accountTo}
              aria-label={accountLabel}
              className={({ isActive }) =>
                cn(
                  'flex size-11 items-center justify-center rounded-full',
                  isActive ? 'bg-sage-100 text-sage-700' : 'text-ink-700',
                )
              }
            >
              <Icon name="user" />
            </NavLink>
          </div>
        </header>

        <main
          id="main"
          tabIndex={-1}
          className="mx-auto w-full max-w-5xl flex-1 px-4 pb-[calc(var(--spacing-tabbar)+2rem)] pt-4 outline-none md:px-8 md:pb-12 md:pt-8"
        >
          <Outlet />
        </main>
      </div>

      {/* Mobile: bottom tab bar */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-cream-300 bg-cream-50/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul className="mx-auto flex h-tabbar max-w-md items-stretch justify-around">
          {NAV.map((item) => (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex h-full min-h-11 flex-col items-center justify-center gap-0.5 text-sm font-semibold',
                    isActive ? 'text-sage-700' : 'text-ink-500',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        'flex h-8 w-14 items-center justify-center rounded-full',
                        isActive && 'bg-sage-100',
                      )}
                    >
                      <Icon name={item.icon} />
                    </span>
                    {item.label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
