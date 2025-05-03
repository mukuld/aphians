#!/bin/bash 
cd /home/mukul/Documents/src/aphians/server 
export $(cat .env | xargs)
node src/index.js