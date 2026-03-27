# Wallet Service
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

EXPOSE 3005

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3005/health >/dev/null 2>&1 || exit 1

CMD ["node", "-e", "require('http').createServer((req,res)=>{if(req.url==='/health'){res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({status:'ok',service:'wallet-service',mode:'stub'}));}else{res.writeHead(200);res.end('wallet-service stub');}}).listen(process.env.PORT||3005,'0.0.0.0');console.log('wallet-service stub listening on',process.env.PORT||3005);"]
