import {DidSolIdentifier, DidSolService} from '@identity.com/sol-did-client';
import {clusterApiUrl, Connection, PublicKey} from "@solana/web3.js";

if (process.argv.length < 3) {
    console.log("Usage: yarn lookup <GOVERNANCE>");
    process.exit(1);
}

const governance = new PublicKey(process.argv[2])
const did = `did:sol:devnet:${governance.toString()}`;
const connection = new Connection(clusterApiUrl('devnet'));

const didService = DidSolService.build(
    DidSolIdentifier.parse(did),
    { connection }
);

(async () => {
    const document = await didService.resolve();
    const service = document.service?.find(s => s.id.endsWith("#realmMetadata"));

    if (service) {
        const cid = service.serviceEndpoint.split("cid://")[1];
        const metadata = await fetch(`https://ipfs.io/ipfs/${cid}`).then(r => r.json());
        console.log(metadata);
    } else {
        console.log("no metadata found");
    }


})().catch(console.error)