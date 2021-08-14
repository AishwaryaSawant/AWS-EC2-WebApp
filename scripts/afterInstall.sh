#!/bin/bash

# sudo chown -R ubuntu:ubuntu /home/ubuntu/csye6225-webapp
# sudo chmod -R 755 /home/ubuntu/csye6225-webapp

# sudo rm -r /home/ubuntu/csye6225-webapp/webapp/config
# sudo cp -r /home/ubuntu/webapp/config /home/ubuntu/csye6225-webapp/webapp
# cd /home/ubuntu/csye6225-webapp/webapp
# sudo stop app.js
# sudo npm install forever -g
# sudo npm install -g forever-service
# sudo forever-service install webappservice
# sudo npm install

# sudo env PATH=$PATH:/usr/local/bin /usr/local/lib/node_modules/ pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
# pm2 start app.js
# pm2 save

# cd ..
# sudo cp -R /home/ubuntu/config /home/ubuntu/csye6225-webapp/webapp
# cd /home/ubuntu/csye6225-webapp/webapp
# sudo npm install forever -g
# sudo npm install -g forever-service
# sudo forever-service install webappservice
# sudo npm install

sudo cp -R /home/ubuntu/config /home/ubuntu/csye6225-webapp/webapp
cd /home/ubuntu/csye6225-webapp/webapp
npm install

# # cd ..
# cd /home/ubuntu/csye6225-webapp
# ls -al
# sudo chown -R ubuntu:ubuntu webapp
# sudo rm -r /home/ubuntu/csye6225-webapp/webapp/config
# sudo cp -r /home/ubuntu/webapp/config /home/ubuntu/csye6225-webapp/webapp
# cd /home/ubuntu/csye6225-webapp/webapp
# ls -al
# sudo npm install forever -g
# sudo npm install -g forever-service
# sudo npm install
# sudo forever-service install test
