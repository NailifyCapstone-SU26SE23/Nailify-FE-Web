import { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Filter,
  LayoutGrid,
  List as ListIcon,
  MoreHorizontal,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  UserCircle
} from "lucide-react";
import { Table, Spin } from "antd";
import toast from "react-hot-toast";

import { ROUTES } from "../../../../shared/constants/routes";
import { fetchReceptionistCustomers } from "../services/receptionistCustomerService";
import { ActionDropdown } from "../../../../shared/components/ui/ActionDropdown";

function formatDate(dateString) {
  if (!dateString) return "--";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function getStatusTone(status) {
  const norm = String(status || "").trim().toLowerCase();
  switch (norm) {
    case "active":
    case "current":
      return "bg-[#e8f8ef] text-[#1f9d61]";
    case "prospective":
      return "bg-[#f5ecff] text-[#7c63d8]";
    case "non-active":
    case "inactive":
      return "bg-[#f1f1f1] text-[#666666]";
    default:
      return "bg-[#f1f1f1] text-[#666666]";
  }
}

export function ReceptionistCustomerListPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to page 1 on search
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchReceptionistCustomers({
        pageNumber: currentPage,
        pageSize: pageSize,
        searchTerm: debouncedSearch
      });
      setCustomers(data.items || []);
      setTotalPages(data.metaData?.totalPages || 1);
      setTotalItems(data.metaData?.totalItems || 0);
    } catch (error) {
      toast.error("Failed to load customers.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, debouncedSearch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Actions
  const handleViewDetail = (id) => {
    navigate(ROUTES.receptionistCustomerDetail.replace(":id", id));
  };

  const columns = useMemo(() => [

    {
      title: "Customer Name",
      key: "name",
      render: (_, record) => (
        <div className="flex items-center gap-3">
          {record.avatarUrl ? (
            <img src={record.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-gray-100" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
              <UserCircle size={20} />
            </div>
          )}
          <span className="font-semibold text-gray-900">{record.firstName} {record.lastName}</span>
        </div>
      ),
    },
    {
      title: "Customer Email",
      dataIndex: "email",
      key: "email",
      render: (val) => <span className="text-gray-500">{val}</span>,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (val) => (
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusTone(val)}`}>
          {val}
        </span>
      ),
    },
    {
      title: "Create date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (val) => <span className="text-gray-500">{formatDate(val)}</span>,
    },
    {
      title: "Note",
      key: "note",
      render: () => (
        <button className="text-gray-400 hover:text-gray-600 transition p-1">
          <Plus size={16} />
        </button>
      ),
    },
    {
      title: "",
      key: "action",
      render: (_, record) => (
        <ActionDropdown
          items={[
            {
              key: "view",
              label: "View Detail",
              onSelect: () => handleViewDetail(record.userId)
            }
          ]}
          trigger={
            <button className="p-2 text-gray-400 hover:text-gray-700 transition">
              <MoreHorizontal size={18} />
            </button>
          }
        />
      ),
    },
  ], []);

  return (
    <div className="flex flex-col min-h-full font-sans">

      <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 flex-1 p-6 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#7c63d8] focus:border-transparent transition w-64"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-500 mr-2">
              <span>Sort by:</span>
              <select className="bg-transparent font-semibold text-gray-900 outline-none cursor-pointer">
                <option>Type</option>
                <option>Newest</option>
                <option>Name</option>
              </select>
            </div>

            <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50 transition">
              Filter <Filter size={14} />
            </button>

            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200 ml-2">
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition ${viewMode === "list" ? "bg-white shadow-sm text-gray-900" : "text-gray-400 hover:text-gray-600"}`}
              >
                <ListIcon size={18} />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition ${viewMode === "grid" ? "bg-white shadow-sm text-gray-900" : "text-gray-400 hover:text-gray-600"}`}
              >
                <LayoutGrid size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 relative min-h-[400px]">
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center rounded-xl">
              <Spin size="large" />
            </div>
          )}

          {!isLoading && customers.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <UserCircle size={48} className="mb-4 opacity-50" />
              <p>No customers found.</p>
            </div>
          )}

          {viewMode === "grid" && customers.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
              {customers.map((c) => (
                <div key={c.userId} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md transition cursor-pointer" onClick={() => handleViewDetail(c.userId)}>
                  <div className="flex items-center justify-between mb-4">

                    <button className="text-gray-400 hover:text-gray-600 transition p-1 border border-gray-200 rounded-full">
                      <Plus size={14} />
                    </button>
                  </div>

                  <div className="flex flex-col items-center text-center">
                    {c.avatarUrl ? (
                      <img src={c.avatarUrl} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm mb-3" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3 shadow-sm border-2 border-white">
                        <UserCircle size={32} />
                      </div>
                    )}

                    <h3 className="font-bold text-gray-900 text-lg">{c.firstName} {c.lastName}</h3>
                    <p className="text-sm text-gray-400 mt-1 mb-4">{c.email}</p>

                    <span className={`px-4 py-1.5 rounded-full text-xs font-extrabold tracking-wide ${getStatusTone(c.status)}`}>
                      {c.status || "Active"}
                    </span>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                      <CalendarDays size={14} />
                      {formatDate(c.createdAt)}
                    </div>
                    <ActionDropdown
                      items={[
                        {
                          key: "view",
                          label: "View Detail",
                          onSelect: () => handleViewDetail(c.userId)
                        }
                      ]}
                      trigger={
                        <button className="text-gray-400 hover:text-gray-600 p-1" onClick={(e) => e.stopPropagation()}>
                          <MoreHorizontal size={16} />
                        </button>
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {viewMode === "list" && customers.length > 0 && (
            <Table
              columns={columns}
              dataSource={customers}
              rowKey="userId"
              pagination={false}
              className="custom-table"
              onRow={(record) => ({
                onClick: () => handleViewDetail(record.userId),
                className: "cursor-pointer hover:bg-gray-50 transition"
              })}
            />
          )}
        </div>

        {/* Pagination Footer */}
        {customers.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <span className="text-sm font-medium text-gray-400">
                Showing <span className="text-gray-900 font-semibold">{customers.length}</span> of <span className="text-gray-900 font-semibold">{totalItems}</span> customers
              </span>
              
              <div className="flex items-center gap-1 bg-white p-1 rounded-full border border-gray-200 shadow-sm">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 disabled:opacity-40 disabled:hover:text-gray-500 transition-colors rounded-full hover:bg-gray-50"
                >
                  <ChevronLeft size={16} />
                  <span className="hidden sm:inline">Previous</span>
                </button>

                <div className="flex items-center px-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[32px] h-8 mx-0.5 rounded-full text-sm font-bold flex items-center justify-center transition-all duration-200 ${
                        currentPage === page
                          ? "bg-[#7c63d8] text-white shadow-md shadow-[#7c63d8]/40"
                          : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 disabled:opacity-40 disabled:hover:text-gray-500 transition-colors rounded-full hover:bg-gray-50"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

        )}
      </div>
    </div>
  );
}
