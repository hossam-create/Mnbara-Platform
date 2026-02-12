-- Seed: 001_countries.sql
-- Description: Seeds all countries with ISO codes, phone codes, and regions
-- Category: countries

INSERT INTO countries (code, name, phone_code, continent, region, subregion, capital, currency_code, currency_name, timezone_default, utc_offset, iso_alpha3, numeric_code, is_active) VALUES
-- Africa
('AF', 'Afghanistan', '+93', 'Africa', 'Sub-Saharan Africa', 'Eastern Africa', 'Kabul', 'AFN', 'Afghan Afghani', 'Asia/Kabul', '+04:30', 'AFG', '004', true),
('EG', 'Egypt', '+20', 'Africa', 'Northern Africa', 'Northern Africa', 'Cairo', 'EGP', 'Egyptian Pound', 'Africa/Cairo', '+02:00', 'EGY', '818', true),
('MA', 'Morocco', '+212', 'Africa', 'Northern Africa', 'Northern Africa', 'Rabat', 'MAD', 'Moroccan Dirham', 'Africa/Rabat', '+01:00', 'MAR', '504', true),
('NG', 'Nigeria', '+234', 'Africa', 'Sub-Saharan Africa', 'Western Africa', 'Abuja', 'NGN', 'Nigerian Naira', 'Africa/Lagos', '+01:00', 'NGA', '566', true),
('KE', 'Kenya', '+254', 'Africa', 'Sub-Saharan Africa', 'Eastern Africa', 'Nairobi', 'KES', 'Kenyan Shilling', 'Africa/Nairobi', '+03:00', 'KEN', '404', true),
('ZA', 'South Africa', '+27', 'Africa', 'Sub-Saharan Africa', 'Southern Africa', 'Pretoria', 'ZAR', 'South African Rand', 'Africa/Johannesburg', '+02:00', 'ZAF', '710', true),
('GH', 'Ghana', '+233', 'Africa', 'Sub-Saharan Africa', 'Western Africa', 'Accra', 'GHS', 'Ghanaian Cedi', 'Africa/Accra', '+00:00', 'GHA', '288', true),
-- Asia
('CN', 'China', '+86', 'Asia', 'Eastern Asia', 'Eastern Asia', 'Beijing', 'CNY', 'Chinese Yuan', 'Asia/Shanghai', '+08:00', 'CHN', '156', true),
('IN', 'India', '+91', 'Asia', 'Southern Asia', 'Southern Asia', 'New Delhi', 'INR', 'Indian Rupee', 'Asia/Kolkata', '+05:30', 'IND', '356', true),
('JP', 'Japan', '+81', 'Asia', 'Eastern Asia', 'Eastern Asia', 'Tokyo', 'JPY', 'Japanese Yen', 'Asia/Tokyo', '+09:00', 'JPN', '392', true),
('KR', 'South Korea', '+82', 'Asia', 'Eastern Asia', 'Eastern Asia', 'Seoul', 'KRW', 'South Korean Won', 'Asia/Seoul', '+09:00', 'KOR', '410', true),
('SA', 'Saudi Arabia', '+966', 'Asia', 'Western Asia', 'Western Asia', 'Riyadh', 'SAR', 'Saudi Riyal', 'Asia/Riyadh', '+03:00', 'SAU', '682', true),
('AE', 'United Arab Emirates', '+971', 'Asia', 'Western Asia', 'Western Asia', 'Abu Dhabi', 'AED', 'UAE Dirham', 'Asia/Dubai', '+04:00', 'ARE', '784', true),
('SG', 'Singapore', '+65', 'Asia', 'Southeast Asia', 'Southeast Asia', 'Singapore', 'SGD', 'Singapore Dollar', 'Asia/Singapore', '+08:00', 'SGP', '702', true),
('TH', 'Thailand', '+66', 'Asia', 'Southeast Asia', 'Southeast Asia', 'Bangkok', 'THB', 'Thai Baht', 'Asia/Bangkok', '+07:00', 'THA', '764', true),
('VN', 'Vietnam', '+84', 'Asia', 'Southeast Asia', 'Southeast Asia', 'Hanoi', 'VND', 'Vietnamese Dong', 'Asia/Ho_Chi_Minh', '+07:00', 'VNM', '704', true),
('ID', 'Indonesia', '+62', 'Asia', 'Southeast Asia', 'Southeast Asia', 'Jakarta', 'IDR', 'Indonesian Rupiah', 'Asia/Jakarta', '+07:00', 'IDN', '360', true),
('MY', 'Malaysia', '+60', 'Asia', 'Southeast Asia', 'Southeast Asia', 'Kuala Lumpur', 'MYR', 'Malaysian Ringgit', 'Asia/Kuala_Lumpur', '+08:00', 'MYS', '458', true),
('PH', 'Philippines', '+63', 'Asia', 'Southeast Asia', 'Southeast Asia', 'Manila', 'PHP', 'Philippine Peso', 'Asia/Manila', '+08:00', 'PHL', '608', true),
('PK', 'Pakistan', '+92', 'Asia', 'Southern Asia', 'Southern Asia', 'Islamabad', 'PKR', 'Pakistani Rupee', 'Asia/Karachi', '+05:00', 'PAK', '586', true),
('BD', 'Bangladesh', '+880', 'Asia', 'Southern Asia', 'Southern Asia', 'Dhaka', 'BDT', 'Bangladeshi Taka', 'Asia/Dhaka', '+06:00', 'BGD', '050', true),
-- Europe
('GB', 'United Kingdom', '+44', 'Europe', 'Northern Europe', 'Northern Europe', 'London', 'GBP', 'British Pound', 'Europe/London', '+00:00', 'GBR', '826', true),
('DE', 'Germany', '+49', 'Europe', 'Central Europe', 'Central Europe', 'Berlin', 'EUR', 'Euro', 'Europe/Berlin', '+01:00', 'DEU', '276', true),
('FR', 'France', '+33', 'Europe', 'Western Europe', 'Western Europe', 'Paris', 'EUR', 'Euro', 'Europe/Paris', '+01:00', 'FRA', '250', true),
('IT', 'Italy', '+39', 'Europe', 'Southern Europe', 'Southern Europe', 'Rome', 'EUR', 'Euro', 'Europe/Rome', '+01:00', 'ITA', '380', true),
('ES', 'Spain', '+34', 'Europe', 'Southern Europe', 'Southern Europe', 'Madrid', 'EUR', 'Euro', 'Europe/Madrid', '+01:00', 'ESP', '724', true),
('NL', 'Netherlands', '+31', 'Europe', 'Western Europe', 'Western Europe', 'Amsterdam', 'EUR', 'Euro', 'Europe/Amsterdam', '+01:00', 'NLD', '528', true),
('BE', 'Belgium', '+32', 'Europe', 'Western Europe', 'Western Europe', 'Brussels', 'EUR', 'Euro', 'Europe/Brussels', '+01:00', 'BEL', '056', true),
('AT', 'Austria', '+43', 'Europe', 'Central Europe', 'Central Europe', 'Vienna', 'EUR', 'Euro', 'Europe/Vienna', '+01:00', 'AUT', '040', true),
('CH', 'Switzerland', '+41', 'Europe', 'Central Europe', 'Western Europe', 'Bern', 'CHF', 'Swiss Franc', 'Europe/Zurich', '+01:00', 'CHE', '756', true),
('SE', 'Sweden', '+46', 'Europe', 'Northern Europe', 'Northern Europe', 'Stockholm', 'SEK', 'Swedish Krona', 'Europe/Stockholm', '+01:00', 'SWE', '752', true),
('NO', 'Norway', '+47', 'Europe', 'Northern Europe', 'Northern Europe', 'Oslo', 'NOK', 'Norwegian Krone', 'Europe/Oslo', '+01:00', 'NOR', '578', true),
('DK', 'Denmark', '+45', 'Europe', 'Northern Europe', 'Northern Europe', 'Copenhagen', 'DKK', 'Danish Krone', 'Europe/Copenhagen', '+01:00', 'DNK', '208', true),
('FI', 'Finland', '+358', 'Europe', 'Northern Europe', 'Northern Europe', 'Helsinki', 'EUR', 'Euro', 'Europe/Helsinki', '+02:00', 'FIN', '246', true),
('PL', 'Poland', '+48', 'Europe', 'Central Europe', 'Central Europe', 'Warsaw', 'PLN', 'Polish Zloty', 'Europe/Warsaw', '+01:00', 'POL', '616', true),
('PT', 'Portugal', '+351', 'Europe', 'Southern Europe', 'Southern Europe', 'Lisbon', 'EUR', 'Euro', 'Europe/Lisbon', '+00:00', 'PRT', '620', true),
('GR', 'Greece', '+30', 'Europe', 'Southern Europe', 'Southern Europe', 'Athens', 'EUR', 'Euro', 'Europe/Athens', '+02:00', 'GRC', '300', true),
('CZ', 'Czech Republic', '+420', 'Europe', 'Central Europe', 'Central Europe', 'Prague', 'CZK', 'Czech Koruna', 'Europe/Prague', '+01:00', 'CZE', '203', true),
('RO', 'Romania', '+40', 'Europe', 'Eastern Europe', 'Eastern Europe', 'Bucharest', 'RON', 'Romanian Leu', 'Europe/Bucharest', '+02:00', 'ROU', '642', true),
('UA', 'Ukraine', '+380', 'Europe', 'Eastern Europe', 'Eastern Europe', 'Kyiv', 'UAH', 'Ukrainian Hryvnia', 'Europe/Kyiv', '+02:00', 'UKR', '804', true),
('RU', 'Russia', '+7', 'Europe', 'Eastern Europe', 'Eastern Europe', 'Moscow', 'RUB', 'Russian Ruble', 'Europe/Moscow', '+03:00', 'RUS', '643', true),
-- North America
('US', 'United States', '+1', 'North America', 'Northern America', 'Northern America', 'Washington D.C.', 'USD', 'US Dollar', 'America/New_York', '-05:00', 'USA', '840', true),
('CA', 'Canada', '+1', 'North America', 'Northern America', 'Northern America', 'Ottawa', 'CAD', 'Canadian Dollar', 'America/Toronto', '-05:00', 'CAN', '124', true),
('MX', 'Mexico', '+52', 'North America', 'Central America', 'Central America', 'Mexico City', 'MXN', 'Mexican Peso', 'America/Mexico_City', '-06:00', 'MEX', '484', true),
-- South America
('BR', 'Brazil', '+55', 'South America', 'South America', 'South America', 'Brasília', 'BRL', 'Brazilian Real', 'America/Sao_Paulo', '-03:00', 'BRA', '076', true),
('AR', 'Argentina', '+54', 'South America', 'South America', 'South America', 'Buenos Aires', 'ARS', 'Argentine Peso', 'America/Argentina/Buenos_Aires', '-03:00', 'ARG', '032', true),
('CL', 'Chile', '+56', 'South America', 'South America', 'South America', 'Santiago', 'CLP', 'Chilean Peso', 'America/Santiago', '-03:00', 'CHL', '152', true),
('CO', 'Colombia', '+57', 'South America', 'South America', 'South America', 'Bogotá', 'COP', 'Colombian Peso', 'America/Bogota', '-05:00', 'COL', '170', true),
('PE', 'Peru', '+51', 'South America', 'South America', 'South America', 'Lima', 'PEN', 'Peruvian Sol', 'America/Lima', '-05:00', 'PER', '604', true),
-- Oceania
('AU', 'Australia', '+61', 'Oceania', 'Australia and New Zealand', 'Australia and New Zealand', 'Canberra', 'AUD', 'Australian Dollar', 'Australia/Sydney', '+11:00', 'AUS', '036', true),
('NZ', 'New Zealand', '+64', 'Oceania', 'Australia and New Zealand', 'New Zealand', 'Wellington', 'NZD', 'New Zealand Dollar', 'Pacific/Auckland', '+13:00', 'NZL', '554', true)
ON CONFLICT (code) DO NOTHING;

-- Note: The countries table needs to be created first
-- This seed assumes a countries table exists with columns:
-- code (PK), name, phone_code, continent, region, subregion, capital, 
-- currency_code, currency_name, timezone_default, utc_offset, 
-- iso_alpha3, numeric_code, is_active
