# CMSC734
Wildfire Visualization
Steps to run:
1. Install node.js : https://nodejs.org/en/
2. npm install
3. Please change the following in package.json
from :
"scripts": {
    "start": "webpack-dev-server --port $PORT --host 0.0.0.0 --disable-host-check",
    "build": "webpack && cp -r static/* dist/"
  }
to :
"scripts": {
    "start": "webpack-dev-server --open",
    "build": "webpack && cp -r static/* dist/"
  }
3. To run: npm run start

Git:
We can use local branches to track our changes:
git checkout -b your_branch
