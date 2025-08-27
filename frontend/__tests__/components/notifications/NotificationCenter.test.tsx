import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import NotificationCenter from '@/components/notifications/NotificationCenter';

// Mock the API
global.fetch = jest.fn();

const mockNotifications = [
  {
    id: '1',
    type: 'property_approved',
    title: 'Property Approved',
    message: 'Your property has been approved for listing.',
    priority: 'high',
    sender_first_name: 'John',
    sender_last_name: 'Manager',
    property_title: 'Test Property',
    read_at: null,
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    type: 'booking_confirmed',
    title: 'Booking Confirmed',
    message: 'A new booking has been confirmed.',
    priority: 'medium',
    sender_first_name: 'Jane',
    sender_last_name: 'Agent',
    read_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 60000).toISOString()
  }
];

const mockApiResponse = {
  success: true,
  data: {
    notifications: mockNotifications,
    unreadCount: 1,
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalNotifications: 2,
      limit: 20
    }
  }
};

describe('NotificationCenter Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse
    });
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => 'mock-token'),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  it('renders notification center with header by default', async () => {
    render(<NotificationCenter />);

    await waitFor(() => {
      expect(screen.getByText(/bildirişlər/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/bildirişlər/i)).toBeInTheDocument();
    expect(screen.getByText(/hamısını oxu/i)).toBeInTheDocument();
  });

  it('loads and displays notifications', async () => {
    render(<NotificationCenter />);

    await waitFor(() => {
      expect(screen.getByText('Property Approved')).toBeInTheDocument();
    });

    expect(screen.getByText('Property Approved')).toBeInTheDocument();
    expect(screen.getByText('Booking Confirmed')).toBeInTheDocument();
    expect(screen.getByText(/your property has been approved/i)).toBeInTheDocument();
  });

  it('shows unread count badge', async () => {
    render(<NotificationCenter />);

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument(); // Unread count
    });
  });

  it('displays loading state initially', async () => {
    // Mock delayed response
    (fetch as jest.Mock).mockImplementation(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: async () => mockApiResponse
        }), 100)
      )
    );

    render(<NotificationCenter />);

    // Should show loading skeletons
    expect(screen.getAllByTestId('skeleton')).toBeTruthy();
  });

  it('displays empty state when no notifications', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        ...mockApiResponse,
        data: {
          ...mockApiResponse.data,
          notifications: [],
          unreadCount: 0
        }
      })
    });

    render(<NotificationCenter />);

    await waitFor(() => {
      expect(screen.getByText(/bildiriş yoxdur/i)).toBeInTheDocument();
    });
  });

  it('filters notifications by type', async () => {
    const user = userEvent.setup();
    
    render(<NotificationCenter />);

    await waitFor(() => {
      expect(screen.getByText('Property Approved')).toBeInTheDocument();
    });

    // Open type filter dropdown
    const typeSelect = screen.getByDisplayValue(/bütün növlər/i);
    await user.click(typeSelect);
    
    // Select property approved type
    const propertyOption = screen.getByText(/əmlak təsdiqi/i);
    await user.click(propertyOption);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('type=property_approved'),
        expect.any(Object)
      );
    });
  });

  it('filters notifications by status', async () => {
    const user = userEvent.setup();
    
    render(<NotificationCenter />);

    await waitFor(() => {
      expect(screen.getByText('Property Approved')).toBeInTheDocument();
    });

    // Open status filter dropdown
    const statusSelect = screen.getByDisplayValue(/hamısı/i);
    await user.click(statusSelect);
    
    // Select unread status
    const unreadOption = screen.getByText(/oxunmamış/i);
    await user.click(unreadOption);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('status=unread'),
        expect.any(Object)
      );
    });
  });

  it('searches notifications', async () => {
    const user = userEvent.setup();
    
    render(<NotificationCenter />);

    await waitFor(() => {
      expect(screen.getByText('Property Approved')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/bildirişlərdə axtar/i);
    await user.type(searchInput, 'property');

    // Should trigger search after typing
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=property'),
        expect.any(Object)
      );
    }, { timeout: 1000 }); // Allow for debounce
  });

  it('marks notification as read', async () => {
    const user = userEvent.setup();
    
    render(<NotificationCenter />);

    await waitFor(() => {
      expect(screen.getByText('Property Approved')).toBeInTheDocument();
    });

    // Mock successful mark as read response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    // Find and click the more options button for unread notification
    const moreButtons = screen.getAllByTestId('more-options');
    await user.click(moreButtons[0]);

    // Click mark as read option
    const markReadButton = screen.getByText(/oxundu olaraq qeyd et/i);
    await user.click(markReadButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/notifications/1/read'),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token'
          })
        })
      );
    });
  });

  it('deletes notification', async () => {
    const user = userEvent.setup();
    
    // Mock window.confirm
    const originalConfirm = window.confirm;
    window.confirm = jest.fn(() => true);

    render(<NotificationCenter />);

    await waitFor(() => {
      expect(screen.getByText('Property Approved')).toBeInTheDocument();
    });

    // Mock successful delete response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    // Find and click the more options button
    const moreButtons = screen.getAllByTestId('more-options');
    await user.click(moreButtons[0]);

    // Click delete option
    const deleteButton = screen.getByText(/sil/i);
    await user.click(deleteButton);

    expect(window.confirm).toHaveBeenCalled();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/notifications/1'),
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token'
          })
        })
      );
    });

    // Restore window.confirm
    window.confirm = originalConfirm;
  });

  it('marks all notifications as read', async () => {
    const user = userEvent.setup();
    
    render(<NotificationCenter />);

    await waitFor(() => {
      expect(screen.getByText(/hamısını oxu/i)).toBeInTheDocument();
    });

    // Mock successful mark all as read response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    const markAllReadButton = screen.getByText(/hamısını oxu/i);
    await user.click(markAllReadButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/notifications/read-all'),
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-token'
          })
        })
      );
    });
  });

  it('selects notifications for batch operations', async () => {
    const user = userEvent.setup();
    
    render(<NotificationCenter />);

    await waitFor(() => {
      expect(screen.getByText('Property Approved')).toBeInTheDocument();
    });

    // Select first notification
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]); // Skip "select all" checkbox

    // Should show batch actions
    expect(screen.getByText(/1 seçildi/i)).toBeInTheDocument();
    expect(screen.getByText(/oxundu qeyd et/i)).toBeInTheDocument();
    expect(screen.getByText(/sil/i)).toBeInTheDocument();
  });

  it('performs batch mark as read operation', async () => {
    const user = userEvent.setup();
    
    render(<NotificationCenter />);

    await waitFor(() => {
      expect(screen.getByText('Property Approved')).toBeInTheDocument();
    });

    // Select notifications
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]); // Select first notification
    await user.click(checkboxes[2]); // Select second notification

    // Mock successful batch operation response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    // Click batch mark as read
    const batchReadButton = screen.getByText(/oxundu qeyd et/i);
    await user.click(batchReadButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/notifications/batch'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          }),
          body: JSON.stringify({
            action: 'read',
            notification_ids: ['1', '2']
          })
        })
      );
    });
  });

  it('selects all notifications', async () => {
    const user = userEvent.setup();
    
    render(<NotificationCenter />);

    await waitFor(() => {
      expect(screen.getByText('Property Approved')).toBeInTheDocument();
    });

    // Click select all checkbox
    const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
    await user.click(selectAllCheckbox);

    // Should show all notifications selected
    expect(screen.getByText(/2 seçildi/i)).toBeInTheDocument();
  });

  it('displays priority badges correctly', async () => {
    render(<NotificationCenter />);

    await waitFor(() => {
      expect(screen.getByText('Yüksək')).toBeInTheDocument(); // High priority
    });

    expect(screen.getByText('Yüksək')).toBeInTheDocument(); // High priority
    expect(screen.getByText('Orta')).toBeInTheDocument(); // Medium priority
  });

  it('shows notification metadata (sender, property)', async () => {
    render(<NotificationCenter />);

    await waitFor(() => {
      expect(screen.getByText('John Manager')).toBeInTheDocument();
    });

    expect(screen.getByText('John Manager')).toBeInTheDocument();
    expect(screen.getByText('Test Property')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    (fetch as jest.Mock).mockRejectedValue(new Error('API Error'));

    render(<NotificationCenter />);

    // Should not crash and show empty state
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Load notifications error:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });

  it('navigates to action URL when clicked', async () => {
    const user = userEvent.setup();
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);

    // Add action URL to first notification
    const notificationsWithAction = [
      {
        ...mockNotifications[0],
        action_url: 'https://example.com/property/123'
      },
      mockNotifications[1]
    ];

    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        ...mockApiResponse,
        data: {
          ...mockApiResponse.data,
          notifications: notificationsWithAction
        }
      })
    });

    render(<NotificationCenter />);

    await waitFor(() => {
      expect(screen.getByText('Property Approved')).toBeInTheDocument();
    });

    // Find and click the more options button
    const moreButtons = screen.getAllByTestId('more-options');
    await user.click(moreButtons[0]);

    // Click action URL option
    const actionButton = screen.getByText(/açıq keç/i);
    await user.click(actionButton);

    expect(openSpy).toHaveBeenCalledWith('https://example.com/property/123', '_blank');
    
    openSpy.mockRestore();
  });

  it('renders without header when showHeader is false', async () => {
    render(<NotificationCenter showHeader={false} />);

    await waitFor(() => {
      expect(screen.getByText('Property Approved')).toBeInTheDocument();
    });

    expect(screen.queryByText(/bildirişlər/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/hamısını oxu/i)).not.toBeInTheDocument();
  });
});