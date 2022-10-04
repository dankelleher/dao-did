import * as IPFS from "ipfs-http-client";
import {DidSolIdentifier, DidSolService} from '@identity.com/sol-did-client';
import {clusterApiUrl, Connection, Keypair, LAMPORTS_PER_SOL} from "@solana/web3.js";
import * as fs from "fs";

const { INFURA_PROJECT_ID, INFURA_PROJECT_SECRET } = process.env;

const metadataFile = "metadata.json"

const ipfsClient = IPFS.create({
    host: "ipfs.infura.io",
    port: 5001,
    protocol: "https",
    headers: {
        authorization: `Basic ${Buffer.from(
            `${INFURA_PROJECT_ID || ""}:${INFURA_PROJECT_SECRET || ""}`
        ).toString("base64")}`
    },
})

// TODO replace with realm address
const key = Keypair.generate();
const realm = key.publicKey;
const did = `did:sol:devnet:${realm.toString()}`;

console.log("Storing data for " + realm.toBase58());

const connection = new Connection(clusterApiUrl('devnet'));

(async () => {
    const didService = DidSolService.build(
        DidSolIdentifier.parse(did),
        {
            connection,
            wallet: {
                publicKey: realm,
                // TODO Can be no-ops when using spl-governance to sign
                signTransaction : async (tx) => {
                    tx.sign(key);
                    return tx;
                },
                signAllTransactions : async (txs) => {
                    txs.forEach(tx => tx.sign(key));
                    return txs;
                }
            }
        }
    );

    console.log(`Airdropping to ${realm}...`)
    const airdrop = await connection.requestAirdrop(realm, LAMPORTS_PER_SOL);
    const blockhash = await connection.getLatestBlockhash();
    await connection.confirmTransaction({ signature: airdrop, ...blockhash });

    console.log("Load the metadata file and send to ipfs");
    const file = fs.readFileSync(metadataFile);
    const { cid } = await ipfsClient.add(file)

    console.log(`Cid is ${cid}`);

    console.log("Writing to the DID");
    await didService.addService({
        fragment: "realmMetadata",
        serviceEndpoint: "cid://" + cid,
        serviceType: "DataStore"
    }, true)
        .withAutomaticAlloc(realm)  // TODO this should be the treasury in Realms
        .rpc();

    console.log(`Written ${metadataFile} to DID ${did} with CID ${cid}`);
})().catch(console.error)