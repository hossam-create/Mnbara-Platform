import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MainLayout from '../../layouts/MainLayout';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useAuth } from '../../hooks/useAuth';

export default function TripCreationPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    destination: '',
    departureDate: '',
    returnDate: '',
    tripType: 'vacation',
    maxItems: 5,
    notes: ''
  });

  const countries = [
    'Colombia', 'Switzerland', 'Italy', 'Japan', 'France', 'Germany', 
    'Belgium', 'Netherlands', 'Spain', 'United Kingdom', 'United States',
    'Canada', 'Mexico', 'Brazil', 'Argentina', 'Australia', 'New Zealand'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      alert('Trip created successfully! You can now browse available orders.');
      navigate('/traveler');
    }, 2000);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Create Trip</h1>
            <p className="text-gray-600 mb-6">Please sign in to create a trip</p>
            <Link to="/auth/login">
              <Button>Sign In</Button>
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link to="/traveler">
            <Button variant="outline" size="sm">← Back to Dashboard</Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create New Trip</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Trip Form */}
          <div className="lg:col-span-2">
            <Card className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="destination">Destination Country</Label>
                  <Select 
                    value={formData.destination} 
                    onValueChange={(value) => handleInputChange('destination', value)}
                  >
                    <SelectTrigger id="destination">
                      <SelectValue placeholder="Select destination country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="departureDate">Departure Date</Label>
                    <Input
                      id="departureDate"
                      type="date"
                      value={formData.departureDate}
                      onChange={(e) => handleInputChange('departureDate', e.target.value)}
                      required
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label htmlFor="returnDate">Return Date</Label>
                    <Input
                      id="returnDate"
                      type="date"
                      value={formData.returnDate}
                      onChange={(e) => handleInputChange('returnDate', e.target.value)}
                      required
                      min={formData.departureDate || new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="tripType">Trip Type</Label>
                  <Select 
                    value={formData.tripType} 
                    onValueChange={(value) => handleInputChange('tripType', value)}
                  >
                    <SelectTrigger id="tripType">
                      <SelectValue placeholder="Select trip type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vacation">Vacation</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="family">Family Visit</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="maxItems">Maximum Items You Can Carry</Label>
                  <Input
                    id="maxItems"
                    type="number"
                    min="1"
                    max="20"
                    value={formData.maxItems}
                    onChange={(e) => handleInputChange('maxItems', parseInt(e.target.value))}
                    required
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Consider your luggage space and airline restrictions
                  </p>
                </div>

                <div>
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <textarea
                    id="notes"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Any special requirements, preferences, or notes about your trip..."
                  />
                </div>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Trip...
                    </>
                  ) : (
                    'Create Trip'
                  )}
                </Button>
              </form>
            </Card>
          </div>

          {/* Trip Guidelines */}
          <div>
            <Card className="p-6 sticky top-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Traveler Guidelines</h3>
              
              <div className="space-y-4 text-sm text-gray-600">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">✅ What You Can Carry</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Personal items and gifts</li>
                    <li>Small electronics (phones, tablets)</li>
                    <li>Clothing and accessories</li>
                    <li>Non-perishable food items</li>
                    <li>Books and documents</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">❌ What You Cannot Carry</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Perishable foods</li>
                    <li>Illegal or restricted items</li>
                    <li>Large electronics (TVs, computers)</li>
                    <li>Fragile items without proper packaging</li>
                    <li>Items requiring special permits</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">💰 How You Earn</h4>
                  <p>
                    You earn money by delivering items for buyers. Each delivery has a service fee 
                    that goes to you as compensation for your time and effort.
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">📋 Important Notes</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Always declare items at customs</li>
                    <li>Keep receipts for any items you deliver</li>
                    <li>Communicate with buyers throughout the process</li>
                    <li>Follow all airline and customs regulations</li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Tip:</strong> Plan your trip early to give buyers enough time to place orders. 
                  Popular destinations often have many available orders!
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}