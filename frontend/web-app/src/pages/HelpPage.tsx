import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import {
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
  ShoppingBagIcon,
  TruckIcon,
  CreditCardIcon,
  UserCircleIcon,
  ShieldCheckIcon,
  ChatBubbleLeftRightIcon,
  ChevronRightIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'

interface FAQItem {
  question: string
  answer: string
}

interface HelpCategory {
  id: string
  title: string
  icon: React.ReactNode
  description: string
  faqs: FAQItem[]
}

const HelpPage: React.FC = () => {
  const { topic } = useParams<{ topic?: string }>()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null)

  const helpCategories: HelpCategory[] = [
    {
      id: 'buying',
      title: 'Buying',
      icon: <ShoppingBagIcon className="w-8 h-8" />,
      description: 'How to buy, bidding, and making offers',
      faqs: [
        { question: 'How do I place an order?', answer: 'Browse products, add items to your cart, and proceed to checkout. You can pay using credit card, Mada, Apple Pay, or cash on delivery.' },
        { question: 'Can I cancel my order?', answer: 'You can cancel your order within 1 hour of placing it, or before the seller ships the item. Go to Orders > Select Order > Cancel.' },
        { question: 'How do I track my order?', answer: 'Go to My Orders in your account. Click on the order to see tracking information and delivery status.' },
        { question: 'What payment methods are accepted?', answer: 'We accept Visa, Mastercard, Mada, Apple Pay, and Cash on Delivery (COD) for eligible orders.' }
      ]
    },
    {
      id: 'selling',
      title: 'Selling',
      icon: <CreditCardIcon className="w-8 h-8" />,
      description: 'List items, manage sales, and get paid',
      faqs: [
        { question: 'How do I start selling?', answer: 'Create an account, verify your identity, and click "Sell" to list your first item. Add photos, description, and set your price.' },
        { question: 'What are the selling fees?', answer: 'Mnbara charges a 5% commission on successful sales. There are no listing fees for standard listings.' },
        { question: 'When do I get paid?', answer: 'Payments are released 3 days after the buyer confirms receipt, or 7 days after delivery if not confirmed.' },
        { question: 'How do I ship items?', answer: 'You can use our integrated shipping partners or arrange your own shipping. Print shipping labels directly from your seller dashboard.' }
      ]
    },
    {
      id: 'shipping',
      title: 'Shipping & Delivery',
      icon: <TruckIcon className="w-8 h-8" />,
      description: 'Shipping options, tracking, and delivery',
      faqs: [
        { question: 'What are the shipping options?', answer: 'We offer Standard (3-5 days), Express (1-2 days), and Same-Day delivery in select cities.' },
        { question: 'Is free shipping available?', answer: 'Many sellers offer free shipping on orders over 200 SAR. Look for the "Free Shipping" badge on listings.' },
        { question: 'What if my package is lost or damaged?', answer: 'Contact our support team within 48 hours of expected delivery. We will investigate and provide a refund or replacement.' },
        { question: 'Can I change my delivery address?', answer: 'You can change the address before the item ships. Go to Orders > Select Order > Edit Address.' }
      ]
    },
    {
      id: 'account',
      title: 'Account & Security',
      icon: <UserCircleIcon className="w-8 h-8" />,
      description: 'Profile, settings, and account security',
      faqs: [
        { question: 'How do I reset my password?', answer: 'Click "Forgot Password" on the login page. Enter your email and follow the instructions sent to your inbox.' },
        { question: 'How do I enable two-factor authentication?', answer: 'Go to Settings > Security > Enable 2FA. You can use SMS or an authenticator app.' },
        { question: 'How do I delete my account?', answer: 'Go to Settings > Account > Delete Account. Note: This action is permanent and cannot be undone.' },
        { question: 'How do I update my profile?', answer: 'Go to Profile > Edit Profile. You can update your name, photo, bio, and contact information.' }
      ]
    },
    {
      id: 'returns',
      title: 'Returns & Refunds',
      icon: <ShieldCheckIcon className="w-8 h-8" />,
      description: 'Return policy, refunds, and disputes',
      faqs: [
        { question: 'What is the return policy?', answer: 'Most items can be returned within 14 days of delivery. Items must be unused and in original packaging.' },
        { question: 'How do I request a refund?', answer: 'Go to Orders > Select Order > Request Return. Choose your reason and follow the instructions.' },
        { question: 'How long do refunds take?', answer: 'Refunds are processed within 3-5 business days after we receive the returned item.' },
        { question: 'What if the item is not as described?', answer: 'Open a dispute within 7 days of delivery. Provide photos and description of the issue. Our team will review and resolve.' }
      ]
    }
  ]

  const selectedCategory = topic 
    ? helpCategories.find(c => c.id === topic) 
    : null

  const filteredCategories = searchQuery
    ? helpCategories.filter(c => 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.faqs.some(f => 
          f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.answer.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : helpCategories

  const allFaqs = helpCategories.flatMap(c => c.faqs.map(f => ({ ...f, category: c.title })))
  const filteredFaqs = searchQuery
    ? allFaqs.filter(f => 
        f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : []

  return (
    <>
      <Helmet>
        <title>{selectedCategory ? `${selectedCategory.title} Help` : 'Help Center'} - Mnbara</title>
        <meta name="description" content="Get help and support for using Mnbara marketplace." />
      </Helmet>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold mb-4">How can we help you?</h1>
            <p className="text-blue-100 mb-8">Search our help center or browse categories below</p>
            
            <div className="relative max-w-2xl mx-auto">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search for help..."
                className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 text-lg focus:ring-4 focus:ring-blue-300"
              />
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Search Results */}
          {searchQuery && filteredFaqs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12"
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Search Results ({filteredFaqs.length})
              </h2>
              <div className="space-y-3">
                {filteredFaqs.map((faq, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-800 rounded-xl p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setExpandedFaq(expandedFaq === `search-${index}` ? null : `search-${index}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs text-blue-600 font-medium">{faq.category}</span>
                        <h3 className="font-medium text-gray-900 dark:text-white">{faq.question}</h3>
                      </div>
                      <ChevronDownIcon className={`w-5 h-5 transition-transform ${expandedFaq === `search-${index}` ? 'rotate-180' : ''}`} />
                    </div>
                    {expandedFaq === `search-${index}` && (
                      <p className="mt-3 text-gray-600 dark:text-gray-400">{faq.answer}</p>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Category Detail View */}
          {selectedCategory ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <button
                onClick={() => navigate('/help')}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
              >
                ← Back to Help Center
              </button>
              
              <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-xl text-blue-600">
                  {selectedCategory.icon}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedCategory.title}</h2>
                  <p className="text-gray-600 dark:text-gray-400">{selectedCategory.description}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                {selectedCategory.faqs.map((faq, index) => (
                  <div
                    key={index}
                    className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === `${selectedCategory.id}-${index}` ? null : `${selectedCategory.id}-${index}`)}
                      className="w-full p-4 flex items-center justify-between text-left"
                    >
                      <span className="font-medium text-gray-900 dark:text-white">{faq.question}</span>
                      <ChevronDownIcon className={`w-5 h-5 transition-transform ${expandedFaq === `${selectedCategory.id}-${index}` ? 'rotate-180' : ''}`} />
                    </button>
                    {expandedFaq === `${selectedCategory.id}-${index}` && (
                      <div className="px-4 pb-4">
                        <p className="text-gray-600 dark:text-gray-400">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <>
              {/* Categories Grid */}
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Browse by Topic</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
                {filteredCategories.map(category => (
                  <motion.button
                    key={category.id}
                    onClick={() => navigate(`/help/${category.id}`)}
                    className="bg-white dark:bg-gray-800 rounded-xl p-6 text-left hover:shadow-lg transition-shadow group"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        {category.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{category.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{category.description}</p>
                      </div>
                      <ChevronRightIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Contact Support */}
              <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-8 text-white">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <ChatBubbleLeftRightIcon className="w-12 h-12" />
                    <div>
                      <h3 className="text-xl font-bold">Still need help?</h3>
                      <p className="text-gray-300">Our support team is available 24/7</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button className="px-6 py-3 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100 transition-colors">
                      Live Chat
                    </button>
                    <button className="px-6 py-3 border-2 border-white rounded-xl font-semibold hover:bg-white/10 transition-colors">
                      Email Us
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default HelpPage
