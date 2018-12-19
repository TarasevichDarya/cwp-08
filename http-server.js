const http = require('http');
const net = require('net');
const hostname = '127.0.0.1';
const port = 3000;
const tcp_port = 8124;
const connection = new net.Socket();
const buf = require('buffer');

const handlers = {
    '/workers': workers,
    '/workers/add': add,
    '/workers/remove': remove
};

function workers(req,res,payload,cb) {
    let request = {
        key : 'worker',
        method : 'get'
    }
    connection.write(JSON.stringify(request));

    connection.on('data',(data)=>{
        let parsedData=JSON.parse(data);
        if(parsedData.meta==='get'){
            parsedData.workers.forEach((element)=>{
                let buffer=new Buffer(element.numbers);
                element.numbers=buffer.toString();
            })
            cb(null,parsedData);
        }
    })
}

function add(req,res,payload,cb) {
    if(payload.x!==undefined){
        let request={
            key:'worker',
            method: 'start',
            interval:payload.x
        }
        connection.write(JSON.stringify(request));
        connection.on('data',(data,err)=>{
            let parsedData=JSON.parse(data);
            if(parsedData.meta = 'add') {
                cb(null, parsedData);
            }
        })
    }
    else{
        cb({code: 405, message: `Can't create worker`});
    }
    
}

function remove(req, res, payload, cb) {
    if(payload.id !== undefined) {
        let request = {
            key: 'worker',
            method: 'remove',
            id: payload.id
        }
        connection.write(JSON.stringify(request));
        connection.on('data',(data,err)=>{
            let jsonParsed = JSON.parse(data);
            if(jsonParsed.meta === 'remove' && jsonParsed.id!=-1){
                let buffer = new Buffer(jsonParsed.numbers);
                let resp = {
                    id: jsonParsed.id,
                    startedOn: jsonParsed.startedOn,
                    numbers: buffer.toString()
                }
                cb(null, resp);
            }
            else{
                cb({code: 405, message: 'Process doesn\'t exist'});
            }
        })

    }

}

connection.connect(tcp_port, function () {
    console.log('Connected to the TCP server');
});

const server = http.createServer((req, res) => {
    parseBodyJson(req, (err, payload) => {
        const handler = getHandler(req.url);
        handler(req, res, payload, (err, result) => {
            if (err) {
                res.writeHead(err.code, {'Content-Type' : 'application/json'});
                res.end( JSON.stringify(err) );
                return;
            }
            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify(result, null, "\t"));
        });
    });
});

server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});

function getHandler(url) {
    return handlers[url] || notFound;
}

function notFound(req, res, payload, cb) {
    cb({code: 404, message: 'Not found'});
}

function parseBodyJson(req, cb) {
    let body = [];
    req.on('data', function(chunk) {
        body.push(chunk);
    }).on('end', function() {
        body = Buffer.concat(body).toString();
        let params;
        try {
            params = JSON.parse(body);
        }
        catch (e) {
            cb(e);
            return;
        }
        cb(null, params);
    });
}