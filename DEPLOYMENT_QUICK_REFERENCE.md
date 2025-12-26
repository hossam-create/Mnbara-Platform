# ⚡ Deployment Quick Reference Card

**Print this or keep it open while deploying!**

---

## 🔑 Critical Information

### GitHub Repository
```
https://github.com/hossam-create/Mnbara-Platform
Branch: main
```

### Services to Deploy
```
1. PostgreSQL Database
2. Redis Cache
3. API Gateway (Backend)
4. Web Frontend
```

### Build & Start Commands

**API Gateway:**
```
Build: cd backend/services/api-gateway && npm install && npm run build
Start: cd backend/services/api-gateway && npm start
```

**Web Frontend:**
```
Build: cd frontend/web-app && npm install && npm run build
Start: cd frontend/web-app && npm run preview
```

---

## 🔐 Environment Variables

### API Gateway (mnbara-api)
```
NODE_ENV = production
PORT = 3001
DATABASE_URL = postgresql://mnbara_user:PASSWORD@dpg-xxxxx.render.internal:5432/mnbara_prod
REDIS_URL = redis://default:PASSWORD@dpg-xxxxx.render.internal:6379
JWT_SECRET = a7f3e9c2b1d4f6a8e5c3b9d2f7a4e1c6b8d3f5a2e7c4b1d6f3a8e5c2b9d4f7
```

### Web Frontend (mnbara-web)
```
NODE_ENV = production
PORT = 5173
```

---

## 📋 Deployment Checklist

### Before Starting
- [ ] GitHub account connected to Render
- [ ] Render account created
- [ ] Render CLI installed (optional)
- [ ] Code pushed to GitHub main branch

### During Deployment
- [ ] Create PostgreSQL Database
  - [ ] Copy Internal Database URL
- [ ] Create Redis Cache
  - [ ] Copy Internal Redis URL
- [ ] Deploy API Gateway
  - [ ] Add all 5 environment variables
  - [ ] Wait for build to complete
- [ ] Deploy Web Frontend
  - [ ] Add 2 environment variables
  - [ ] Wait for build to complete

### After Deployment
- [ ] Test API: `curl https://mnbara-api.onrender.com/health`
- [ ] Test Web: Open `https://mnbara-web.onrender.com` in browser
- [ ] Check logs for errors
- [ ] Verify database connection
- [ ] Verify Redis connection

---

## 🚨 Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| Build fails with "npm ERR!" | Check package.json for typos |
| Database connection error | Verify DATABASE_URL is correct |
| Redis connection error | Verify REDIS_URL is correct |
| Service won't start | Check logs: `render logs SERVICE_NAME` |
| Port already in use | Change PORT in environment variables |
| Timeout during build | Increase build timeout in settings |

---

## 🔗 Useful Links

- Render Dashboard: https://dashboard.render.com
- GitHub Repo: https://github.com/hossam-create/Mnbara-Platform
- Render Docs: https://render.com/docs
- API Health: https://mnbara-api.onrender.com/health
- Web App: https://mnbara-web.onrender.com

---

## ⏱️ Estimated Timeline

| Step | Time |
|------|------|
| Create PostgreSQL | 3-5 min |
| Create Redis | 3-5 min |
| Deploy API Gateway | 10-15 min |
| Deploy Web Frontend | 10-15 min |
| Verification | 5 min |
| **Total** | **30-45 min** |

---

## 💡 Pro Tips

1. **Deploy in order:** Database → Redis → API → Web
2. **Monitor logs:** Watch build logs in real-time
3. **Test immediately:** Don't wait, test each service as it deploys
4. **Keep URLs handy:** Save the service URLs for testing
5. **Enable auto-deploy:** Set to auto-deploy on main branch push

---

## 📞 Need Help?

- Check logs: `render logs SERVICE_NAME --tail 100`
- View services: `render services`
- Restart service: `render restart SERVICE_NAME`
- View env vars: `render env SERVICE_NAME`

---

**Status: Ready to Deploy! 🚀**

