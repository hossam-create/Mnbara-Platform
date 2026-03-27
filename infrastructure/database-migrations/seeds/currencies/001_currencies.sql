-- Seed: 001_currencies.sql
-- Description: Seeds common currencies with exchange rates and formatting
-- Category: currencies

INSERT INTO currencies (code, name, symbol, decimal_places, thousands_separator, decimal_separator, is_active, is_default, exchange_rate_to_usd) VALUES
-- Major Currencies
('USD', 'US Dollar', '$', 2, ',', '.', true, true, 1.000000),
('EUR', 'Euro', '€', 2, '.', ',', true, false, 0.920000),
('GBP', 'British Pound', '£', 2, ',', '.', true, false, 0.790000),
('JPY', 'Japanese Yen', '¥', 0, ',', '.', true, false, 149.500000),
('CNY', 'Chinese Yuan', '¥', 2, ',', '.', true, false, 7.240000),
('INR', 'Indian Rupee', '₹', 2, ',', '.', true, false, 83.120000),
-- Asian Currencies
('KRW', 'South Korean Won', '₩', 0, ',', '.', true, false, 1298.000000),
('SGD', 'Singapore Dollar', '$', 2, ',', '.', true, false, 1.340000),
('MYR', 'Malaysian Ringgit', 'RM', 2, '.', ',', true, false, 4.720000),
('THB', 'Thai Baht', '฿', 2, ',', '.', true, false, 35.800000),
('IDR', 'Indonesian Rupiah', 'Rp', 0, '.', ',', true, false, 15650.000000),
('PHP', 'Philippine Peso', '₱', 2, ',', '.', true, false, 55.890000),
('VND', 'Vietnamese Dong', '₫', 0, '.', ',', true, false, 24550.000000),
('PKR', 'Pakistani Rupee', '₨', 2, ',', '.', true, false, 281.500000),
('BDT', 'Bangladeshi Taka', '৳', 2, ',', '.', true, false, 110.000000),
('AED', 'UAE Dirham', 'د.إ', 2, ',', '.', true, false, 3.672500),
('SAR', 'Saudi Riyal', '﷼', 2, ',', '.', true, false, 3.750000),
-- European Currencies
('CHF', 'Swiss Franc', 'Fr', 2, '''', '.', true, false, 0.885000),
('SEK', 'Swedish Krona', 'kr', 2, ' ', ',', true, false, 10.450000),
('NOK', 'Norwegian Krone', 'kr', 2, ' ', ',', true, false, 10.750000),
('DKK', 'Danish Krone', 'kr', 2, '.', ',', true, false, 6.870000),
('PLN', 'Polish Zloty', 'zł', 2, ' ', ',', true, false, 4.020000),
('CZK', 'Czech Koruna', 'Kč', 2, ' ', ',', true, false, 22.500000),
('HUF', 'Hungarian Forint', 'Ft', 0, ' ', ',', true, false, 354.000000),
('RON', 'Romanian Leu', 'lei', 2, '.', ',', true, false, 4.590000),
('UAH', 'Ukrainian Hryvnia', '₴', 2, ' ', ',', true, false, 37.500000),
('RUB', 'Russian Ruble', '₽', 2, ' ', ',', true, false, 92.500000),
('TRY', 'Turkish Lira', '₺', 2, '.', ',', true, false, 29.000000),
('ZAR', 'South African Rand', 'R', 2, ' ', ',', true, false, 18.750000),
-- Americas
('CAD', 'Canadian Dollar', '$', 2, ',', '.', true, false, 1.360000),
('MXN', 'Mexican Peso', '$', 2, ',', '.', true, false, 17.150000),
('BRL', 'Brazilian Real', 'R$', 2, '.', ',', true, false, 4.970000),
('ARS', 'Argentine Peso', '$', 2, '.', ',', true, false, 350.000000),
('CLP', 'Chilean Peso', '$', 0, '.', ',', true, false, 890.000000),
('COP', 'Colombian Peso', '$', 0, '.', ',', true, false, 3950.000000),
('PEN', 'Peruvian Sol', 'S/', 2, ',', '.', true, false, 3.720000),
-- Oceania
('AUD', 'Australian Dollar', '$', 2, ',', '.', true, false, 1.530000),
('NZD', 'New Zealand Dollar', '$', 2, ',', '.', true, false, 1.640000),
-- African Currencies
('NGN', 'Nigerian Naira', '₦', 2, ',', '.', true, false, 780.000000),
('EGP', 'Egyptian Pound', 'E£', 2, ',', '.', true, false, 30.900000),
('GHS', 'Ghanaian Cedi', '₵', 2, ',', '.', true, false, 12.500000),
('KES', 'Kenyan Shilling', 'KSh', 2, ',', '.', true, false, 145.000000),
('MAD', 'Moroccan Dirham', 'د.م.', 2, ' ', ',', true, false, 9.500000),
-- Crypto (for future use)
('BTC', 'Bitcoin', 'BTC', 8, ',', '.', false, false, 0.00001500),
('ETH', 'Ethereum', 'ETH', 18, ',', '.', false, false, 0.00028000),
('USDT', 'Tether', 'USDT', 2, ',', '.', false, false, 1.000000),
('USDC', 'USD Coin', 'USDC', 2, ',', '.', false, false, 1.000000)
ON CONFLICT (code) DO NOTHING;

-- Note: The currencies table needs to be created first
-- This seed assumes a currencies table exists with columns:
-- code (PK), name, symbol, decimal_places, thousands_separator, 
-- decimal_separator, is_active, is_default, exchange_rate_to_usd
