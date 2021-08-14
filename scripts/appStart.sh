# !/bin/bash
# sudo service amazon-cloudwatch-agent restart
# sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
#     -a fetch-config \
#     -m ec2 \
#     -c file:/home/ubuntu/csye6225-webapp/webapp/config/amazon-cloudwatch-agent.json \
#     -s

sudo service amazon-cloudwatch-agent restart
sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -c file:/home/ubuntu/csye6225-webapp/webapp/amazon-cloudwatch-agent.json \
    -s
pwd
ls -al
cd /home/ubuntu/csye6225-webapp/webapp
npm start > app.out.log 2> app.err.log < /dev/null &
exit 0
# node app.js 
# cd /home/ubuntu/csye6225-webapp/webapp
# ls -al
# sudo kill $(ps -ef | grep webapp/app.js | grep -v 'grep' | awk '{printf $2}')
# sudo forever start -a app.js
