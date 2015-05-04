deployment : 
	heroku addons:add mongolab
    heroku config:set NODE_PATH=./config:./app/controllers    
    heroku config:set NODE_ENV=production

deployment elasticbeanstalk:
	eb init
	eb start
	eb push after every change    



