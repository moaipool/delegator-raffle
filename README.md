# 🎟 delegator-raffle

Selects a delegator at random (optionally) filtered by several criteria. Useful for stake pool giveaways, raffles and so on.

## Getting started

### Blockfrost
This tool makes use of the Blockfrost API. You first need to [sign into your Blockfrost account](https://blockfrost.io/auth/signin) before using this. After signing in, create a new project and retrieve your API key.

<img width="800" alt="image" src="https://user-images.githubusercontent.com/84546123/162750140-33225497-26c9-4be8-b2bc-3c5f665ee612.png">

### Installation
Begin by cloning the `delegator-raffle` repository and change into the directory. To run this project you need Node.js version 14 or higher. It's recommend to setup up your own Node.js backend. Exposing your API keys in a frontend application is usually a bad idea. You may directly import the `blockfrost-js` SDK by using your favorite package manager:

```
npm i @blockfrost/blockfrost-js
```
or
```
yarn add @blockfrost/blockfrost-js
```

In addition to this, you will need the `dotenv` package. This is a zero-dependency module that loads environment variables from a `.env` file into `process.env`. You may install it like so:

```
npm i dotenv
```
or
```
yarn add dotenv
```
No other dependencies are required.

### Usage
Copy `.env_example` to `.env` and edit the placeholder values:

```
# Your blockfrost API key https://blockfrost.io/
BLOCKFROST_API_KEY = "your API key goes here"

# The ID of the Cardano stake pool
POOL_ID = "your pool ID goes here"

# Minimum amount staked in Lovelace 
MIN_STAKE = 500000000
...
```

If you wish, define a minimum amount of active stake and any stake addresses to exclude (for example, the pool pledge, owners and so on). By default only active, rather than live, delegator stakes are evaluated. You may also define a different stake period by adjusting the `MIN_EPOCHS` value.

Finally, execute it with Node.js:

```
node raffle.js
```

### Example
The app will fetch some basic and extended pool attributes, then retrieve a list of all live delegators. A delegator stake address is selected at random and evaluated against your defined parameters. Discarded tickets are stored and the process continues until the next random valid address is found. Finally, a list of [addresses associated with the stake address](https://docs.blockfrost.io/#tag/Cardano-Accounts/paths/~1accounts~1{stake_address}~1addresses/get) is returned. 

```
Server running at http://127.0.0.1:3000/

poolID: pool12wpfng6cu7dz38yduaul3ngfm44xhv5xmech68m5fwe4wu77udd
ticker: APEX
name: Apex Cardano Pool
homepage: https://apexpool.info/
latestEpoch: 332
liveDelegators: 260
liveStake: 23,293,059.57 ₳
activeStake: 24,859,756.28 ₳
minStake: 500000000
minEpochs: 0
excludeStakeAddrs: [
  'stake1uyex7u0srupclx0hmpukjqes4uvg7yu0u9l8xhn5rruykfgzccyas',
  'stake1uyf95em48dd9zq3dfuuqvv7a77smmm22grjf3qk3m9n5dvs392pmu'
]

fetching delegators...
1 of 3 pages
2 of 3 pages
3 of 3 pages
got 260 delegators

🏁 starting raffle...

trying address: stake1u90hlahr5myz3kyvnntd9aejzl3sr3javk93gfk4flny89qqkyq0y [ 132 ]
live stake: 33432268
🚫 discard: insufficient minStake

trying address: stake1uxmffhkzmyq4x7u28zc9mgv6kahcr8fc3m5rn7lr80l56pcnjgh26 [ 40 ]
live stake: 86944259
🚫 discard: insufficient minStake

trying address: stake1u9dftlvlxlpl0adp9tcgrqfkdxuh46jyd3jry3vtexpn29cga20cc [ 255 ]
live stake: 1780270
🚫 discard: insufficient minStake

trying address: stake1u9hufxcrjn56t7fqke9wyl5aealsrqzydd70xs9yln3c9vcj3994t [ 140 ]
live stake: 4623412481
active epoch: 315
** valid stake address found
active stake: 4623412481 ( 4,623.41 ₳ ) since epoch 315
🎉 selected stake: stake1u9hufxcrjn56t7fqke9wyl5aealsrqzydd70xs9yln3c9vcj3994t

associated addresses:
addr1q892s9c0xy5gfs453ytzvqj46kqravg3nukena93wykkhzn0cjds898f5hujpdj2uflfmnmlqxqyg6mu7dq2fl8rs2es7npqs9
addr1qywsvaenu6xg4rpc3zy8puqjkq3ljygngmemt6h6xkmpwfn0cjds898f5hujpdj2uflfmnmlqxqyg6mu7dq2fl8rs2esz7fndg
..
discarded [ 132, 40, 255 ]
```

### Error handling
The Blockfrost Node.js SDK throws 2 types of errors, `BlockfrostServerError` and `BlockfrostClientError`. These are caught and reported by the application.
