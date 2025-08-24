import { db } from '../db';

// External Healthcare Provider API Types
export interface ExternalHealthcareProvider {
  id: string;
  name: string;
  type: 'doctor' | 'nutritionist' | 'fitness_coach' | 'therapist';
  specialty: string;
  practiceName?: string;
  email?: string;
  phone?: string;
  address?: string;
  verified: boolean;
  rating?: number;
  reviewCount?: number;
  location?: {
    latitude: number;
    longitude: number;
  };
  availability?: {
    workingHours: {
      [key: string]: string; // day: hours
    };
    acceptsNewPatients: boolean;
  };
  credentials?: {
    licenseNumber?: string;
    yearsOfExperience?: number;
    education?: string[];
    certifications?: string[];
  };
  services?: string[];
  languages?: string[];
  insuranceAccepted?: string[];
}

export interface ExternalHealthcareAPIResponse {
  providers: ExternalHealthcareProvider[];
  total: number;
  page: number;
  pageSize: number;
}

export interface HealthcareProviderSearchOptions {
  searchTerm?: string;
  type?: 'doctor' | 'nutritionist' | 'fitness_coach' | 'therapist';
  specialty?: string;
  location?: {
    latitude: number;
    longitude: number;
    radius?: number; // in miles
  };
  acceptsNewPatients?: boolean;
  minRating?: number;
  maxResults?: number;
}

export class HealthcareProviderService {
  private readonly API_BASE_URL = process.env.HEALTHCARE_API_URL || 'https://api.healthcareproviders.com/v1';
  private readonly API_KEY = process.env.HEALTHCARE_API_KEY;
  private readonly API_TIMEOUT = 10000; // 10 seconds

  /**
   * Search for healthcare providers using external API
   */
  async searchProviders(options: HealthcareProviderSearchOptions = {}): Promise<ExternalHealthcareAPIResponse> {
    try {
      if (!this.API_KEY) {
        throw new Error('Healthcare API key not configured');
      }

      const params = new URLSearchParams({
        api_key: this.API_KEY,
        page: '1',
        page_size: options.maxResults?.toString() || '20',
        ...this.buildSearchParams(options)
      });

      const response = await fetch(`${this.API_BASE_URL}/providers?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(this.API_TIMEOUT)
      });

      if (!response.ok) {
        throw new Error(`Healthcare API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform external API response to our format
      const providers: ExternalHealthcareProvider[] = data.providers.map((provider: any) => ({
        id: provider.id,
        name: provider.name,
        type: provider.type,
        specialty: provider.specialty,
        practiceName: provider.practice_name,
        email: provider.email,
        phone: provider.phone,
        address: provider.address,
        verified: provider.verified || false,
        rating: provider.rating,
        reviewCount: provider.review_count,
        location: provider.location,
        availability: provider.availability,
        credentials: provider.credentials,
        services: provider.services,
        languages: provider.languages,
        insuranceAccepted: provider.insurance_accepted
      }));

      return {
        providers,
        total: data.total || providers.length,
        page: data.page || 1,
        pageSize: data.page_size || providers.length
      };
    } catch (error) {
      console.error('Error searching healthcare providers:', error);
      throw new Error(`Failed to search healthcare providers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get provider details by ID from external API
   */
  async getProviderById(providerId: string): Promise<ExternalHealthcareProvider | null> {
    try {
      if (!this.API_KEY) {
        throw new Error('Healthcare API key not configured');
      }

      const response = await fetch(`${this.API_BASE_URL}/providers/${providerId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.API_KEY}`
        },
        signal: AbortSignal.timeout(this.API_TIMEOUT)
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Healthcare API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        id: data.id,
        name: data.name,
        type: data.type,
        specialty: data.specialty,
        practiceName: data.practice_name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        verified: data.verified || false,
        rating: data.rating,
        reviewCount: data.review_count,
        location: data.location,
        availability: data.availability,
        credentials: data.credentials,
        services: data.services,
        languages: data.languages,
        insuranceAccepted: data.insurance_accepted
      };
    } catch (error) {
      console.error('Error getting provider by ID:', error);
      throw new Error(`Failed to get provider by ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get provider availability for booking
   */
  async getProviderAvailability(providerId: string, dateRange: { start: Date; end: Date }) {
    try {
      if (!this.API_KEY) {
        throw new Error('Healthcare API key not configured');
      }

      const params = new URLSearchParams({
        api_key: this.API_KEY,
        start_date: dateRange.start.toISOString().split('T')[0],
        end_date: dateRange.end.toISOString().split('T')[0]
      });

      const response = await fetch(`${this.API_BASE_URL}/providers/${providerId}/availability?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(this.API_TIMEOUT)
      });

      if (!response.ok) {
        throw new Error(`Healthcare API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting provider availability:', error);
      throw new Error(`Failed to get provider availability: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Book a session with a healthcare provider
   */
  async bookSession(userId: number, providerId: string, sessionData: {
    type: 'consultation' | 'follow_up' | 'emergency' | 'routine_check';
    preferredDate: Date;
    duration: number;
    reason: string;
    insurance?: string;
  }) {
    try {
      if (!this.API_KEY) {
        throw new Error('Healthcare API key not configured');
      }

      const response = await fetch(`${this.API_BASE_URL}/providers/${providerId}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.API_KEY}`
        },
        body: JSON.stringify({
          user_id: userId,
          ...sessionData,
          api_key: this.API_KEY
        }),
        signal: AbortSignal.timeout(this.API_TIMEOUT)
      });

      if (!response.ok) {
        throw new Error(`Healthcare API error: ${response.status} ${response.statusText}`);
      }

      const bookingData = await response.json();
      
      // Save booking to our database
      const result = await db.execute(
        `INSERT INTO healthcare_integration
         (user_id, professional_id, professional_name, professional_type, practice_name, access_level, data_sharing_consent, shared_data, notes, created_at, updated_at)
         VALUES (${userId}, '${providerId}', '${bookingData.provider_name}', 'doctor', '${bookingData.practice_name}', 'read_only', true, '${JSON.stringify({
          bookingId: bookingData.id,
          bookingDate: sessionData.preferredDate.toISOString(),
          duration: sessionData.duration,
          reason: sessionData.reason,
          status: 'confirmed'
        })}', 'Booking confirmed for ${sessionData.type} on ${sessionData.preferredDate.toISOString()}', '${new Date().toISOString()}', '${new Date().toISOString()}')`
      );

      return {
        id: (result as any).insertId,
        externalBookingId: bookingData.id,
        confirmationNumber: bookingData.confirmation_number,
        user_id: userId,
        professional_id: providerId,
        professional_name: bookingData.provider_name,
        professional_type: 'doctor',
        practice_name: bookingData.practice_name,
        access_level: 'read_only',
        data_sharing_consent: true,
        shared_data: {
          bookingId: bookingData.id,
          bookingDate: sessionData.preferredDate.toISOString(),
          duration: sessionData.duration,
          reason: sessionData.reason,
          status: 'confirmed'
        },
        notes: `Booking confirmed for ${sessionData.type} on ${sessionData.preferredDate.toISOString()}`,
        created_at: new Date(),
        updated_at: new Date()
      };
    } catch (error) {
      console.error('Error booking session:', error);
      throw new Error(`Failed to book session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user's booking history
   */
  async getUserBookingHistory(userId: number) {
    try {
      const [bookings] = await db.execute(
        `SELECT * FROM healthcare_integration
         WHERE user_id = ${userId} AND shared_data IS NOT NULL
         ORDER BY created_at DESC`
      );

      return bookings;
    } catch (error) {
      console.error('Error getting user booking history:', error);
      throw new Error(`Failed to get booking history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Cancel a booking
   */
  async cancelBooking(userId: number, bookingId: string) {
    try {
      if (!this.API_KEY) {
        throw new Error('Healthcare API key not configured');
      }

      const response = await fetch(`${this.API_BASE_URL}/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.API_KEY}`
        },
        body: JSON.stringify({
          api_key: this.API_KEY,
          reason: 'User requested cancellation'
        }),
        signal: AbortSignal.timeout(this.API_TIMEOUT)
      });

      if (!response.ok) {
        throw new Error(`Healthcare API error: ${response.status} ${response.statusText}`);
      }

      // Update our database record
      await db.execute(
        `UPDATE healthcare_integration
         SET shared_data = '{"status": "cancelled", "cancelled_at": "${new Date().toISOString()}"}',
             updated_at = '${new Date().toISOString()}'
         WHERE id = ${parseInt(bookingId)} AND user_id = ${userId}`
      );

      // Return the updated booking info
      return { id: parseInt(bookingId), status: 'cancelled' };
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw new Error(`Failed to cancel booking: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get provider reviews and ratings
   */
  async getProviderReviews(providerId: string) {
    try {
      if (!this.API_KEY) {
        throw new Error('Healthcare API key not configured');
      }

      const response = await fetch(`${this.API_BASE_URL}/providers/${providerId}/reviews`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.API_KEY}`
        },
        signal: AbortSignal.timeout(this.API_TIMEOUT)
      });

      if (!response.ok) {
        throw new Error(`Healthcare API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting provider reviews:', error);
      throw new Error(`Failed to get provider reviews: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Submit a review for a provider
   */
  async submitReview(userId: number, providerId: string, review: {
    rating: number;
    comment: string;
    visitDate: Date;
    serviceType: string;
  }) {
    try {
      if (!this.API_KEY) {
        throw new Error('Healthcare API key not configured');
      }

      const response = await fetch(`${this.API_BASE_URL}/providers/${providerId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.API_KEY}`
        },
        body: JSON.stringify({
          user_id: userId,
          ...review,
          api_key: this.API_KEY
        }),
        signal: AbortSignal.timeout(this.API_TIMEOUT)
      });

      if (!response.ok) {
        throw new Error(`Healthcare API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error submitting review:', error);
      throw new Error(`Failed to submit review: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get provider credentials verification
   */
  async verifyProviderCredentials(providerId: string) {
    try {
      if (!this.API_KEY) {
        throw new Error('Healthcare API key not configured');
      }

      const response = await fetch(`${this.API_BASE_URL}/providers/${providerId}/credentials/verify`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.API_KEY}`
        },
        signal: AbortSignal.timeout(this.API_TIMEOUT)
      });

      if (!response.ok) {
        throw new Error(`Healthcare API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error verifying provider credentials:', error);
      throw new Error(`Failed to verify provider credentials: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get insurance accepted by provider
   */
  async getProviderInsurance(providerId: string) {
    try {
      if (!this.API_KEY) {
        throw new Error('Healthcare API key not configured');
      }

      const response = await fetch(`${this.API_BASE_URL}/providers/${providerId}/insurance`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.API_KEY}`
        },
        signal: AbortSignal.timeout(this.API_TIMEOUT)
      });

      if (!response.ok) {
        throw new Error(`Healthcare API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting provider insurance:', error);
      throw new Error(`Failed to get provider insurance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build search parameters for API request
   */
  private buildSearchParams(options: HealthcareProviderSearchOptions): Record<string, string> {
    const params: Record<string, string> = {};

    if (options.searchTerm) {
      params.search = options.searchTerm;
    }

    if (options.type) {
      params.type = options.type;
    }

    if (options.specialty) {
      params.specialty = options.specialty;
    }

    if (options.location) {
      params.latitude = options.location.latitude.toString();
      params.longitude = options.location.longitude.toString();
      params.radius = options.location.radius?.toString() || '10';
    }

    if (options.acceptsNewPatients !== undefined) {
      params.accepts_new_patients = options.acceptsNewPatients.toString();
    }

    if (options.minRating) {
      params.min_rating = options.minRating.toString();
    }

    return params;
  }

  /**
   * Fallback method to get providers from database when API is unavailable
   */
  async getFallbackProviders(searchTerm?: string, type?: string): Promise<ExternalHealthcareProvider[]> {
    try {
      // This would query a local database of providers as fallback
      // For now, return a minimal set of providers
      const fallbackProviders: ExternalHealthcareProvider[] = [
        {
          id: 'fallback_doc_001',
          name: 'Dr. Sarah Johnson',
          type: 'doctor',
          specialty: 'General Practice',
          practiceName: 'Family Health Clinic',
          email: 'sarah.johnson@familyhealth.com',
          phone: '+1 (555) 123-4567',
          address: '123 Main St, Anytown, USA',
          verified: true,
          rating: 4.8,
          reviewCount: 156,
          services: ['General Checkups', 'Preventive Care', 'Chronic Disease Management'],
          languages: ['English', 'Spanish']
        },
        {
          id: 'fallback_nut_001',
          name: 'Dr. Michael Chen',
          type: 'nutritionist',
          specialty: 'Sports Nutrition',
          practiceName: 'Performance Nutrition Center',
          email: 'michael.chen@performancenutrition.com',
          phone: '+1 (555) 234-5678',
          address: '456 Oak Ave, Anytown, USA',
          verified: true,
          rating: 4.9,
          reviewCount: 89,
          services: ['Sports Nutrition', 'Weight Management', 'Meal Planning'],
          languages: ['English', 'Mandarin']
        }
      ];

      let filteredProviders = fallbackProviders;

      if (searchTerm) {
        filteredProviders = fallbackProviders.filter(provider =>
          provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          provider.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
          provider.practiceName?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (type) {
        filteredProviders = filteredProviders.filter(provider => provider.type === type);
      }

      return filteredProviders;
    } catch (error) {
      console.error('Error in fallback provider search:', error);
      throw new Error(`Failed to search providers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Export singleton instance
export const healthcareProviderService = new HealthcareProviderService();
export default healthcareProviderService;