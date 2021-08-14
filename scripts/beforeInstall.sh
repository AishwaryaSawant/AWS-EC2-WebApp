#!/bin/bash
# ls -al 
# pwd
# cd /bin
# ls -al
# cd ..
# cd /deployment-root
# ls -al
# cd ..
# cd /lib
# ls -al
# cd ..

# export /home/ubuntu/csye6225-webapp
sudo chown -R ubuntu:ubuntu /home/ubuntu/csye6225-webapp
sudo chown -R 755 /home/ubuntu/csye6225-webapp

if [ -d "/home/ubuntu/csye6225-webapp" ];then
    rm -rf /home/ubuntu/csye6225-webapp
    killall node
    mkdir -p /home/ubuntu/csye6225-webapp
else
    mkdir -p /home/ubuntu/csye6225-webapp
fi
# sudo rm -rf /home/ubuntu/csye6225-webapp

# ls -al
# sudo rm -rf /home/ubuntu/csye6225-webapp
# ls -al 