#!/bin/bash 
cd /home/mukul/src/aphians/server 
export $(cat .env | xargs)
node src/index.js
