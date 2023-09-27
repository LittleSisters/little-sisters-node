# Little Sisters

[Filecoin](https://filecoin.io/) is an ideal place for long-term storage of CCTV footage: people need to be able to provide evidence of their innocence, or convict someone guilty of a crime. A video recording whose hash is stored in the blockchain can be solid evidence in any case.

The performance of the main Filecoin network is not enough to process a large number of files from thousands of video cameras, and here [IPC](https://ipc.space/) comes to our aid - now we can create separate subnets for cities or organizations.

AI processing of video recordings using decentralized services like [Lilypad](https://docs.lilypadnetwork.org/) makes it possible to extract car license plates from video recordings, identify individuals, find potentially dangerous behavior and register other events.

[Tableland](https://tableland.xyz/) allows you to securely store data and run aggregate queries against tables across multiple networks at once, making it easy to find the records you need.

Together, these decentralized services create a public surveillance and storage system that can be used by human rights defenders around the world.

And of course, such a system can generate income by providing the services and store encrypted records for commercial companies.

## Diagram

![alt text](/docs/diagram.png "Little Sister Tableland Diagram")

## Usage

First, clone this repo:

```sh
git clone https://github.com/LittleSisters/little-sisters-node.git
```
## .env Configuration
Configure .env file with your credentials. Copy env.example to .env and fill in LIGHTHOUSE_API_KEY.
You may not need to fill in other variables if you are not going to use other networks.
```
LIGHTHOUSE_API_KEY=

SISTERS_CONTRACT=0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
TBL_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
TBL_CHAIN=local-tableland
TBL_PROVIDER_URL=http://127.0.0.1:8545/

# test nets
FILECOIN_CALIBRATION_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```
### Lighthouse API key
To obtain a Lighthouse API key install CLI tool https://docs.lighthouse.storage/lighthouse-1/cli-tool/overview
```
npm install -g @lighthouse-web3/sdk
lighthouse-web3 import-wallet --key <private_key>
lighthouse-web3 api-key --new
```
## Recording Configuration
Check `recorder.config.json` for cameras configuration. You can find another open cameras on the internet
https://www.google.com/search?q=inurl%3Amjpg%2Fvideo.mjpg

* `recordings_directory` - directory where recordings will be stored
* `seg` - segment duration in seconds (30 seconds for testing purposes, in real life it can be from hour to day)
* `cmd` - for now  ffmpeg used to store recordings, but it can be changed to any other tool, or proxied with [mediamtx](https://github.com/bluenviron/mediamtx).
  File names must be `cameraID_unixTimeStampStart_unixTimeStampEnd.ext` i.e. `cam1_1634170800_1634171100.mp4` to be properly processed.
* `cameras` - array of cameras to record from. These parameters substituted to ffmpeg command. Also, these parameters saved to the `evts` table.
* * `id` - id
* * `src` - source url
* * `adr` - address
* * `gps` - gps coordinates

## Local Run
### Build & deploy

To simply compile contracts, you can install dependencies with 
```sh
npm install
```
and then run:

```sh
npm run build
```

To install packages, compile contracts, and also startup Local Tableland and Hardhat nodes, run the following:

```sh
npm run up
```

This will keep the nodes running until you exit the session. While this is running, you can then choose to deploy the contracts to these local networks by opening a new terminal window and running:

```sh
npm run deploy:up
```

Run Little Sisters node:
```sh
npm run sister
```

It will start 
1. recording from the cameras and saving the segment files to the local directory 
2. uploading the recordings to the LightHouse
3. adding the recordings to the local Tableland
4. in future video files will be AI processed (locally or using Lillypad) and found events will be added to the Tableland.

You can view `recs` and `evts` tables data by [querying the local Tableland](https://docs.tableland.xyz/quickstarts/local-tableland#rest-api) REST API:
* [Recordings](http://localhost:8080/api/v1/query?statement=select%20%2A%20from%20recs_31337_2)
* [Events (and Metadata)](http://localhost:8080/api/v1/query?statement=select%20%2A%20from%20evts_31337_3)

## UI

UI for the Little Sisters is out of scope for this proof-of-concept. It can be easily developed in the future if this PoC interests users. 
It will be able to search and view recordings and events aggregated from many IPC subnets using Tableland's SQL subset in the browser or mobile app, view current streams and more.

## IPC Node Run
Run IPC node on claibration network as described in [quickstart-calibration]( https://github.com/consensus-shipyard/ipc-agent/blob/main/docs/quickstart-calibration.md).
[YouTube video with walkthrough](https://www.youtube.com/watch?v=5ik6y3n53mk) is very helpful too.
Do not forget to deploy [IPC Gateway](https://github.com/consensus-shipyard/ipc-agent/blob/main/docs/quickstart-calibration.md#step-11-deploy-ipc-gateway-optional).
Note your subnet chainId.

1. Fund you signer address on new subnet. See ipc-agent cross-msg [fund](https://github.com/consensus-shipyard/ipc-agent/blob/main/docs/usage.md#fund) command.
2. Deploy [Tableland EVM Contracts](https://github.com/tablelandnetwork/evm-tableland.git) to the new subnet. Add subnet config to hardhat.config.ts before deployment.
3. Run [Tableland Validator Node](https://github.com/tablelandnetwork/go-tableland) with new subnet config.
4. Add subnet to `hardhat.config.ts` in this repo.
4. Add to `contracts/Deployments.sol` subnet chainId and deployed Tableland EVM Contract address.
5. Deploy Sister contract to the new subnet: `npm run deploy -- --network <subnet_name>`
6. Change `SISTERS_CONTRACT` in `.env` to the deployed contract address. Update `TBL_PROVIDER_URL` and other env vars, if needed.
7. Run Little Sisters node: `npm run sister`

Running Little Sisters node on IPC subnet is the same as on local subnet but setup is much complicated.
After we ran testnet node, you will be able to run Little Sisters node on IPC testnet with ease.

## License

MIT AND Apache-2.0,
© 2023 Bogdoslavik,
Telegram [@bogdoslav](https://t.me/bogdoslav)

