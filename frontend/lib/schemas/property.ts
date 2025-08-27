import { z } from 'zod';

// Base property schema
const basePropertySchema = z.object({
  // Basic info
  property_category: z.enum(['residential', 'commercial'], {
    errorMap: () => ({ message: 'Əmlak kateqoriyası seçilməlidir' })
  }),
  property_subcategory: z.string().min(1, 'Əmlak alt kateqoriyası daxil edilməlidir').max(50),
  construction_type: z.enum(['new', 'old', 'under_construction']).optional(),
  
  // Physical specs
  area_m2: z.number().positive('Sahə 0-dan böyük olmalıdır'),
  floor: z.number().int().min(0).optional(),
  floors_total: z.number().int().min(1).optional(),
  room_count: z.string().optional(),
  height: z.number().positive().optional(),
  
  // Location
  district_id: z.string().uuid().optional(),
  street_id: z.string().uuid().optional(),
  complex_id: z.string().uuid().optional(),
  complex_manual: z.string().max(100).optional(),
  building: z.string().max(50).optional(),
  apt_no: z.string().max(20).optional(),
  block: z.string().max(20).optional(),
  entrance_door: z.number().int().min(1).optional(),
  address: z.string().max(500).optional(),
  
  // Business
  category: z.enum(['sale', 'rent'], {
    errorMap: () => ({ message: 'Satış/İcarə növü seçilməlidir' })
  }),
  listing_type: z.enum(['agency_owned', 'branch_owned', 'brokerage'], {
    errorMap: () => ({ message: 'Mülkiyyət növü seçilməlidir' })
  }),
  
  // Features
  is_renovated: z.boolean().default(false),
  features: z.array(z.string()).default([]),
  description: z.string().max(2000).optional(),
  
  // Media
  images: z.array(z.any()).default([]),
  videos: z.array(z.any()).default([]),
  documents: z.array(z.any()).default([]),
});

// Agency/Branch owned specific fields
const agencyOwnedSchema = basePropertySchema.extend({
  buy_price_azn: z.number().positive('Alış qiyməti məcburidir və müsbət olmalıdır'),
  sell_price_azn: z.number().positive().optional(),
  rent_price_monthly_azn: z.number().positive().optional(),
});

// Brokerage specific fields  
const brokerageSchema = basePropertySchema.extend({
  owner_first_name: z.string().min(1, 'Malik adı məcburidir').max(50),
  owner_last_name: z.string().min(1, 'Malik soyadı məcburidir').max(50),
  owner_contact: z.string().min(1, 'Malik əlaqə məlumatı məcburidir').max(100),
  brokerage_commission_percent: z.number().min(0.1).max(50, 'Komissiya 50%-dən çox ola bilməz'),
  sell_price_azn: z.number().positive().optional(),
  rent_price_monthly_azn: z.number().positive().optional(),
});

// Dynamic schema based on listing_type
export const propertySchema = z.discriminatedUnion('listing_type', [
  agencyOwnedSchema.extend({
    listing_type: z.literal('agency_owned')
  }),
  agencyOwnedSchema.extend({
    listing_type: z.literal('branch_owned')
  }),
  brokerageSchema.extend({
    listing_type: z.literal('brokerage')
  })
]);

// Form schema for create/edit operations
export const propertyFormSchema = propertySchema.extend({
  // Additional frontend-only fields
  save_as_draft: z.boolean().default(false),
  auto_generate_code: z.boolean().default(true),
});

export type PropertyFormData = z.infer<typeof propertyFormSchema>;
export type PropertyData = z.infer<typeof propertySchema>;

// Validation helpers
export const validatePropertyForm = (data: Partial<PropertyFormData>) => {
  try {
    propertyFormSchema.parse(data);
    return { success: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {};
      error.errors.forEach((err) => {
        if (err.path.length > 0) {
          fieldErrors[err.path.join('.')] = err.message;
        }
      });
      return { success: false, errors: fieldErrors };
    }
    return { success: false, errors: { general: 'Validation failed' } };
  }
};

// Default values for form
export const getPropertyFormDefaults = (): Partial<PropertyFormData> => ({
  property_category: 'residential',
  category: 'sale',
  listing_type: 'agency_owned',
  is_renovated: false,
  features: [],
  images: [],
  videos: [],
  documents: [],
  save_as_draft: false,
  auto_generate_code: true,
});

// Field visibility based on listing type
export const getVisibleFields = (listingType: string) => ({
  agencyFields: ['agency_owned', 'branch_owned'].includes(listingType),
  brokerageFields: listingType === 'brokerage',
  pricingFields: {
    buyPrice: ['agency_owned', 'branch_owned'].includes(listingType),
    sellPrice: true, // All types can have sell price
    rentPrice: true, // All types can have rent price
    commission: listingType === 'brokerage',
    ownerInfo: listingType === 'brokerage'
  }
});