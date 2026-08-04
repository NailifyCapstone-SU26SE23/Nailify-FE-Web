import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReceptionistBookingDetailPage } from './ReceptionistBookingDetailPage';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ bookingId: 'booking-123' }),
  useNavigate: () => jest.fn(),
}));

jest.mock('../services/receptionistBookingService', () => ({
  fetchReceptionistBookingDetail: jest.fn().mockResolvedValue({
    bookingId: 'booking-123',
    customerName: 'Test Customer',
    status: 'Pending',
    startTime: '10:00:00',
    totalPrice: 500000,
    price: 500000,
    bookingDate: '2026-07-29T10:00:00Z',
    bookingItems: [
      {
        bookingItemId: 'item-1',
        serviceName: 'Test Service',
        duration: 30,
        price: 250000,
      }
    ]
  }),
  getBookingHistories: jest.fn().mockResolvedValue({ items: [] }),
  fetchReceptionistBookingProcedures: jest.fn().mockResolvedValue([]),
  fetchReceptionistProcedureAvailableArtists: jest.fn().mockResolvedValue([]),
  updateReceptionistProcedureArtist: jest.fn(),
  manualCheckInReceptionistBooking: jest.fn(),
  checkoutReceptionistBooking: jest.fn(),
  getUserById: jest.fn(),
}));

jest.mock('../../customers/services/receptionistCustomerService', () => ({
  fetchReceptionistCustomerDetail: jest.fn().mockResolvedValue({
    firstName: 'Test',
    lastName: 'Customer',
    loyaltyPoint: 100,
  }),
  fetchLoyaltyTiers: jest.fn().mockResolvedValue([]),
}));

jest.mock('../../payments/services/receptionistPaymentService', () => ({
  createPayment: jest.fn(),
}));

jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

describe('ReceptionistBookingDetailPage', () => {
  let queryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    jest.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ReceptionistBookingDetailPage />
        </BrowserRouter>
      </QueryClientProvider>
    );

  it('1. renders successfully without crashing', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getAllByText(/Test Customer/i).length).toBeGreaterThan(0));
  });

  it('2. displays the correct customer information', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getAllByText(/Test Customer/i).length).toBeGreaterThan(0);
    });
  });

  it('3. displays the booking status', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getAllByText(/Pending/i).length).toBeGreaterThan(0);
    });
  });

  it('4. displays formatted total price', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getAllByText(/500.*000/i).length).toBeGreaterThan(0);
    });
  });

  it('5. renders service items correctly', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getAllByText(/Test Service/i).length).toBeGreaterThan(0);
    });
  });

  it('6. renders Receptionist Quick Action Center section', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Receptionist Quick Action Center')).toBeInTheDocument();
    });
  });

  it('7. renders Live Status section', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Live Status')).toBeInTheDocument();
    });
  });

  it('8. renders Add Payment button', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Add Payment')).toBeInTheDocument();
    });
  });

  it('9. renders Print Receipt button', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Print Receipt')).toBeInTheDocument();
    });
  });

  it('10. renders Booking Operations Timeline', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Booking Operations Timeline')).toBeInTheDocument();
    });
  });
});
