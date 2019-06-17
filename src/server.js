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

//Apps
const apps = [];
class App {
  constructor(config) {
    this.config = config;
    this.PATH = path.join(DIR, '/apps', this.config.nameNoSpace)
    this.PATH_REPO = path.join(this.PATH, '/repo')
  }
  async init() {
    console.log(`Init "${this.config.name}" app`)
    await fse.ensureDir(this.PATH_REPO)
    this.git = git(this.PATH_REPO);
    const isRepo = await this.git.checkIsRepo();
    if(!isRepo) {
      await this.clone();
    } else {
      await this.pullChanges();
    }
    await this.saveEnv();
    await this.executePostDeployCommands();
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
    }
  }
  async pullChanges() {
    log(`Pull changes to "${this.config.name}" app...`)
    await this.git.pull(this.config.repository.remote, this.config.repository.branch)
    log(`Changes pulled to "${this.config.name}" app. Executing post deploy commands...`)
    await this.executePostDeployCommands();
    log(`App "${this.config.name}" has successfully restarted.`)
  }
  executeSinglePostDeployCommand(command) {

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
  async executePostDeployCommands() {
    for(let i = 0; i < this.config.postPull.length; i++) {
      const command = this.config.postPull[i];
      log(`Execute command: ${command}`)
      await this.executeSinglePostDeployCommand(command)
      log('Command was executed')
    }
  }
}

const log = (...args) => {
  console.log(`[NODIFY] ${(new Date()).toLocaleString()}`, ...args)
}
//const getRepoFromName
webhookHandler.on('push', function (repo, data) {
  const appsFiltered = apps.filter(app => {
    return app.config.repository && app.config.repository.fullName == data.repository.full_name
  });
  if(!appsFiltered.length) {
    return false;
  }
  const app = appsFiltered[0];
  app.pullChanges();
});

const start = async () => {
  //Load config
  log('Loading config...')
  config = await fse.readJson('./../config/config.json');

  //Listen on port 5000
  app.listen(config.port)

  //Create Nodify Folder
  log('Checking nodify path...')
  try {
    await fse.ensureDir(DIR)
  } catch(e) {
    throw new Error(`You have no permissions to access ${DIR}`)
  }

  log('Initialize apps...')
  //Add apps
  for(let i = 0; i < config.apps.length; i++) {
    const app = new App(config.apps[i])
    apps.push(app)
    app.init();
  }
}
start();
//URL: ttp://178.128.185.223:5000/
//token: 73c13c298966acd9a36d
//client id: 52c0343c4a1fd9e10fa0
//https://github.com/login/oauth/authorize?scope=repo&client_id=52c0343c4a1fd9e10fa0
