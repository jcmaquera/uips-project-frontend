import { useState } from "react";
import { Home, Settings, Menu, X, ChevronDown, BriefcaseBusiness } from "lucide-react";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [submenuOpen, setSubmenuOpen] = useState(false);

  return (
    <div className="flex">
      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-64 bg-white drop-shadow text-black p-5 transition-transform ${isOpen ? "translate-x-0" : "-translate-x-64"} lg:translate-x-0`}>
        {/* Close button for mobile */}
        <button onClick={() => setIsOpen(false)} className="lg:hidden absolute top-4 right-4 text-black">
          <X size={24} />
        </button>

        <h2 className="text-xl font-semibold mb-5">UIPS System</h2>

        <ul>
          <li className="flex items-center gap-2 py-2 px-3 rounded hover:bg-gray-100">
            <Home size={20} />
            <a href="#">Home</a>
          </li>

          {/* Submenu */}
          <li className="py-2">
            <button
              className="flex items-center justify-between w-full px-3 py-2 rounded hover:bg-gray-100"
              onClick={() => setSubmenuOpen(!submenuOpen)}
            >
              <span className="flex items-center gap-2">
                <BriefcaseBusiness size={20} />
                Inventory
              </span>
              <ChevronDown className={`transition-transform ${submenuOpen ? "rotate-180" : ""}`} />
            </button>
            {submenuOpen && (
              <ul className="ml-5 mt-2 space-y-1">
                <li className="py-1"><a href="#" className="hover:text-gray-300">Add Items</a></li>
                <li className="py-1"><a href="#" className="hover:text-gray-300">Delete Items</a></li>
                <li className="py-1"><a href="#" className="hover:text-gray-300">Generate Reports</a></li>
              </ul>
            )}
          </li>
        </ul>
      </div>

      {/* Open Button (Mobile) */}
      <button onClick={() => setIsOpen(true)} className="lg:hidden fixed top-4 left-4 bg-gray-800 text-white p-2 rounded">
        <Menu size={24} />
      </button>

      {/* Content */}
      <div className="flex-1 p-5 lg:ml-64">
        <h1 className="text-2xl font-semibold">Welcome</h1>
      </div>
    </div>
  );
};

export default Sidebar;
