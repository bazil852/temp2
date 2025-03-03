import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Users, GraduationCap, FileCode2, Bot, LogOut, Settings, Menu, X, UserCog, Webhook } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUser(user);
    });
  }, []);

  const isAdmin = currentUser?.email === 'markofilipovic2003@gmail.com';

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      <nav className={`fixed left-0 top-0 h-full bg-gray-800/50 backdrop-blur-sm border-r border-gray-700/50 p-4 transition-all duration-300 z-40
        ${isOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:translate-x-0'}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center mb-8 pt-4 px-4">
          <div className="flex items-center gap-3">
            <img
              src="https://i.ibb.co/pjH3NFK5/Booklet-App.png"
              alt="Community Logo"
              className="w-12 h-12 object-contain"
            />
            <span className="text-xl font-bold text-white">Community</span>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <NavLink
            to="/community"
            onClick={() => setIsOpen(false)}
            className={({ isActive }) =>
              `flex items-center px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors ${
                isActive ? 'bg-gray-800/70 text-[#c9fffc]' : ''
              }`
            }
          >
            <Users className="w-5 h-5 mr-3" />
            Community
          </NavLink>

          <NavLink
            to="/classroom"
            onClick={() => setIsOpen(false)}
            className={({ isActive }) =>
              `flex items-center px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors ${
                isActive ? 'bg-gray-800/70 text-[#c9fffc]' : ''
              }`
            }
          >
            <GraduationCap className="w-5 h-5 mr-3" />
            Classroom
          </NavLink>

          <NavLink
            to="/blueprints"
            onClick={() => setIsOpen(false)}
            className={({ isActive }) =>
              `flex items-center px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors ${
                isActive ? 'bg-gray-800/70 text-[#c9fffc]' : ''
              }`
            }
          >
            <FileCode2 className="w-5 h-5 mr-3" />
            Blueprints
          </NavLink>

          <NavLink
            to="/ai-tool"
            onClick={() => setIsOpen(false)}
            className={({ isActive }) =>
              `flex items-center px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors ${
                isActive ? 'bg-gray-800/70 text-[#c9fffc]' : ''
              }`
            }
          >
            <Bot className="w-5 h-5 mr-3" />
            AI Tool
          </NavLink>

          <NavLink
            to="/settings"
            onClick={() => setIsOpen(false)}
            className={({ isActive }) =>
              `flex items-center px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors ${
                isActive ? 'bg-gray-800/70 text-[#c9fffc]' : ''
              }`
            }
          >
            <Settings className="w-5 h-5 mr-3" />
            Settings
          </NavLink>
        </div>

        {isAdmin && (
          <>
            <div className="px-4 py-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Admin Features
              </h3>
            </div>
            <NavLink
              to="/users"
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors ${
                  isActive ? 'bg-gray-800/70 text-[#c9fffc]' : ''
                }`
              }
            >
              <UserCog className="w-5 h-5 mr-3" />
              Manage Users
            </NavLink>
            <NavLink
              to="/webhooks"
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center px-4 py-2 text-gray-300 hover:bg-gray-800 rounded-lg transition-colors ${
                  isActive ? 'bg-gray-800/70 text-[#c9fffc]' : ''
                }`
              }
            >
              <Webhook className="w-5 h-5 mr-3" />
              Manage Webhooks
            </NavLink>
          </>
        )}

        <button
          onClick={handleSignOut}
          className="flex items-center px-4 py-2 text-gray-300 hover:bg-gray-800/70 rounded-lg transition-colors mt-auto mb-4"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sign Out
        </button>
      </div>
    </nav>
    </>
  );
}