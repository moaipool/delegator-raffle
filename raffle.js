#!/usr/bin/node

/** 
 * Selects a delegator at random (optionally) filtered by
 * minimum stake, epochs staked and excluded stake addresses.
 * Useful for Cardano stake pool giveaways, raffles and so on.
 * 
 * @author Will[MOAI]
 * @url https://github.com/moaipool/stakepool-raffle
 * @version 1.0
 * @license MIT License (MIT)
 */

const Blockfrost = require('@blockfrost/blockfrost-js');
require('dotenv').config()

const API = new Blockfrost.BlockFrostAPI({
  projectId: process.env.BLOCKFROST_API_KEY,
});

// user-defined parameters from .env
const poolID = process.env.POOL_ID;
const minStake = process.env.MIN_STAKE;
const minEpochs = process.env.MIN_EPOCHS;
const excludeStakeAddrs = process.env.EXCLUDED_STAKES.split(", ");
const lovelace = 1000000;

const http = require('http');
const hostname = process.env.HOSTNAME;
const port = process.env.PORT;

async function run() {

  try {

    const latestEpoch = await API.epochsLatest();
    const poolInfo = await API.poolsById( poolID );
    const poolMeta = await API.poolMetadata( poolID );
    const liveDelegators = parseInt(poolInfo['live_delegators']);
    const liveStake = parseFloat(poolInfo['live_stake'] / lovelace).formatAda(2);
    const activeStake = parseFloat(poolInfo['active_stake'] / lovelace).formatAda(2);
    const pageItems = 100;
    const totalPages = Math.floor(liveDelegators / pageItems) +1;
    var delegators = [];

    // output basic pool details
    console.log('\npoolID:', poolID);
    console.log('ticker:', poolMeta['ticker']);
    console.log('name:', poolMeta['name']);
    console.log('homepage:', poolMeta['homepage']);
    console.log('latestEpoch:', latestEpoch['epoch']);
    console.log('liveDelegators:', liveDelegators);
    console.log('liveStake:', liveStake);
    console.log('activeStake:', activeStake);
    console.log('minStake:', minStake);
    console.log('minEpochs:', minEpochs);
    console.info('excludeStakeAddrs:', excludeStakeAddrs);

    // fetch all delegators within API limit of 100/req
    console.log('\nfetching delegators...');
    for (n = 1; n <= totalPages; n++) {
      let paginationOptions = { page: n, count: pageItems };
      console.log(n, 'of' ,totalPages, 'pages');
      const response = await API.poolsByIdDelegators( poolID, paginationOptions );
      delegators.push(...response);
    }
    console.log('got', delegators.length, 'delegators');
   
    let valid = false;
    let discard = [];

    console.log('\n🏁 starting raffle...');
    mainLoop:
    do {
      
      var index = randomInt(liveDelegators, discard);
      var randomDeleg = delegators[index];
      console.log('\ntrying address:', randomDeleg['address'] + ' [ '+index+' ]');
      console.log('live stake:', randomDeleg['live_stake']);

      // discard if insufficient minimum live stake (avoids further API calls)
      if (minStake != null && parseInt(randomDeleg['live_stake']) < minStake) {
        console.log('🚫 discard: insufficient minStake');
        discard.push(index);
        continue;
      }

      // discard excluded stake addresses
      for (i = 0; i < excludeStakeAddrs.length; i++) {
        if (excludeStakeAddrs[i] == randomDeleg['address']) {
          console.log('excluded stake:', randomDeleg['address']);
          discard.push(index);
          continue mainLoop;
        }
      }

      // fetch account info for active epoch & controlled stake
      var accountInfo = await API.accounts(randomDeleg['address']);
      console.log('active epoch:', accountInfo['active_epoch']);

      if ( accountInfo['pool_id'] == poolID ) {
        if ( latestEpoch['epoch'] - accountInfo['active_epoch'] >= minEpochs ) {
          if ( parseInt(accountInfo['controlled_amount']) >= minStake ) {
            console.log('** valid stake address found');
            console.log('active stake:', accountInfo['controlled_amount'], '(', parseFloat(accountInfo['controlled_amount'] / lovelace).formatAda(2), ') since epoch', accountInfo['active_epoch']);

            // fetch associated addresses for account
            var accountAddresses = await API.accountsAddresses(randomDeleg['address']);
            valid = true;
          } else {
            console.log('🚫 discard: insufficient minStake');
          }
        } else {
          console.log('🚫 discard: insufficient minEpochs');
        }
      } else {
        console.log('🚫 discard: no poolID match');
      }
      if (!valid) discard.push(index);
      
    } while (!valid && discard.length < delegators.length);
    
    if (valid) {
      console.log('🎉 selected stake:', randomDeleg['address']);
      console.log('\nassociated addresses:');
      for (var item of accountAddresses) {
        console.log(item.address);
      }
      console.info('\ndiscarded', discard);
    } else {
      console.log('no valid stake addresses found')
      console.info('discarded', discard);
    }

  } catch (err) {
    console.log('error occurred:', err);
  }
}

function randomInt(size, exclude) {
  while (true) {
    var rnd = Math.floor(Math.random() * size);
    if (!exclude.includes(rnd)) {
      break;
    }
  }
  return rnd;
}

/**
 * formatAda(n, x)
 * 
 * @param integer n: length of decimal
 * @param integer x: length of sections
 */
Number.prototype.formatAda = function(n, x) {
    var re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\.' : '$') + ')';
    return this.toFixed(Math.max(0, ~~n)).replace(new RegExp(re, 'g'), '$&,') + ' ₳';
};

async function serverStart() {
    const server = http.createServer((req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    res.end('<h3>Started...</h3>');
  });

  server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
  });
}

serverStart();
run();
