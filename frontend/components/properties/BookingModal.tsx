'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, Clock, User, Phone, Mail, DollarSign, FileText, Loader2, AlertTriangle } from 'lucide-react';
import { bookingsApi } from '@/lib/api/bookings';

const bookingSchema = z.object({
  customer_first_name: z.string().min(2, 'Ad ən azı 2 simvol olmalıdır').max(50),
  customer_last_name: z.string().min(2, 'Soyad ən azı 2 simvol olmalıdır').max(50),
  customer_phone: z.string().min(10, 'Telefon nömrəsi düzgün deyil').max(20),
  customer_email: z.string().email('Email düzgün formatda deyil').optional().or(z.literal('')),
  booking_date: z.string().min(1, 'Booking tarixi seçilməlidir'),
  expiry_date: z.string().min(1, 'Bitmə tarixi seçilməlidir'),
  booking_amount: z.number().min(0, 'Məbləğ mənfi ola bilməz').optional(),
  notes: z.string().max(500, 'Qeydlər 500 simvoldan çox ola bilməz').optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

interface BookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  property: any;
  onSuccess: (booking: any) => void;
  onError: (error: string) => void;
}

export default function BookingModal({
  open,
  onOpenChange,
  propertyId,
  property,
  onSuccess,
  onError
}: BookingModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      customer_first_name: '',
      customer_last_name: '',
      customer_phone: '',
      customer_email: '',
      booking_date: new Date().toISOString().split('T')[0],
      expiry_date: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString().split('T')[0], // 72 hours from now
      booking_amount: 0,
      notes: '',
    },
  });

  const handleSubmit = async (data: BookingFormData) => {
    try {
      setIsSubmitting(true);
      setError('');

      // Validate dates
      const bookingDate = new Date(data.booking_date);
      const expiryDate = new Date(data.expiry_date);
      const now = new Date();

      if (bookingDate < now) {
        setError('Booking tarixi keçmiş ola bilməz');
        return;
      }

      if (expiryDate <= bookingDate) {
        setError('Bitmə tarixi booking tarixindən sonra olmalıdır');
        return;
      }

      // Add time to dates
      const bookingDateTime = `${data.booking_date}T09:00:00`;
      const expiryDateTime = `${data.expiry_date}T18:00:00`;

      const bookingData = {
        ...data,
        booking_date: bookingDateTime,
        expiry_date: expiryDateTime,
        booking_amount: data.booking_amount || undefined,
        customer_email: data.customer_email || undefined,
        notes: data.notes || undefined,
      };

      const result = await bookingsApi.createForProperty(propertyId, bookingData);

      if (result.success) {
        onSuccess(result.data.booking);
        form.reset();
      } else {
        throw new Error(result.error?.message || 'Booking yaradıla bilmədi');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Booking yaradılarkən xəta baş verdi';
      setError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      form.reset();
      setError('');
      onOpenChange(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('az-AZ', {
      style: 'currency',
      currency: 'AZN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const calculateBookingDuration = () => {
    const bookingDate = form.watch('booking_date');
    const expiryDate = form.watch('expiry_date');
    
    if (bookingDate && expiryDate) {
      const start = new Date(bookingDate);
      const end = new Date(expiryDate);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 0) {
        return `${diffDays} gün`;
      }
    }
    
    return null;
  };

  const duration = calculateBookingDuration();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Əmlak Booking Et
          </DialogTitle>
          <DialogDescription>
            <strong>{property?.property_code}</strong> kodlu əmlak üçün booking yaradın
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Property Summary */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Əmlak:</span> {property?.property_subcategory}
            </div>
            <div>
              <span className="font-medium">Sahə:</span> {property?.area_m2} m²
            </div>
            <div>
              <span className="font-medium">Ünvan:</span> {property?.district_name || 'N/A'}
            </div>
            <div>
              <span className="font-medium">Qiymət:</span> 
              {property?.sell_price_azn ? formatPrice(property.sell_price_azn) : 
               property?.rent_price_monthly_azn ? `${formatPrice(property.rent_price_monthly_azn)}/ay` : 
               'Qiymət təyin edilməyib'}
            </div>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Customer Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <User className="h-5 w-5 mr-2" />
                Müştəri Məlumatları
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customer_first_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Müştəri Adı *</FormLabel>
                      <FormControl>
                        <Input placeholder="Əli" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customer_last_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Müştəri Soyadı *</FormLabel>
                      <FormControl>
                        <Input placeholder="Əliyev" {...field} disabled={isSubmitting} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customer_phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefon Nömrəsi *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="+994501234567" 
                          {...field} 
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customer_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (İxtiyari)</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="ali@example.com" 
                          {...field} 
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Booking Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Booking Detalları
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="booking_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Booking Tarixi *</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          disabled={isSubmitting}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </FormControl>
                      <FormDescription>Booking-in başlayacağı tarix</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expiry_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bitmə Tarixi *</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          disabled={isSubmitting}
                          min={form.watch('booking_date')}
                        />
                      </FormControl>
                      <FormDescription>
                        {duration ? `Müddət: ${duration}` : 'Booking-in bitəcəyi tarix'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="booking_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Booking Məbləği (AZN)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="1000" 
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      İxtiyari - müştəridən alınacaq booking məbləği
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qeydlər</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Booking ilə bağlı əlavə qeydlər..."
                        className="min-h-[80px]"
                        {...field} 
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      Müştəri ilə bağlı əlavə məlumatlar (maksimum 500 simvol)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Important Notice */}
            <Alert className="border-blue-200 bg-blue-50">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Diqqət:</strong> Booking yaradıldıqdan sonra əmlak müvəqqəti olaraq 
                rezerv ediləcək və digər agentlər tərəfindən booking edilə bilməyəcək.
                Booking müddəti bitəndə əmlak yenidən sərbəst olacaq.
              </AlertDescription>
            </Alert>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-3 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Ləğv et
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Booking yaradılır...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4 mr-2" />
                    Booking yarat
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}