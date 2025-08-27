import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import PropertyForm from '@/components/properties/PropertyForm';

// Mock the API
global.fetch = jest.fn();

const mockProperties = {
  onSubmit: jest.fn(),
  onCancel: jest.fn()
};

const defaultFormData = {
  title: '',
  description: '',
  category: 'sale' as const,
  property_category: 'residential' as const,
  listing_type: 'agency_owned' as const,
  sell_price_azn: 0,
  area_m2: 0,
  room_count: 1,
  floor: 1,
  total_floors: 1,
  address: '',
  district_id: null
};

describe('PropertyForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          districts: [
            { id: 1, name: 'Yasamal' },
            { id: 2, name: 'Nasimi' }
          ],
          subcategories: {
            apartment: [
              { id: 'studio', name: 'Studio', name_az: 'Studiya' },
              { id: '1_room', name: '1 Room', name_az: '1 otaqlı' }
            ]
          }
        }
      })
    });
  });

  it('renders form with all required fields', async () => {
    render(
      <PropertyForm
        initialData={defaultFormData}
        onSubmit={mockProperties.onSubmit}
        onCancel={mockProperties.onCancel}
      />
    );

    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByLabelText(/başlıq/i)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/başlıq/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/təsvir/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/kateqoriya/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/əmlak növü/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sahə/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/otaq sayı/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/ünvan/i)).toBeInTheDocument();
  });

  it('shows validation errors for required fields', async () => {
    const user = userEvent.setup();
    
    render(
      <PropertyForm
        initialData={defaultFormData}
        onSubmit={mockProperties.onSubmit}
        onCancel={mockProperties.onCancel}
      />
    );

    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByLabelText(/başlıq/i)).toBeInTheDocument();
    });

    const submitButton = screen.getByText(/saxla/i);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/başlıq tələb olunur/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/təsvir tələb olunur/i)).toBeInTheDocument();
    expect(screen.getByText(/ünvan tələb olunur/i)).toBeInTheDocument();
  });

  it('validates numeric fields correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <PropertyForm
        initialData={defaultFormData}
        onSubmit={mockProperties.onSubmit}
        onCancel={mockProperties.onCancel}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/sahə/i)).toBeInTheDocument();
    });

    const areaField = screen.getByLabelText(/sahə/i);
    await user.clear(areaField);
    await user.type(areaField, '-10');

    const submitButton = screen.getByText(/saxla/i);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/sahə müsbət rəqəm olmalıdır/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    
    render(
      <PropertyForm
        initialData={defaultFormData}
        onSubmit={mockProperties.onSubmit}
        onCancel={mockProperties.onCancel}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/başlıq/i)).toBeInTheDocument();
    });

    // Fill in required fields
    await user.type(screen.getByLabelText(/başlıq/i), 'Test Property');
    await user.type(screen.getByLabelText(/təsvir/i), 'Test Description');
    await user.type(screen.getByLabelText(/ünvan/i), 'Test Address');
    await user.type(screen.getByLabelText(/sahə/i), '100');

    // Set price for sale category
    await user.type(screen.getByLabelText(/satış qiyməti/i), '150000');

    const submitButton = screen.getByText(/saxla/i);
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockProperties.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Property',
          description: 'Test Description',
          address: 'Test Address',
          area_m2: 100,
          sell_price_azn: 150000
        })
      );
    });
  });

  it('shows rent price field when category is rent', async () => {
    const user = userEvent.setup();
    
    render(
      <PropertyForm
        initialData={{
          ...defaultFormData,
          category: 'rent'
        }}
        onSubmit={mockProperties.onSubmit}
        onCancel={mockProperties.onCancel}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/icarə qiyməti/i)).toBeInTheDocument();
    });

    expect(screen.queryByLabelText(/satış qiyməti/i)).not.toBeInTheDocument();
  });

  it('loads districts from API', async () => {
    render(
      <PropertyForm
        initialData={defaultFormData}
        onSubmit={mockProperties.onSubmit}
        onCancel={mockProperties.onCancel}
      />
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/lookup/districts');
    });
  });

  it('updates subcategories when property category changes', async () => {
    const user = userEvent.setup();
    
    render(
      <PropertyForm
        initialData={defaultFormData}
        onSubmit={mockProperties.onSubmit}
        onCancel={mockProperties.onCancel}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/əmlak növü/i)).toBeInTheDocument();
    });

    // Change property category to commercial
    const propertyTypeSelect = screen.getByLabelText(/əmlak növü/i);
    await user.selectOptions(propertyTypeSelect, 'commercial');

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/lookup/subcategories/commercial');
    });
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <PropertyForm
        initialData={defaultFormData}
        onSubmit={mockProperties.onSubmit}
        onCancel={mockProperties.onCancel}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/ləğv et/i)).toBeInTheDocument();
    });

    const cancelButton = screen.getByText(/ləğv et/i);
    await user.click(cancelButton);

    expect(mockProperties.onCancel).toHaveBeenCalled();
  });

  it('handles form submission error', async () => {
    const user = userEvent.setup();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock onSubmit to throw an error
    const mockOnSubmitError = jest.fn().mockRejectedValue(new Error('Submit failed'));
    
    render(
      <PropertyForm
        initialData={defaultFormData}
        onSubmit={mockOnSubmitError}
        onCancel={mockProperties.onCancel}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/başlıq/i)).toBeInTheDocument();
    });

    // Fill required fields
    await user.type(screen.getByLabelText(/başlıq/i), 'Test Property');
    await user.type(screen.getByLabelText(/təsvir/i), 'Test Description');
    await user.type(screen.getByLabelText(/ünvan/i), 'Test Address');
    await user.type(screen.getByLabelText(/sahə/i), '100');
    await user.type(screen.getByLabelText(/satış qiyməti/i), '150000');

    const submitButton = screen.getByText(/saxla/i);
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmitError).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it('populates form with initial data in edit mode', async () => {
    const editData = {
      id: '1',
      title: 'Existing Property',
      description: 'Existing Description',
      category: 'sale' as const,
      property_category: 'residential' as const,
      listing_type: 'agency_owned' as const,
      sell_price_azn: 200000,
      area_m2: 120,
      room_count: 3,
      floor: 5,
      total_floors: 10,
      address: 'Existing Address',
      district_id: 1
    };

    render(
      <PropertyForm
        initialData={editData}
        onSubmit={mockProperties.onSubmit}
        onCancel={mockProperties.onCancel}
      />
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Existing Property')).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue('Existing Description')).toBeInTheDocument();
    expect(screen.getByDisplayValue('200000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('120')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing Address')).toBeInTheDocument();
  });

  it('validates floor numbers correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <PropertyForm
        initialData={defaultFormData}
        onSubmit={mockProperties.onSubmit}
        onCancel={mockProperties.onCancel}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/mərtəbə/i)).toBeInTheDocument();
    });

    // Set floor higher than total floors
    const floorField = screen.getByLabelText(/mərtəbə/i);
    const totalFloorsField = screen.getByLabelText(/ümumi mərtəbə/i);
    
    await user.clear(floorField);
    await user.type(floorField, '10');
    await user.clear(totalFloorsField);
    await user.type(totalFloorsField, '5');

    const submitButton = screen.getByText(/saxla/i);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/mərtəbə ümumi mərtəbədən çox ola bilməz/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during form submission', async () => {
    const user = userEvent.setup();
    
    // Mock slow onSubmit
    const mockSlowSubmit = jest.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 1000))
    );
    
    render(
      <PropertyForm
        initialData={defaultFormData}
        onSubmit={mockSlowSubmit}
        onCancel={mockProperties.onCancel}
      />
    );

    await waitFor(() => {
      expect(screen.getByLabelText(/başlıq/i)).toBeInTheDocument();
    });

    // Fill required fields
    await user.type(screen.getByLabelText(/başlıq/i), 'Test Property');
    await user.type(screen.getByLabelText(/təsvir/i), 'Test Description');
    await user.type(screen.getByLabelText(/ünvan/i), 'Test Address');
    await user.type(screen.getByLabelText(/sahə/i), '100');
    await user.type(screen.getByLabelText(/satış qiyməti/i), '150000');

    const submitButton = screen.getByText(/saxla/i);
    await user.click(submitButton);

    expect(screen.getByText(/saxlanılır/i)).toBeInTheDocument();
  });
});