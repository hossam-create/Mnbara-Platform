import React from 'react';
import { useTranslation } from 'react-i18next';
import ContentPageLayout from '../components/layout/ContentPageLayout';

const BiddingHelpPage: React.FC = () => {
  const { t } = useTranslation();

  return (
    <ContentPageLayout title={t('biddingHelp.title', 'Bidding Help')}>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-semibold mb-4">
            {t('biddingHelp.howToBid', 'How to Place a Bid')}
          </h2>
          <div className="space-y-4 text-gray-600">
            <p>
              {t('biddingHelp.howToBidDescription', 
                'Placing a bid on Mnbarh is simple and secure. Follow these steps to participate in auctions:')}
            </p>
            <ol className="list-decimal list-inside space-y-2 ml-4">
              <li>{t('biddingHelp.step1', 'Find an item you want to bid on')}</li>
              <li>{t('biddingHelp.step2', 'Enter your maximum bid amount')}</li>
              <li>{t('biddingHelp.step3', 'Review and confirm your bid')}</li>
              <li>{t('biddingHelp.step4', 'Wait for the auction to end')}</li>
            </ol>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-semibold mb-4">
            {t('biddingHelp.bidIncrements', 'Bid Increments')}
          </h2>
          <div className="space-y-4 text-gray-600">
            <p>
              {t('biddingHelp.bidIncrementsDescription', 
                'Bids must follow minimum increment rules to ensure fair competition:')}
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>{t('biddingHelp.increment1', 'Under $100: $1 increments')}</li>
              <li>{t('biddingHelp.increment2', '$100 - $500: $5 increments')}</li>
              <li>{t('biddingHelp.increment3', '$500 - $1,000: $10 increments')}</li>
              <li>{t('biddingHelp.increment4', 'Over $1,000: $25 increments')}</li>
            </ul>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-semibold mb-4">
            {t('biddingHelp.winning', 'Winning an Auction')}
          </h2>
          <div className="space-y-4 text-gray-600">
            <p>
              {t('biddingHelp.winningDescription', 
                'If you win an auction, you will be notified and need to complete payment within 24 hours.')}
            </p>
            <p>
              {t('biddingHelp.paymentProcess', 
                'The payment process is secure and handled through our trusted payment partners.')}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-semibold mb-4">
            {t('biddingHelp.tips', 'Bidding Tips')}
          </h2>
          <div className="space-y-4 text-gray-600">
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>{t('biddingHelp.tip1', 'Set a maximum budget and stick to it')}</li>
              <li>{t('biddingHelp.tip2', 'Bid early to show interest, but bid your maximum late')}</li>
              <li>{t('biddingHelp.tip3', 'Read the item description carefully')}</li>
              <li>{t('biddingHelp.tip4', 'Check the seller\'s reputation')}</li>
              <li>{t('biddingHelp.tip5', 'Watch the auction end time')}</li>
            </ul>
          </div>
        </div>
      </div>
    </ContentPageLayout>
  );
};

export default BiddingHelpPage;
