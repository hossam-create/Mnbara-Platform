@echo off
echo Fixing Environment Variables for MNBARH (Port Collision & Credentials)...

REM Auth Service
echo DATABASE_URL=postgresql://mnbarh:mnbarh_dev_password@localhost:5432/auth_db?schema=public > backend\services\auth-service\.env
echo PORT=3001 >> backend\services\auth-service\.env
echo JWT_SECRET=super_secret_mnbarh >> backend\services\auth-service\.env

REM Orders Service
echo DATABASE_URL=postgresql://mnbarh:mnbarh_dev_password@localhost:5432/orders_db?schema=public > backend\services\orders-service\.env
echo PORT=3003 >> backend\services\orders-service\.env
echo JWT_SECRET=super_secret_mnbarh >> backend\services\orders-service\.env

REM Listing Service
echo DATABASE_URL=postgresql://mnbarh:mnbarh_dev_password@localhost:5432/listing_db?schema=public > backend\services\listing-service\.env
echo PORT=3002 >> backend\services\listing-service\.env
echo ELASTICSEARCH_URL=http://localhost:9200 >> backend\services\listing-service\.env

REM Payment Service (MOVING TO 3008)
echo DATABASE_URL=postgresql://mnbarh:mnbarh_dev_password@localhost:5432/payment_db?schema=public > backend\services\payment-service\.env
echo PORT=3008 >> backend\services\payment-service\.env
echo JWT_SECRET=super_secret_mnbarh >> backend\services\payment-service\.env

REM Wallet Service
echo DATABASE_URL=postgresql://mnbarh:mnbarh_dev_password@localhost:5432/wallet_db?schema=public > backend\services\wallet-service\.env
echo PORT=3019 >> backend\services\wallet-service\.env

REM Settlement Service
echo DATABASE_URL=postgresql://mnbarh:mnbarh_dev_password@localhost:5432/settlement_db?schema=public > backend\services\settlement-service\.env
echo PORT=3016 >> backend\services\settlement-service\.env

REM Crowdship Service
echo DATABASE_URL=postgresql://mnbarh:mnbarh_dev_password@localhost:5432/crowdship_db?schema=public > backend\services\crowdship-service\.env
echo PORT=3006 >> backend\services\crowdship-service\.env

REM Card Service
echo DATABASE_URL=postgresql://mnbarh:mnbarh_dev_password@localhost:5432/card_db?schema=public > backend\services\card-service\.env
echo PORT=3020 >> backend\services\card-service\.env

echo Done. Configs Updated to 'mnbarh'.
