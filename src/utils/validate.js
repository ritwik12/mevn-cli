'use strict';

import execa from 'execa';
import inquirer from 'inquirer';

import { dependencyNotInstalled, showInstallationInfo } from './messages';
import { isWin, isLinux } from './constants';
import Spinner from './spinner';

// Initialize the spinner.
const spinner = new Spinner();

/**
 * Helper method to validate installation.
 *
 * @param {String} dependency
 * @returns {Promise<boolean>}
 */

const dependencyIsInstalled = async dependency => {
  let status;
  try {
    await execa.shell(dependency);
    status = true;
  } catch (err) {
    status = false;
  }
  return status;
};

/**
 * Validates installation
 *
 * @param {String} dependency
 * @returns {Promise<boolean>}
 */

const validateInstallation = async dependency => {
  const status = await dependencyIsInstalled(dependency);

  if (!status) {
    await inquirer
      .prompt([
        {
          type: 'confirm',
          name: 'installDependency',
          message: `Sorry, ${dependency} is not installed on your system, Do you want to install it?`,
        },
      ])
      .then(async choice => {
        if (choice.installDependency) {
          spinner.text = `Installing ${dependency}`;
          spinner.start();

          if (dependency === 'git help -g') {
            await installGit();
          } else if (dependency === 'docker') {
            await installDocker();
          } else {
            await installHerokuCLI();
          }
        } else {
          dependencyNotInstalled(dependency);
        }
      });
  }
};

/**
 * Validates user input
 *
 * @param {String} componentName
 * @returns {Boolean}
 */

const validateInput = componentName => {
  if (!componentName) {
    console.log(`Can't be empty!`);
    return false;
  } else {
    return true;
  }
};

/**
 * Exeutes respective shell command
 *
 * @param {String} cmd
 * @returns {Promise<any>}
 */

const exec = async cmd => {
  return new Promise(async () => {
    try {
      await execa.shell('sudo apt update', { stdio: 'inherit' });
      await execa.shell(cmd), { stdio: 'inherit' };
      spinner.succeed(`You're good to go`);
    } catch (err) {
      spinner.fail('Something went wrong');
      throw err;
    }
  });
};

/**
 * Triggers Git installation specific to the platform
 *
 * @returns{Promise<void>}
 */

const installGit = async () => {
  const url = 'https://git-scm.com/download/win';
  if (isWin) {
    showInstallationInfo('git', spinner, url);
  } else {
    const packageMgr = isLinux ? 'apt' : 'brew';
    await exec(`${packageMgr} install git`);
  }
};

/**
 * Triggers Docker installation specific to the platform
 *
 * @returns{Promise<void>}
 */

const installDocker = async () => {
  const urlMap = {
    win32:
      'https://hub.docker.com/editions/community/docker-ce-desktop-windows',
    darwin: 'https://docs.docker.com/docker-for-mac/install/',
  };

  if (isLinux) {
    await exec('apt install docker.io');
  } else {
    showInstallationInfo('docker', spinner, urlMap[process.platform]);
  }
};

/**
 * Triggers Heroku installation specific to the platform
 *
 * @returns{Promise<void>}
 */

const installHerokuCLI = async () => {
  const url = 'https://devcenter.heroku.com/articles/heroku-cli';
  if (isWin) {
    showInstallationInfo('heroku-cli', spinner, url);
  } else {
    const cmd = isLinux
      ? 'snap install --classic heroku'
      : ['brew tap heroku/brew', 'brew install heroku'];

    if (!Array.isArray(cmd)) {
      await exec(cmd);
    } else {
      await exec(cmd[1]);
      await exec(cmd[2]);
    }
  }
};

module.exports = {
  validateInstallation,
  validateInput,
};
