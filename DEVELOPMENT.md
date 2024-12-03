# Deploying to EC2

First step, Cd into Iris
```console
git pull
```
```console
npm install
```

```console
npm run build
```

### Deploy the Updated App
Remove the old files:
```console
sudo rm -rf /var/www/html/*
```

Copy the newly built Angular files to the document root:
```console
sudo cp -r ~/iris/dist/iris/browser/* /var/www/html/
```

Restart Apache
sudo systemctl restart apache2
