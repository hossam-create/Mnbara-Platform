import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useTranslation } from 'react-i18next';

interface TravelerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Sample country data - will be replaced with API later
const COUNTRIES = [
  'United States', 'United Kingdom', 'Germany', 'France', 'Italy', 'Spain',
  'Canada', 'Australia', 'Japan', 'China', 'India', 'Brazil', 'Egypt',
  'Saudi Arabia', 'UAE', 'Turkey', 'South Korea', 'Mexico', 'Netherlands'
].sort();

export default function TravelerModal({ isOpen, onClose }: TravelerModalProps) {
  const { t } = useTranslation();
  const [fromCountry, setFromCountry] = useState('');
  const [toCountry, setToCountry] = useState('');
  const [travelDate, setTravelDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Add backend integration for trip submission
    console.log('Trip submitted:', { fromCountry, toCountry, travelDate });
    
    // Reset form and close modal
    setFromCountry('');
    setToCountry('');
    setTravelDate('');
    onClose();
  };

  const minDate = new Date().toISOString().split('T')[0]; // Today's date

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[150]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <Dialog.Title
                  as="h3"
                  className="text-lg font-semibold leading-6 text-gray-900 mb-1"
                >
                  {t('modals.traveler.title')}
                </Dialog.Title>
                <p className="text-sm text-gray-600 mb-6">
                  {t('modals.traveler.subtitle')}
                </p>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* From Country */}
                  <div>
                    <label
                      htmlFor="from-country"
                      className="block text-sm font-medium text-gray-700 mb-1.5"
                    >
                      {t('modals.traveler.labelFrom')}
                    </label>
                    <select
                      id="from-country"
                      value={fromCountry}
                      onChange={(e) => setFromCountry(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all"
                      required
                    >
                      <option value="">{t('modals.pasteLink.selectCountry')}</option>
                      {COUNTRIES.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* To Country */}
                  <div>
                    <label
                      htmlFor="to-country"
                      className="block text-sm font-medium text-gray-700 mb-1.5"
                    >
                      {t('modals.traveler.labelTo')}
                    </label>
                    <select
                      id="to-country"
                      value={toCountry}
                      onChange={(e) => setToCountry(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all"
                      required
                    >
                      <option value="">{t('modals.pasteLink.selectCountry')}</option>
                      {COUNTRIES.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Travel Date */}
                  <div>
                    <label
                      htmlFor="travel-date"
                      className="block text-sm font-medium text-gray-700 mb-1.5"
                    >
                      {t('modals.traveler.labelDate')}
                    </label>
                    <input
                      type="date"
                      id="travel-date"
                      value={travelDate}
                      onChange={(e) => setTravelDate(e.target.value)}
                      min={minDate}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                    >
                      {t('modals.traveler.cancel')}
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-brand-blue hover:bg-brand-blueDark rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2"
                    >
                      {t('modals.traveler.submit')}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
