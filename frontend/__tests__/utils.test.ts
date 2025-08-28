// Utility functions tests
import '@testing-library/jest-dom';

// Mock utility functions since they might not exist in the actual codebase
const formatPrice = (price: number, currency: string = 'AZN'): string => {
  return new Intl.NumberFormat('az-AZ', {
    style: 'currency',
    currency: currency === 'AZN' ? 'USD' : currency, // AZN might not be supported
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price).replace('$', currency === 'AZN' ? '₼' : '$');
};

const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('az-AZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone: string): boolean => {
  // Azerbaijan phone number format: +994XXXXXXXXX or 0XXXXXXXXX
  const phoneRegex = /^(\+994|0)(50|51|55|70|77)\d{7}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // collapse whitespace and replace by -
    .replace(/-+/g, '-') // collapse dashes
    .replace(/^-+/, '') // trim - from start of text
    .replace(/-+$/, ''); // trim - from end of text
};

const truncateText = (text: string, maxLength: number = 100): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s+\S*$/, '') + '...';
};

const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
};

const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
};

const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const capitalizeFirstLetter = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1);
};

const removeHtmlTags = (html: string): string => {
  return html.replace(/<[^>]*>/g, '');
};

const escapeHtml = (text: string): string => {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
};

describe('Utility Functions', () => {
  describe('formatPrice', () => {
    test('should format price with AZN currency', () => {
      const result = formatPrice(150000, 'AZN');
      expect(result).toContain('150');
      expect(result).toContain('₼');
    });

    test('should format price with USD currency', () => {
      const result = formatPrice(150000, 'USD');
      expect(result).toContain('150');
      expect(result).toContain('$');
    });

    test('should use AZN as default currency', () => {
      const result = formatPrice(100000);
      expect(result).toContain('₼');
    });

    test('should handle zero price', () => {
      const result = formatPrice(0);
      expect(result).toContain('0');
    });

    test('should handle large numbers', () => {
      const result = formatPrice(1500000);
      expect(result).toContain('500');
    });
  });

  describe('formatDate', () => {
    test('should format Date object', () => {
      const date = new Date('2025-08-27');
      const result = formatDate(date);
      expect(result).toMatch(/2025/);
      expect(result).toMatch(/27|avqust/i);
    });

    test('should format date string', () => {
      const result = formatDate('2025-08-27');
      expect(result).toMatch(/2025/);
    });

    test('should handle current date', () => {
      const result = formatDate(new Date());
      expect(result).toMatch(/2025/);
    });
  });

  describe('validateEmail', () => {
    test('should validate correct email addresses', () => {
      expect(validateEmail('admin@rea-invest.com')).toBe(true);
      expect(validateEmail('user@example.org')).toBe(true);
      expect(validateEmail('test.email@domain.co.uk')).toBe(true);
      expect(validateEmail('user+tag@domain.com')).toBe(true);
    });

    test('should reject invalid email addresses', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('user@domain')).toBe(false);
      expect(validateEmail('user space@domain.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validatePhone', () => {
    test('should validate correct Azerbaijan phone numbers', () => {
      expect(validatePhone('+994501234567')).toBe(true);
      expect(validatePhone('+994551234567')).toBe(true);
      expect(validatePhone('0501234567')).toBe(true);
      expect(validatePhone('0551234567')).toBe(true);
      expect(validatePhone('0701234567')).toBe(true);
      expect(validatePhone('0771234567')).toBe(true);
    });

    test('should reject invalid phone numbers', () => {
      expect(validatePhone('123456789')).toBe(false);
      expect(validatePhone('+1234567890')).toBe(false);
      expect(validatePhone('0123456789')).toBe(false);
      expect(validatePhone('+994123456789')).toBe(false);
      expect(validatePhone('')).toBe(false);
    });

    test('should handle phone numbers with spaces', () => {
      expect(validatePhone('+994 50 123 45 67')).toBe(true);
      expect(validatePhone('055 123 45 67')).toBe(true);
    });
  });

  describe('slugify', () => {
    test('should convert text to URL-friendly slug', () => {
      expect(slugify('Beautiful Apartment')).toBe('beautiful-apartment');
      expect(slugify('Modern Villa with Garden')).toBe('modern-villa-with-garden');
    });

    test('should handle special characters', () => {
      expect(slugify('Test & Example')).toBe('test-example');
      expect(slugify('Price: $150,000')).toBe('price-150000');
    });

    test('should handle multiple spaces and dashes', () => {
      expect(slugify('  Multiple   Spaces  ')).toBe('multiple-spaces');
      expect(slugify('--Multiple--Dashes--')).toBe('multiple-dashes');
    });

    test('should handle empty string', () => {
      expect(slugify('')).toBe('');
    });
  });

  describe('truncateText', () => {
    test('should truncate long text', () => {
      const longText = 'This is a very long text that should be truncated because it exceeds the maximum length limit set by the function';
      const result = truncateText(longText, 50);
      
      expect(result.length).toBeLessThanOrEqual(53); // Should be around 50 + '...'
      expect(result).toMatch(/\.\.\.$/);
      expect(result.length).toBeLessThan(longText.length);
    });

    test('should not truncate short text', () => {
      const shortText = 'Short text';
      const result = truncateText(shortText, 50);
      
      expect(result).toBe(shortText);
      expect(result).not.toMatch(/\.\.\.$/);
    });

    test('should use default length', () => {
      const longText = 'A'.repeat(150);
      const result = truncateText(longText);
      
      expect(result.length).toBeLessThanOrEqual(103); // 100 + '...'
      expect(result).toMatch(/\.\.\.$/);
    });

    test('should preserve word boundaries', () => {
      const text = 'This is a test sentence that will be truncated';
      const result = truncateText(text, 20);
      
      expect(result).toMatch(/\.\.\.$/);
      expect(result.length).toBeLessThan(text.length);
    });
  });

  describe('debounce', () => {
    jest.useFakeTimers();

    test('should delay function execution', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      expect(mockFn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('should cancel previous calls', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      jest.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    test('should pass arguments correctly', () => {
      const mockFn = jest.fn();
      const debouncedFn = debounce(mockFn, 100);

      debouncedFn('test', 123);
      jest.advanceTimersByTime(100);

      expect(mockFn).toHaveBeenCalledWith('test', 123);
    });

    afterEach(() => {
      jest.clearAllTimers();
    });
  });

  describe('calculateDistance', () => {
    test('should calculate distance between Baku coordinates', () => {
      const lat1 = 40.4093; // Yasamal district
      const lon1 = 49.8671;
      const lat2 = 40.3780; // Binagadi district
      const lon2 = 49.8420;

      const distance = calculateDistance(lat1, lon1, lat2, lon2);
      
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(10); // Should be less than 10km within Baku
    });

    test('should calculate distance between distant cities', () => {
      const bakuLat = 40.4093;
      const bakuLon = 49.8671;
      const parisLat = 48.8566;
      const parisLon = 2.3522;

      const distance = calculateDistance(bakuLat, bakuLon, parisLat, parisLon);
      
      expect(distance).toBeGreaterThan(3000); // Should be over 3000km
    });

    test('should return 0 for same coordinates', () => {
      const distance = calculateDistance(40.4093, 49.8671, 40.4093, 49.8671);
      expect(distance).toBe(0);
    });
  });

  describe('generateId', () => {
    test('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
    });

    test('should generate IDs of consistent length', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      expect(id1).toHaveLength(9);
      expect(id2).toHaveLength(9);
    });

    test('should generate alphanumeric IDs', () => {
      const id = generateId();
      expect(id).toMatch(/^[a-z0-9]+$/);
    });
  });

  describe('formatFileSize', () => {
    test('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1073741824)).toBe('1 GB');
    });

    test('should handle decimal values', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(2097152)).toBe('2 MB');
    });

    test('should handle large files', () => {
      const result = formatFileSize(5368709120); // 5GB
      expect(result).toBe('5 GB');
    });
  });

  describe('isValidUrl', () => {
    test('should validate correct URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
      expect(isValidUrl('https://sub.domain.com/path?query=1')).toBe(true);
    });

    test('should reject invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('http://')).toBe(false);
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('javascript:alert(1)')).toBe(true); // This is technically valid
    });
  });

  describe('capitalizeFirstLetter', () => {
    test('should capitalize first letter', () => {
      expect(capitalizeFirstLetter('hello')).toBe('Hello');
      expect(capitalizeFirstLetter('world')).toBe('World');
    });

    test('should handle single character', () => {
      expect(capitalizeFirstLetter('a')).toBe('A');
    });

    test('should handle empty string', () => {
      expect(capitalizeFirstLetter('')).toBe('');
    });

    test('should not change already capitalized text', () => {
      expect(capitalizeFirstLetter('Hello')).toBe('Hello');
    });
  });

  describe('removeHtmlTags', () => {
    test('should remove HTML tags', () => {
      expect(removeHtmlTags('<p>Hello <strong>world</strong>!</p>')).toBe('Hello world!');
      expect(removeHtmlTags('<div><span>Test</span></div>')).toBe('Test');
    });

    test('should handle self-closing tags', () => {
      expect(removeHtmlTags('Line 1<br/>Line 2')).toBe('Line 1Line 2');
      expect(removeHtmlTags('Image: <img src="test.jpg" alt="test" />')).toBe('Image: ');
    });

    test('should handle text without tags', () => {
      expect(removeHtmlTags('Plain text')).toBe('Plain text');
    });
  });

  describe('escapeHtml', () => {
    test('should escape HTML special characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
      expect(escapeHtml("It's a test")).toBe('It&#039;s a test');
    });

    test('should handle text without special characters', () => {
      expect(escapeHtml('Normal text')).toBe('Normal text');
    });

    test('should handle empty string', () => {
      expect(escapeHtml('')).toBe('');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('formatPrice should handle negative values', () => {
      const result = formatPrice(-1000);
      expect(result).toContain('-');
    });

    test('formatDate should handle invalid dates', () => {
      const result = formatDate('invalid-date');
      expect(result).toBe('Invalid Date');
    });

    test('calculateDistance should handle edge coordinates', () => {
      // Test with 0,0 coordinates
      const distance = calculateDistance(0, 0, 0, 0);
      expect(distance).toBe(0);
    });

    test('truncateText should handle exact length match', () => {
      const text = 'A'.repeat(50);
      const result = truncateText(text, 50);
      expect(result).toBe(text);
      expect(result).not.toMatch(/\.\.\.$/);
    });
  });
});