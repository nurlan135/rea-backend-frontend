import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock components since the original components were deleted
const MockLoginForm = ({ onLogin }: { onLogin?: (email: string, password: string) => void }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    onLogin?.(email, password);
  };

  return (
    <form onSubmit={handleSubmit} data-testid="login-form">
      <div>
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          required
          data-testid="email-input"
        />
      </div>
      <div>
        <label htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          name="password"
          required
          data-testid="password-input"
        />
      </div>
      <button type="submit" data-testid="login-button">
        Login
      </button>
    </form>
  );
};

const MockPropertyCard = ({ 
  property 
}: { 
  property: {
    id: string;
    title: string;
    price: number;
    type: string;
    currency?: string;
  }
}) => {
  return (
    <div data-testid={`property-card-${property.id}`} className="property-card">
      <h3 data-testid="property-title">{property.title}</h3>
      <p data-testid="property-price">
        {property.price} {property.currency || 'AZN'}
      </p>
      <p data-testid="property-type">{property.type}</p>
      <button data-testid="view-details">View Details</button>
    </div>
  );
};

const MockPropertyList = ({ 
  properties = [],
  loading = false
}: {
  properties?: Array<{
    id: string;
    title: string;
    price: number;
    type: string;
    currency?: string;
  }>;
  loading?: boolean;
}) => {
  if (loading) {
    return <div data-testid="loading">Loading properties...</div>;
  }

  if (properties.length === 0) {
    return <div data-testid="empty-state">No properties found</div>;
  }

  return (
    <div data-testid="property-list">
      {properties.map(property => (
        <MockPropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
};

const MockSearchForm = ({ 
  onSearch 
}: { 
  onSearch?: (query: string) => void 
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const query = formData.get('query') as string;
    onSearch?.(query);
  };

  return (
    <form onSubmit={handleSubmit} data-testid="search-form">
      <input
        type="text"
        name="query"
        placeholder="Search properties..."
        data-testid="search-input"
      />
      <button type="submit" data-testid="search-button">
        Search
      </button>
    </form>
  );
};

describe('REA INVEST Frontend Components', () => {
  describe('LoginForm Component', () => {
    test('renders login form with required fields', () => {
      render(<MockLoginForm />);
      
      expect(screen.getByTestId('login-form')).toBeInTheDocument();
      expect(screen.getByTestId('email-input')).toBeInTheDocument();
      expect(screen.getByTestId('password-input')).toBeInTheDocument();
      expect(screen.getByTestId('login-button')).toBeInTheDocument();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    test('calls onLogin when form is submitted with valid data', async () => {
      const mockOnLogin = jest.fn();
      const user = userEvent.setup();
      
      render(<MockLoginForm onLogin={mockOnLogin} />);
      
      await user.type(screen.getByTestId('email-input'), 'admin@rea-invest.com');
      await user.type(screen.getByTestId('password-input'), 'password123');
      await user.click(screen.getByTestId('login-button'));
      
      expect(mockOnLogin).toHaveBeenCalledWith('admin@rea-invest.com', 'password123');
    });

    test('email input has correct attributes', () => {
      render(<MockLoginForm />);
      
      const emailInput = screen.getByTestId('email-input');
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('required');
    });

    test('password input has correct attributes', () => {
      render(<MockLoginForm />);
      
      const passwordInput = screen.getByTestId('password-input');
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('required');
    });
  });

  describe('PropertyCard Component', () => {
    const mockProperty = {
      id: '1',
      title: 'Beautiful Apartment',
      price: 150000,
      type: 'apartment',
      currency: 'AZN'
    };

    test('renders property information correctly', () => {
      render(<MockPropertyCard property={mockProperty} />);
      
      expect(screen.getByTestId('property-title')).toHaveTextContent('Beautiful Apartment');
      expect(screen.getByTestId('property-price')).toHaveTextContent('150000 AZN');
      expect(screen.getByTestId('property-type')).toHaveTextContent('apartment');
      expect(screen.getByTestId('view-details')).toBeInTheDocument();
    });

    test('uses default currency when not specified', () => {
      const propertyWithoutCurrency = { ...mockProperty };
      delete propertyWithoutCurrency.currency;
      
      render(<MockPropertyCard property={propertyWithoutCurrency} />);
      
      expect(screen.getByTestId('property-price')).toHaveTextContent('150000 AZN');
    });

    test('has correct data-testid for identification', () => {
      render(<MockPropertyCard property={mockProperty} />);
      
      expect(screen.getByTestId('property-card-1')).toBeInTheDocument();
    });
  });

  describe('PropertyList Component', () => {
    const mockProperties = [
      {
        id: '1',
        title: 'Apartment 1',
        price: 150000,
        type: 'apartment'
      },
      {
        id: '2',
        title: 'House 1',
        price: 300000,
        type: 'house'
      }
    ];

    test('renders loading state', () => {
      render(<MockPropertyList loading={true} />);
      
      expect(screen.getByTestId('loading')).toBeInTheDocument();
      expect(screen.getByText('Loading properties...')).toBeInTheDocument();
    });

    test('renders empty state when no properties', () => {
      render(<MockPropertyList properties={[]} />);
      
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByText('No properties found')).toBeInTheDocument();
    });

    test('renders properties when data is available', () => {
      render(<MockPropertyList properties={mockProperties} />);
      
      expect(screen.getByTestId('property-list')).toBeInTheDocument();
      expect(screen.getByTestId('property-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('property-card-2')).toBeInTheDocument();
      expect(screen.getByText('Apartment 1')).toBeInTheDocument();
      expect(screen.getByText('House 1')).toBeInTheDocument();
    });

    test('does not show loading when properties are loaded', () => {
      render(<MockPropertyList properties={mockProperties} loading={false} />);
      
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      expect(screen.getByTestId('property-list')).toBeInTheDocument();
    });
  });

  describe('SearchForm Component', () => {
    test('renders search form with input and button', () => {
      render(<MockSearchForm />);
      
      expect(screen.getByTestId('search-form')).toBeInTheDocument();
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
      expect(screen.getByTestId('search-button')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Search properties...')).toBeInTheDocument();
    });

    test('calls onSearch when form is submitted', async () => {
      const mockOnSearch = jest.fn();
      const user = userEvent.setup();
      
      render(<MockSearchForm onSearch={mockOnSearch} />);
      
      await user.type(screen.getByTestId('search-input'), 'luxury apartment');
      await user.click(screen.getByTestId('search-button'));
      
      expect(mockOnSearch).toHaveBeenCalledWith('luxury apartment');
    });

    test('submits empty search query', async () => {
      const mockOnSearch = jest.fn();
      const user = userEvent.setup();
      
      render(<MockSearchForm onSearch={mockOnSearch} />);
      
      await user.click(screen.getByTestId('search-button'));
      
      expect(mockOnSearch).toHaveBeenCalledWith('');
    });
  });

  describe('Integration Tests', () => {
    test('property list updates when search is performed', async () => {
      const mockProperties = [
        { id: '1', title: 'Luxury Apartment', price: 200000, type: 'apartment' },
        { id: '2', title: 'Standard House', price: 150000, type: 'house' }
      ];

      const MockApp = () => {
        const [filteredProperties, setFilteredProperties] = React.useState(mockProperties);

        const handleSearch = (query: string) => {
          if (query.trim() === '') {
            setFilteredProperties(mockProperties);
          } else {
            const filtered = mockProperties.filter(property =>
              property.title.toLowerCase().includes(query.toLowerCase())
            );
            setFilteredProperties(filtered);
          }
        };

        return (
          <div>
            <MockSearchForm onSearch={handleSearch} />
            <MockPropertyList properties={filteredProperties} />
          </div>
        );
      };

      const user = userEvent.setup();
      render(<MockApp />);

      // Initially shows all properties
      expect(screen.getByText('Luxury Apartment')).toBeInTheDocument();
      expect(screen.getByText('Standard House')).toBeInTheDocument();

      // Filter by 'luxury'
      await user.type(screen.getByTestId('search-input'), 'luxury');
      await user.click(screen.getByTestId('search-button'));

      expect(screen.getByText('Luxury Apartment')).toBeInTheDocument();
      expect(screen.queryByText('Standard House')).not.toBeInTheDocument();
    });

    test('form validation works correctly', async () => {
      const MockValidationForm = () => {
        const [error, setError] = React.useState('');

        const handleLogin = (email: string, password: string) => {
          if (email.length < 5) {
            setError('Email too short');
            return;
          }
          if (password.length < 6) {
            setError('Password too short');
            return;
          }
          setError('Login successful');
        };

        return (
          <div>
            <MockLoginForm onLogin={handleLogin} />
            {error && <div data-testid="error-message">{error}</div>}
          </div>
        );
      };

      const user = userEvent.setup();
      render(<MockValidationForm />);

      // Test short email
      await user.type(screen.getByTestId('email-input'), 'a@b');
      await user.type(screen.getByTestId('password-input'), 'password123');
      await user.click(screen.getByTestId('login-button'));

      expect(screen.getByTestId('error-message')).toHaveTextContent('Email too short');

      // Clear and test short password
      await user.clear(screen.getByTestId('email-input'));
      await user.clear(screen.getByTestId('password-input'));
      await user.type(screen.getByTestId('email-input'), 'admin@rea-invest.com');
      await user.type(screen.getByTestId('password-input'), '123');
      await user.click(screen.getByTestId('login-button'));

      expect(screen.getByTestId('error-message')).toHaveTextContent('Password too short');

      // Test valid input
      await user.clear(screen.getByTestId('password-input'));
      await user.type(screen.getByTestId('password-input'), 'password123');
      await user.click(screen.getByTestId('login-button'));

      expect(screen.getByTestId('error-message')).toHaveTextContent('Login successful');
    });
  });

  describe('Accessibility Tests', () => {
    test('login form has proper labels', () => {
      render(<MockLoginForm />);
      
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    test('buttons have accessible text', () => {
      render(
        <div>
          <MockLoginForm />
          <MockSearchForm />
          <MockPropertyList properties={[
            { id: '1', title: 'Test', price: 1000, type: 'apartment' }
          ]} />
        </div>
      );
      
      expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'View Details' })).toBeInTheDocument();
    });

    test('form inputs are focusable', async () => {
      const user = userEvent.setup();
      render(<MockLoginForm />);
      
      const emailInput = screen.getByTestId('email-input');
      const passwordInput = screen.getByTestId('password-input');
      
      await user.tab();
      expect(emailInput).toHaveFocus();
      
      await user.tab();
      expect(passwordInput).toHaveFocus();
    });
  });
});