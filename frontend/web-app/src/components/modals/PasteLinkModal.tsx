import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useTranslation } from 'react-i18next';

interface PasteLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Sample country data - will be replaced with API later
const COUNTRIES = [
  'United States', 'United Kingdom', 'Germany', 'France', 'Italy', 'Spain',
  'Canada', 'Australia', 'Japan', 'China', 'India', 'Brazil', 'Egypt',
  'Saudi Arabia', 'UAE', 'Turkey', 'South Korea', 'Mexico', 'Netherlands'
].sort();

export default function PasteLinkModal({ isOpen, onClose }: PasteLinkModalProps) {
  const { t } = useTranslation();
  const [productLink, setProductLink] = useState('');
  const [destinationCountry, setDestinationCountry] = useState('');
  const [linkError, setLinkError] = useState('');

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLinkError('');

    // Validate URL
    if (!validateUrl(productLink)) {
      setLinkError(t('modals.pasteLink.errorLink'));
      return;
    }

    // TODO: Add backend integration for purchase request submission
    console.log('Purchase request submitted:', { productLink, destinationCountry });
    
    // Reset form and close modal
    setProductLink('');
    setDestinationCountry('');
    setLinkError('');
    onClose();
  };

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
                  {t('modals.pasteLink.title')}
                </Dialog.Title>
                <p className="text-sm text-gray-600 mb-6">
                  {t('modals.pasteLink.subtitle')}
                </p>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Product Link */}
                  <div>
                    <label
                      htmlFor="product-link"
                      className="block text-sm font-medium text-gray-700 mb-1.5"
                    >
                      {t('modals.pasteLink.labelLink')}
                    </label>
                    <input
                      type="text"
                      id="product-link"
                      value={productLink}
                      onChange={(e) => {
                        setProductLink(e.target.value);
                        setLinkError('');
                      }}
                      placeholder={t('modals.pasteLink.placeholderLink')}
                      className={`w-full px-3 py-2.5 border ${
                        linkError ? 'border-red-500' : 'border-gray-200'
                      } rounded-lg text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 ${
                        linkError ? 'focus:ring-red-500' : 'focus:ring-brand-blue'
                      } focus:border-transparent transition-all`}
                      required
                    />
                    {linkError && (
                      <p className="mt-1.5 text-xs text-red-600">{linkError}</p>
                    )}
                    <p className="mt-1.5 text-xs text-gray-500">
                      {t('modals.pasteLink.helperLink')}
                    </p>
                  </div>

                  {/* Destination Country */}
                  <div>
                    <label
                      htmlFor="destination-country"
                      className="block text-sm font-medium text-gray-700 mb-1.5"
                    >
                      {t('modals.pasteLink.labelCountry')}
                    </label>
                    <select
                      id="destination-country"
                      value={destinationCountry}
                      onChange={(e) => setDestinationCountry(e.target.value)}
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

                  {/* Info Box */}
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <div className="flex gap-2">
                      <svg
                        className="w-5 h-5 text-brand-blue flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="text-xs text-gray-700 leading-relaxed">
                        {t('modals.pasteLink.info')}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                    >
                      {t('modals.pasteLink.cancel')}
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-brand-blue hover:bg-brand-blueDark rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-blue focus:ring-offset-2"
                    >
                      {t('modals.pasteLink.submit')}
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
