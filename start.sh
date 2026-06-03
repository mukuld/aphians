<<<<<<< HEAD
#!/bin/bash 
cd /home/mukul/src/aphians/server 
=======
#!/bin/bash
cd /home/mukul/Documents/src/aphians/server 
>>>>>>> 12d6fea (Updated start and configs)
export $(cat .env | xargs)
node src/index.js
