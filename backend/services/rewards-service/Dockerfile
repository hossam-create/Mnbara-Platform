FROM node:18-alpine

WORKDIR /app

ENV NODE_ENV=production

EXPOSE 3013

CMD ["node", "-e", "require('http').createServer((req,res)=>{if(req.url==='/health'){res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({status:'ok',service:'rewards-service'}));}else{res.writeHead(200);res.end('rewards-service');}}).listen(process.env.PORT||3013,'0.0.0.0');console.log('rewards-service listening on',process.env.PORT||3013);"]
