import * as IPFS from "ipfs-http-client";
import {DidSolIdentifier, DidSolService} from '@identity.com/sol-did-client';
import {clusterApiUrl, Connection, PublicKey} from "@solana/web3.js";
import { serializeInstructionToBase64 } from "@solana/spl-governance"
import * as fs from "fs";

if (process.argv.length < 4) {
    console.log("Usage: yarn store-for-realm <REALM> <TREASURY>");
    process.exit(1);
}

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

const governance = new PublicKey(process.argv[2])
// for rent payment
const treasury = new PublicKey(process.argv[3])
const did = `did:sol:devnet:${governance.toString()}`;

const connection = new Connection(clusterApiUrl('devnet'));

(async () => {
    const didService = DidSolService.build(
        DidSolIdentifier.parse(did),
        {
            connection,
            wallet: {
                publicKey: governance,
                // Can be no-ops when using spl-governance to sign
                signTransaction : async (tx) => tx,
                signAllTransactions : async (txs) => txs
            }
        }
    );

    console.log("Load the metadata file and send to ipfs");
    const file = fs.readFileSync(metadataFile);
    const { cid } = await ipfsClient.add(file)

    console.log(`Cid is ${cid}`);

    console.log("Writing to the DID");
    const instructions = await didService.addService({
        fragment: "realmMetadata",
        serviceEndpoint: "cid://" + cid,
        serviceType: "DataStore"
    }, true)
        .withAutomaticAlloc(treasury)
        .instructions();
        // .rpc({ skipPreflight: true })

    console.log(`Instructions for writing ${metadataFile} to DID ${did} with CID ${cid}. Send these to Realms to create a proposal`);

    console.log(instructions.map(serializeInstructionToBase64));

})().catch(console.error)