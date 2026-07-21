import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, UserCircle, Phone, Mail, Calendar, Activity } from "lucide-react";
import { Spin } from "antd";
import toast from "react-hot-toast";

import { fetchReceptionistCustomerDetail } from "../services/receptionistCustomerService";

function formatDate(dateString) {
  if (!dateString) return "--";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
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

export function ReceptionistCustomerDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const data = await fetchReceptionistCustomerDetail(id);
      setCustomer(data);
    } catch (error) {
      toast.error("Failed to load customer details.");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[500px] items-center justify-center bg-[#f8f9fc]">
        <Spin size="large" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex h-full min-h-[500px] flex-col items-center justify-center bg-[#f8f9fc] text-gray-500">
        <UserCircle size={48} className="mb-4 opacity-50" />
        <p>Customer not found.</p>
        <button 
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-semibold transition"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-[#f8f9fc] p-6 font-sans">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 bg-white border border-gray-200 text-gray-500 hover:text-gray-900 rounded-full transition shadow-sm"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Customer Detail</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-gray-100 p-8 max-w-4xl mx-auto w-full">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          <div className="flex flex-col items-center p-6 bg-gray-50 rounded-2xl border border-gray-100 w-full md:w-1/3 text-center">
            {customer.avatarUrl ? (
              <img src={customer.avatarUrl} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md mb-4" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 mb-4 shadow-md border-4 border-white">
                <UserCircle size={48} />
              </div>
            )}
            <h2 className="text-xl font-bold text-gray-900">{customer.firstName} {customer.lastName}</h2>
            <p className="text-sm text-gray-500 mt-1 mb-4">ID: {String(customer.userId).split("-")[0]}</p>
            <span className={`px-4 py-1.5 rounded-full text-xs font-extrabold tracking-wide ${getStatusTone(customer.status)}`}>
              {customer.status || "Active"}
            </span>
          </div>

          <div className="flex-1 w-full space-y-6">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-2">Contact Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                  <Mail size={14} /> Email Address
                </p>
                <p className="font-medium text-gray-900">{customer.email || "--"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                  <Phone size={14} /> Phone Number
                </p>
                <p className="font-medium text-gray-900">{customer.phone || "--"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                  <Calendar size={14} /> Joined Date
                </p>
                <p className="font-medium text-gray-900">{formatDate(customer.createdAt)}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                  <Activity size={14} /> Account Status
                </p>
                <p className="font-medium text-gray-900">{customer.status || "Active"}</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
