# Auth Service Dockerfile
 
FROM node:18-alpine
 
WORKDIR /app
ENV NODE_ENV=production
 
EXPOSE 3001
 
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3001/health >/dev/null 2>&1 || exit 1
 
CMD ["node", "-e", "require('http').createServer((req,res)=>{if(req.url==='/health'){res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({status:'ok',service:'auth-service',mode:'stub'}));}else{res.writeHead(200);res.end('auth-service stub');}}).listen(process.env.PORT||3001,'0.0.0.0');console.log('auth-service stub listening on',process.env.PORT||3001);"]
