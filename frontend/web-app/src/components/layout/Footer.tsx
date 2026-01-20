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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12 mb-12">
            {/* Buy */}
          <div>
            <h4 className="font-bold text-sm text-white mb-4">{t('footer.buy')}</h4>
            <ul className="space-y-3">
              <li><Link to="/auth/register" className="text-xs text-white/80 hover:text-brand-yellow hover:underline font-normal">{t('footer.links.registration')}</Link></li>
              <li><Link to="/policies/buyer-protection" className="text-xs text-white/80 hover:text-brand-yellow hover:underline font-normal">{t('footer.links.moneyBack')}</Link></li>
              <li><Link to="/help/bidding" className="text-xs text-white/80 hover:text-brand-yellow hover:underline font-normal">{t('footer.links.biddingHelp')}</Link></li>
              <li><Link to="/stores" className="text-xs text-white/80 hover:text-brand-yellow hover:underline font-normal">{t('footer.links.stores')}</Link></li>
            </ul>
          </div>

          {/* Sell */}
          <div>
            <h4 className="font-bold text-sm text-white mb-4">{t('footer.sell')}</h4>
            <ul className="space-y-3">
              <li><Link to="/sell" className="text-xs text-white/80 hover:text-brand-yellow hover:underline font-normal">{t('footer.links.startSelling')}</Link></li>
              <li><Link to="/help/selling" className="text-xs text-white/80 hover:text-brand-yellow hover:underline font-normal">{t('footer.links.learnToSell')}</Link></li>
              <li><Link to="/affiliates" className="text-xs text-white/80 hover:text-brand-yellow hover:underline font-normal">{t('footer.links.affiliates')}</Link></li>
              <li><Link to="/sitemap" className="text-xs text-white/80 hover:text-brand-yellow hover:underline font-normal">{t('footer.links.siteMap')}</Link></li>
            </ul>
          </div>

          {/* Tools & Apps */}
          <div>
            <h4 className="font-bold text-sm text-white mb-4">{t('footer.toolsApps')}</h4>
            <ul className="space-y-3">
              <li><Link to="/developers" className="text-xs text-white/80 hover:text-brand-yellow hover:underline font-normal">{t('footer.links.developers')}</Link></li>
              <li><Link to="/security" className="text-xs text-white/80 hover:text-brand-yellow hover:underline font-normal">{t('footer.links.securityCenter')}</Link></li>
              <li><Link to="/sitemap" className="text-xs text-white/80 hover:text-brand-yellow hover:underline font-normal">{t('footer.links.siteMap')}</Link></li>
            </ul>
          </div>

          {/* Stay Connected */}
          <div>
            <h4 className="font-bold text-sm text-white mb-4">{t('footer.stayConnected')}</h4>
            <ul className="space-y-3">
              <li><Link to="/blog" className="text-xs text-white/80 hover:text-brand-yellow hover:underline font-normal">{t('footer.links.blogs')}</Link></li>
              <li><a href="https://facebook.com" target="_blank" rel="noreferrer" className="text-xs text-white/80 hover:text-brand-yellow hover:underline font-normal">{t('footer.links.facebook')}</a></li>
              <li><a href="https://twitter.com" target="_blank" rel="noreferrer" className="text-xs text-white/80 hover:text-brand-yellow hover:underline font-normal">{t('footer.links.twitter')}</a></li>
            </ul>
          </div>

          {/* About Mnbarh */}
          <div>
            <h4 className="font-bold text-sm text-white mb-4">{t('footer.about')}</h4>
            <ul className="space-y-3">
              <li><Link to="/about" className="text-xs text-white/80 hover:text-brand-yellow hover:underline font-normal">{t('footer.links.companyInfo')}</Link></li>
              <li><Link to="/news" className="text-xs text-white/80 hover:text-brand-yellow hover:underline font-normal">{t('footer.links.news')}</Link></li>
              <li><Link to="/investors" className="text-xs text-white/80 hover:text-brand-yellow hover:underline font-normal">{t('footer.links.investors')}</Link></li>
              <li><Link to="/careers" className="text-xs text-white/80 hover:text-brand-yellow hover:underline font-normal">{t('footer.links.careers')}</Link></li>
              <li><Link to="/policies/all" className="text-xs text-white/80 hover:text-brand-yellow hover:underline font-normal">{t('footer.links.policies')}</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-6">
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/60 font-normal justify-between">
            <span>{t('footer.copyright')}</span>
            <div className="flex gap-2">
                <Link to="/accessibility" className="hover:text-brand-yellow hover:underline">{t('footer.links.accessibility')}</Link>
                <span>·</span>
                <Link to="/policies/user-agreement" className="hover:text-brand-yellow hover:underline">{t('footer.links.userAgreement')}</Link>
                <span>·</span>
                <Link to="/policies/privacy" className="hover:text-brand-yellow hover:underline">{t('footer.links.privacy')}</Link>
                <span>·</span>
                <Link to="/policies/cookies" className="hover:text-brand-yellow hover:underline">{t('footer.links.cookies')}</Link>
                <span>·</span>
                <Link to="/policies/privacy-choices" className="hover:text-brand-yellow hover:underline">{t('footer.links.privacyChoices')}</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
