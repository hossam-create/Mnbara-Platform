import React from 'react'
import { Link } from 'react-router-dom'

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()

  const footerSections = [
    {
      title: 'Buy',
      links: [
        { name: 'Registration', href: '/auth/register' },
        { name: 'eBay Money Back Guarantee', href: '/help/guarantee' },
        { name: 'Bidding & buying help', href: '/help/buying' },
        { name: 'Stores', href: '/stores' },
      ]
    },
    {
      title: 'Sell',
      links: [
        { name: 'Start selling', href: '/sell' },
        { name: 'Learn to sell', href: '/help/selling' },
        { name: 'Affiliates', href: '/affiliates' },
      ]
    },
    {
      title: 'Tools & apps',
      links: [
        { name: 'Developers', href: '/developers' },
        { name: 'Security center', href: '/security' },
        { name: 'Site map', href: '/sitemap' },
      ]
    },
    {
      title: 'Stay connected',
      links: [
        { name: "Mnbara's Blogs", href: '/blog' },
        { name: 'Facebook', href: '#' },
        { name: 'Twitter', href: '#' },
      ]
    },
    {
      title: 'About Mnbara',
      links: [
        { name: 'Company info', href: '/about' },
        { name: 'News', href: '/news' },
        { name: 'Investors', href: '/investors' },
        { name: 'Careers', href: '/careers' },
        { name: 'Government relations', href: '/government' },
        { name: 'Advertise with us', href: '/advertise' },
        { name: 'Policies', href: '/policies' },
        { name: 'Verified Rights Owner (VeRO) Program', href: '/vero' },
      ]
    },
    {
      title: 'Help & Contact',
      links: [
        { name: 'Seller Information Center', href: '/help/seller' },
        { name: 'Contact us', href: '/contact' },
        { name: 'Resolution Center', href: '/resolution' },
      ]
    }
  ]

  return (
    <footer className="bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main footer content */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">
                {section.title}
              </h3>
              <ul className="mt-4 space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom section */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center">
            {/* Copyright */}
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Copyright © 1995-{currentYear} Mnbara Inc. All Rights Reserved.{' '}
              <Link to="/accessibility" className="hover:text-gray-900 dark:hover:text-white">
                Accessibility
              </Link>
              ,{' '}
              <Link to="/privacy" className="hover:text-gray-900 dark:hover:text-white">
                User Agreement
              </Link>
              ,{' '}
              <Link to="/privacy" className="hover:text-gray-900 dark:hover:text-white">
                Privacy
              </Link>
              ,{' '}
              <Link to="/payments" className="hover:text-gray-900 dark:hover:text-white">
                Payments Terms of Use
              </Link>
              ,{' '}
              <Link to="/cookies" className="hover:text-gray-900 dark:hover:text-white">
                Cookies
              </Link>
              ,{' '}
              <Link to="/ca-privacy" className="hover:text-gray-900 dark:hover:text-white">
                CA Privacy Notice
              </Link>
              ,{' '}
              <Link to="/choices" className="hover:text-gray-900 dark:hover:text-white">
                Your Privacy Choices
              </Link>{' '}
              and{' '}
              <Link to="/adsinfo" className="hover:text-gray-900 dark:hover:text-white">
                AdChoice
              </Link>
            </div>

            {/* Language and currency selector */}
            <div className="mt-4 md:mt-0 flex items-center space-x-4">
              <select className="text-sm border border-gray-300 rounded-md px-3 py-1 bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white">
                <option>United States</option>
                <option>Canada</option>
                <option>United Kingdom</option>
                <option>Germany</option>
                <option>France</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer