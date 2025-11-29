# eBay Categories Fetcher

## 📋 Overview

This script fetches the complete eBay category tree using the eBay Taxonomy API and generates a TypeScript seed file for your database.

## 🚀 Quick Start

### 1. Get eBay API Credentials

1. Go to [eBay Developers Program](https://developer.ebay.com/)
2. Sign in or create an account
3. Go to "My Account" → "Application Keys"
4. Create a new application (Production or Sandbox)
5. Copy your **Client ID** and **Client Secret**

### 2. Set Environment Variables

**Option A: Using .env file**
```bash
# Create .env file in project root
echo "EBAY_CLIENT_ID=your_client_id_here" >> .env
echo "EBAY_CLIENT_SECRET=your_client_secret_here" >> .env
```

**Option B: Export directly**
```bash
export EBAY_CLIENT_ID="your_client_id_here"
export EBAY_CLIENT_SECRET="your_client_secret_here"
```

**Option C: Edit the script**
Open `scripts/fetch-ebay-categories.ts` and replace:
```typescript
const CLIENT_ID = 'YOUR_CLIENT_ID_HERE';
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET_HERE';
```

### 3. Install Dependencies

```bash
npm install axios
npm install --save-dev @types/node
```

### 4. Run the Script

```bash
npx ts-node scripts/fetch-ebay-categories.ts
```

## 📊 What It Does

1. **Authenticates** with eBay OAuth 2.0
2. **Fetches** complete category tree from eBay Taxonomy API
3. **Processes** and flattens the hierarchical structure
4. **Translates** category names to Arabic
5. **Generates** TypeScript seed file
6. **Saves** raw JSON data for reference

## 📁 Output Files

After running, you'll get:

```
prisma/seeds/
├── ebay-categories-raw.json          # Raw API response
└── ebay-categories-full.seed.ts      # Ready-to-run seed file
```

## 🎯 Next Steps

After the script completes:

```bash
# Run the generated seed file
cd services/auth-service
npx ts-node prisma/seeds/ebay-categories-full.seed.ts
```

## 🔧 Configuration

### Marketplace Selection

By default, the script fetches US marketplace (ID: 0). To change:

```typescript
const categoryTree = await getCategoryTree(token, '3'); // 3 = UK
```

**Marketplace IDs:**
- 0 = United States
- 3 = United Kingdom  
- 77 = Germany
- 71 = France
- 101 = Italy
- 186 = Spain
- 15 = Australia
- 100 = eBay Motors

### Arabic Translations

The script includes basic Arabic translations. To add more:

```typescript
const arabicTranslations: Record<string, string> = {
  'Your Category': 'الترجمة العربية',
  // Add more...
};
```

## 📊 Expected Output

```
🚀 eBay Category Fetcher
═══════════════════════════════════════

🔑 Step 1: Getting OAuth access token...
✅ Access token obtained

📦 Step 2: Fetching eBay category tree (US marketplace)...
✅ Category tree fetched

🔄 Step 3: Processing categories...
✅ Processed 500+ categories

💾 Step 4: Saving raw data...
✅ Raw data saved

📝 Step 5: Generating TypeScript seed file...
✅ Seed file generated

═══════════════════════════════════════
🎉 Success!
═══════════════════════════════════════
📊 Total categories: 500+
   - Level 1: 35
   - Level 2: 300+
   - Level 3: 200+
```

## ❌ Troubleshooting

### Error: "Invalid client credentials"
- Check your Client ID and Client Secret
- Make sure they're from the correct environment (Production vs Sandbox)

### Error: "Access token expired"
- The script automatically gets a new token
- If persists, check your API key permissions

### Error: "Rate limit exceeded"
- eBay has rate limits on API calls
- Wait a few minutes and try again

## 🔄 Updating Categories

Run this script periodically to keep categories up-to-date:

```bash
# Recommended: Every 3-6 months
npx ts-node scripts/fetch-ebay-categories.ts
```

## 📝 Notes

- The script generates **500+ categories** from eBay
- Arabic translations are basic - you can enhance them
- Categories include eBay IDs for reference
- The seed file is ready to run immediately

## 🆘 Support

If you encounter issues:
1. Check eBay Developer documentation
2. Verify API credentials
3. Check network connectivity
4. Review error messages in console
