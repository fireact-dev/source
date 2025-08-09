import { useState, useEffect, type ReactNode } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher'
import Avatar from '../components/common/Avatar'
import { Outlet } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import PrivateRoute from '../components/navigation/PrivateRoute';
import { useConfig } from '../contexts/ConfigContext';

// Define UserData type to match core package
interface UserData {
  display_name: string;
  create_time: any;
  email: string;
  avatar_url: string | null;
}

interface Props {
  desktopMenu: ReactNode;
  mobileMenu: ReactNode;
  logo: ReactNode;
  sidebarWidth?: string;
  collapsedSidebarWidth?: string;
  hideLanguageSwitcher?: boolean;
  additionalMenuItems?: ReactNode;
  navBackgroundColor?: string;
  navTextColor?: string;
}

export default function SubscriptionLayout({ 
  desktopMenu, 
  mobileMenu, 
  logo,
  sidebarWidth = 'w-64',
  collapsedSidebarWidth = 'w-20',
  hideLanguageSwitcher = false,
  additionalMenuItems,
  navBackgroundColor,
  navTextColor
}: Props) {
  const { signout, currentUser } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const { db, pages, name } = useConfig();

  useEffect(() => {
    async function fetchUserData() {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as UserData;
            setUserData(data);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
    }

    fetchUserData();
  }, [currentUser, db]);

  async function handleSignOut() {
    try {
      await signout();
      navigate(pages.home);
    } catch (error) {
      console.error('Failed to sign out');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className={`${navBackgroundColor || 'bg-gray-900'} shadow w-full`}>
        <div className="px-4">
          <div className="flex justify-between h-16 w-full">
            <div className="flex px-2 lg:px-0">
              <div className="flex items-center">
                <div className="flex items-center flex-shrink-0">
                  {logo}
                  <span className={`ml-2 text-xl font-bold ${navTextColor || 'text-white'}`}>{name}</span>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className={`ml-4 p-2 rounded-md ${navTextColor || 'text-gray-400'} hover:${navTextColor || 'text-gray-200'} focus:outline-none hidden lg:block`}
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={isSidebarOpen ? "M4 6h16M4 12h16M4 18h16" : "M4 6h16M4 12h16M4 18h16"}
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Mobile menu and language selector */}
            <div className="flex items-center space-x-2 lg:hidden">
              {!hideLanguageSwitcher && <LanguageSwitcher backgroundColor={navBackgroundColor} textColor={navTextColor} />}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`p-2 rounded-md ${navTextColor || 'text-gray-400'} hover:${navTextColor || 'text-gray-200'} focus:outline-none`}
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                  />
                </svg>
              </button>
            </div>

            {/* Desktop nav items */}
            <div className="hidden lg:flex lg:items-center lg:space-x-4 pr-4">
              {!hideLanguageSwitcher && <LanguageSwitcher backgroundColor={navBackgroundColor} textColor={navTextColor} />}
              {additionalMenuItems}
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-3 focus:outline-none"
                >
                  <Avatar userData={userData} />
                  <span className={`${navTextColor || 'text-gray-400'} text-sm`}>{userData?.display_name}</span>
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                    <div className="py-1" role="menu" aria-orientation="vertical">
                      <Link
                        to={pages.profile}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        {t('myProfile')}
                      </Link>
                      <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          handleSignOut();
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        role="menuitem"
                      >
                        {t('signout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} lg:hidden ${navBackgroundColor || 'bg-gray-900'} ${navTextColor || 'text-gray-200'}`}>
            {/* Divider */}
            <div className="border-t border-gray-700"></div>
            
            {/* Menu Items */}
            <div className="pt-2 pb-3">
              {mobileMenu}
              <Link
                to={pages.profile}
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  location.pathname === pages.profile
                    ? 'bg-indigo-100 text-indigo-600'
                    : 'hover:bg-gray-700 hover:text-white'
                }`}
              >
                {t('myProfile')}
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full text-left px-3 py-2 text-base font-medium hover:bg-gray-700 hover:text-white rounded-md"
              >
                {t('signout')}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex min-h-[calc(100vh-64px)]">
        {/* Sidebar - hidden on mobile, visible on desktop */}
        <div
          className={`${
            isSidebarOpen ? sidebarWidth : collapsedSidebarWidth
          } transition-all duration-300 ease-in-out transform hidden lg:block
          fixed lg:relative lg:translate-x-0 z-30 bg-white shadow min-vh100`}
        >
          {desktopMenu}
        </div>

        {/* Main Content */}
        <div className="flex-1 min-vh100 transition-all duration-300 ease-in-out">
          <main className="py-6 px-4 sm:px-6 lg:px-8">
            <PrivateRoute>
              <Outlet />
            </PrivateRoute>
          </main>
        </div>
      </div>
    </div>
  );
}
