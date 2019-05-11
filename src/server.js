const homedir = require('os').homedir();
const fse = require('fs-extra')
const express = require('express')
const GithubWebHook = require('express-github-webhook');
const webhookHandler = GithubWebHook({ path: '/webhook', secret: 'dupadupa' });
const path = require('path')
const git = require('simple-git/promise');

const DIR = '/home/nodify'
const exec = require('child_process').exec;
//Express part
const app = express();
app.use(express.json())
app.use(webhookHandler); // use our middleware
app.post('/webhook', (req, res, next) => {
  res.send('test');
})
app.listen(5000)

//Apps
const config = {
  apps: [
    {
      name: 'FutBay - Front',
      nameNoSpace: 'futbay-front',
      repository: {
        fullName: 'pieczorx/futbay-front',
        type: 'github',
        remote: `https://43f527809458b35ef5cd86773b7fa03046004c05:@github.com/pieczorx/futbay-front`,
        branch: 'dev'
      },
      postPull: 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      env: {
        PORT: 3005,
        S3_HOST: 'https://s3.eu-central-1.amazonaws.com/futbay',
        API_HOST: 'https://futbay.com/api',
        PAYLANE_PUBLIC_API_KEY: 'b14733f62e8968eaf2b2483f1f1d5d2ebe08ce29',
        GOOGLE_SITE_VERIFICATION: 't5a6R_RFj9AKIA-saLlUPExe4P-OkxzaZCuUVofi6HQ'
      }
    },
    {
      name: 'FutBay - Api',
      nameNoSpace: 'futbay-api',
      repository: {
        fullName: 'pieczorx/futbay-api',
        type: 'github',
        remote: `https://43f527809458b35ef5cd86773b7fa03046004c05:@github.com/pieczorx/futbay-api`,
        branch: 'master'
      },
      postPull: 'npm install && npm run migrate && pm2 reload ecosystem.config.js --env production',
      env: {
        PORT: 3004,
        ENV: 'production',
        MYSQL_HOST: 'localhost',
        MYSQL_PORT: 3306,
        MYSQL_USER: 'futbay',
        MYSQL_PASS: 'zajebistehaslodlugiejakniewiem',
        MYSQL_DATABASE: 'futbay',
        BASE_ROUTE: '/api',
        FRONT_ORIGINS: 'localhost:3000,localhost:8010,localhost:3005,dev.futbay.com',
        AWS_KEY_ID: 'AKIAJHLPUQBOAQQFN3PA',
        AWS_SECRET_ACCESS_KEY: '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',
        PAYLANE_LOGIN: '080134aea0ed7e89c083c82a9387adec',
        PAYLANE_PASSWORD: 'TRo6!ha0%Go5$cho',
        PLIVO_AUTH_ID: 'MAZJI1MJK4ZTHLZJDJMT',
        PLIVO_AUTH_TOKEN: 'NDM5NTUzYjVhM2U0YWE5YTc4Mjk1Nzc4ODA0MGI4'
      }
    }
  ]
}



class App {
  constructor(config) {
    this.config = config;
    this.PATH = path.join(DIR, '/apps', this.config.nameNoSpace)
    this.PATH_REPO = path.join(this.PATH, '/repo')

    console.log(`Added "${this.config.name}" app.`)
  }
  async checkIsRepo() {

  }
  async init() {
    console.log(`Init "${this.config.name}" app.`)
    await fse.ensureDir(this.PATH_REPO)
    this.git = git(this.PATH_REPO);
    const isRepo = await this.git.checkIsRepo();
    console.log('is repo:', isRepo)
    if(!isRepo) {
      await this.clone();
    }
    await this.saveEnv();
    await this.executePostDeployCommands();
    //this.git = git(this.PATH_REPO)
  }
  async saveEnv() {
    let params = [];
    for(let key in this.config.env) {
      params.push(`${key}=${this.config.env[key]}`)
    }
    await fse.outputFile(path.resolve(this.PATH_REPO, '.env'), params.join('\n'))
  }
  async clone() {
    await git().clone(this.config.repository.remote, path.join(this.PATH, '/repo'));
    if(this.config.repository.branch) {
      await this.git.checkout(`origin/${this.config.repository.branch}`);
      console.log('Switched to branch ', this.config.repository.branch)
    }

  }
  async pullChanges() {
    console.log(`Pull changes to "${this.config.name}" app.`)
    await this.git.pull(this.config.repository.remote, this.config.repository.branch)
    console.log('changes pulled')
    await this.executePostDeployCommands();

  }
  async executePostDeployCommands() {
    return new Promise((resolve, reject) => {
      exec(this.config.postPull, {
        cwd: this.PATH_REPO
      }, function(error, stdout, stderr) {
        if(error) {
          return reject(error)
        }
        console.log('stdout', stdout)
        console.log('stderr', stderr)
        resolve()
        // work with result
      });
    })
  }
}

const apps = [];
for(let i = 0; i < config.apps.length; i++) {
  apps.push(new App(config.apps[i]))
}

//const getRepoFromName
webhookHandler.on('push', function (repo, data) {
  //console.log('xd', repo)
  console.log('New commit from', data.repository.full_name);
  for(let i = 0; i < apps.length; i++) {
    const app = apps[i];
    if(app.config.repository && app.config.repository.fullName == data.repository.full_name) {
      app.pullChanges();
    }
  }
});

// const USER = '43f527809458b35ef5cd86773b7fa03046004c05';
// const PASS = 'x-oauth-basic';
// const repoName = 'futbay-front'
// const REPO = 'github.com/pieczorx/' + repoName;
//

// git().silent(true)
//   .clone(remote)
//   .then(() => console.log('finished'))
//   .catch((err) => console.error('failed: ', err));

const start = async () => {
  try {
    await fse.ensureDir(DIR)
    console.log('Nodify folder is valid')
  } catch(e) {
    console.error('You have no permissions to access', DIR)
  }

  try {
    for(let i = 0; i < apps.length; i++) {
      console.log('Init app')
      await apps[i].init();
    }

  } catch(e) {
    console.log('error', e)
  }


}
start();
//URL: ttp://178.128.185.223:5000/
//token: 73c13c298966acd9a36d
//client id: 52c0343c4a1fd9e10fa0
//https://github.com/login/oauth/authorize?scope=repo&client_id=52c0343c4a1fd9e10fa0
