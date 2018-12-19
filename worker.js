const fs=require('fs');

const path=process.argv[2];
const X=process.argv[3]*1000;

readJSON();
function readJSON() {
    fs.readFile(path,"utf8",(err,data)=>{
        if(err){
            console.error("Reading error");
            fs.writeFile(path, '[]', (err) => {
                if(err)
                    throw err;
                else
                    readJSON();
            });

        }
        else {
            let array = JSON.parse(data);
            let random;
            const min = 1;
            const max = 1000;

            setTimeout(function appendFile() {
                random = Math.floor(Math.random() * (max - min)) + min;
                array.push(random);
                console.log(array);
                let data = JSON.stringify(array);
                fs.writeFile(path, data, (err) => {
                    if (err) {
                        console.error(err);
                    }
                });
                setTimeout(appendFile, X);
            }, X)
        }});
}