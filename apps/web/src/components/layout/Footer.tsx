import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * Footer - MNbarh Canonical (Walmart-grade UX)
 * Multi-column footer with links matching marketplace structure
 */

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="bg-brand-blueDark border-t border-white/10 mt-16 text-end">
      <div className="max-w-[1400px] mx-auto px-4 py-14">
        {/* Footer Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 mb-12">
          {/* Trust & Safety */}
          <div>
            <h4 className="font-bold text-sm text-white mb-4">Trust & Safety</h4>
            <ul className="space-y-3">
              <li><Link to="/trust" className="text-xs text-white/80 hover:text-brand-yellow hover:underline font-normal">Trust & Safety</Link></li>
              <li><Link to="/trust/buyer-protection" className="text-xs text-white/80 hover:text-brand-yellow hover:underline font-normal">Buyer Protection</Link></li>
              <li><Link to="/trust/seller-protection" className="text-xs text-white/80 hover:text-brand-yellow hover:underline font-normal">Seller / Traveler Protection</Link></li>
              <li><Link to="/trust/safety-tips" className="text-xs text-white/80 hover:text-brand-yellow hover:underline font-normal">Safety Tips</Link></li>
            </ul>
          </div>

          {/* Payments */}
          <div>
            <h4 className="font-bold text-sm text-white mb-4">Payments</h4>
            <ul className="space-y-3">
              <li><Link to="/payments/fees" className="text-xs text-white/80 hover:text-brand-yellow hover:underline font-normal">Fees</Link></li>
              <li><Link to="/payments/cancellation-refunds" className="text-xs text-white/80 hover:text-brand-yellow hover:underline font-normal">Cancellation & Refunds</Link></li>
              <li><Link to="/payments/disputes" className="text-xs text-white/80 hover:text-brand-yellow hover:underline font-normal">Disputes</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-bold text-sm text-white mb-4">Legal</h4>
            <ul className="space-y-3">
              <li><Link to="/legal/terms" className="text-xs text-white/80 hover:text-brand-yellow hover:underline font-normal">Terms of Service</Link></li>
              <li><Link to="/legal/privacy" className="text-xs text-white/80 hover:text-brand-yellow hover:underline font-normal">Privacy Policy</Link></li>
              <li><Link to="/legal/cookies" className="text-xs text-white/80 hover:text-brand-yellow hover:underline font-normal">Cookies</Link></li>
              <li><Link to="/legal/community-guidelines" className="text-xs text-white/80 hover:text-brand-yellow hover:underline font-normal">Community Guidelines</Link></li>
            </ul>
          </div>

          {/* Earn */}
          <div>
            <h4 className="font-bold text-sm text-white mb-4">Earn</h4>
            <ul className="space-y-3">
              <li><Link to="/affiliate/program" className="text-xs text-white/80 hover:text-brand-yellow hover:underline font-normal">Affiliate Program</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-6">
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/60 font-normal justify-between">
            <span>{t('footer.copyright')}</span>
            <div className="flex gap-2">
                <Link to="/legal/terms" className="hover:text-brand-yellow hover:underline">Terms</Link>
                <span>·</span>
                <Link to="/legal/privacy" className="hover:text-brand-yellow hover:underline">Privacy</Link>
                <span>·</span>
                <Link to="/legal/cookies" className="hover:text-brand-yellow hover:underline">Cookies</Link>
                <span>·</span>
                <Link to="/legal/community-guidelines" className="hover:text-brand-yellow hover:underline">Community</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
