const net = require('net');
const fs = require('fs');
const childProcess = require('child_process');
const port = 8124;
let workers = [];

const server=net.createServer((client)=>{
    client.setEncoding("utf8");
    client.on('data',hand);


    function hand(data,error) {
        let request=JSON.parse(data);
        if(request.key='worker' && request.method!=undefined){
            switch (request.method) {
                case 'start':
                    if(request.interval!==undefined){
                        let interval=request.interval;
                        let id=Date.now();
                        let file='./jsonFiles/'+id+'.json';
                        let process=childProcess.spawn('node',['worker.js',file,interval],{detached:true});//запуск новый
                        let worker={
                            process: process,
                            id: id,
                            startedOn: Date.now(),
                            file:file
                        };
                        workers.push(worker);
                        let result = {
                            id : worker.id,
                            startedOn : worker.startedOn,
                            meta : 'add'
                        }
                        client.write(JSON.stringify(result));
                    }break;
                case 'get':
                    let workersArray=[];
                    for(let i=0;i<workers.length;i++){
                        let numbers=fs.readFileSync(workers[i].file)
                        let worker={
                            id:workers[i].id,
                            startedOn:workers[i].startedOn,
                            numbers:numbers
                        }
                        workersArray.push(worker);
                    }
                        let result = {
                            meta: 'get',
                            workers : workersArray
                        }
                        console.log(result);
                        client.write(JSON.stringify(result));
                        break;
                case 'remove':
                    let index=workers.findIndex(worker=>worker.id==request.id);
                    console.log(index);
                    if(request.id!==undefined && index!=-1){
                        let numbers=fs.readFileSync(workers[index].file);
                        let result = {
                            meta : 'remove',
                            id :  workers[index].id,
                            startedOn : workers[index].startedOn,
                            numbers : numbers
                        }
                        client.write(JSON.stringify(result));
                        process.kill(workers[index].process.pid);
                        workers.splice(index, 1);
                    }
                    else {
                        let result = {
                            meta : 'remove',
                            id :  -1
                        }
                        client.write(JSON.stringify(result));
                    }
                   break;
            }
        }
    };
    client.on('end',()=>{
        console.log(`Client ${client.id} disconnected`);
    });
});
process.on('SIGINT',()=>{
    for(let i=0;i<workers.length;i++){
        console.log(workers[i].process.pid);
        process.kill(workers[i].process.pid);
    }
    process.exit();
})
server.listen(port, () => {
    console.log(`Server listening on localhost:${port}`);
});