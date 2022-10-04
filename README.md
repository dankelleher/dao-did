# DAO DID

Demo using DIDs and IPFS to store metadata for a realm.

## Usage

```shell
nvm use # This project uses node 18
yarn
```

NOTE: These examples use [infura](https://infura.io/) as an IPFS gateway. To pin data, you need a (free) account.
Obtain a project id and secret, then do:

```shell
export INFURA_PROJECT_ID=xxx
export INFURA_PROJECT_SECRET=xxx
```

Simplest possible example generates a key, and signs and executes the tx.

```shell
yarn store
```

Retrieve the data using the following (passing the key generated above)

```shell
yarn lookup <KEY>
```

To use against a real governance:

```shell
yarn store-for-realm <GOVERNANCE> <TREASURY>
```

Take the resultant serialised transactions, and add them to a proposal in Realms.